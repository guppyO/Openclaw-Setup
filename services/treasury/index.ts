import { loadLocalRuntimeEnv } from "../common/env-loader.js";
import { readJsonFile, resolveRepoPath } from "../common/fs.js";
import { convertToUsd, loadFxSnapshot } from "./fx.js";
import type {
  BudgetEnvelope,
  LedgerEntry,
  TreasuryBalance,
  TreasuryAuthMode,
  TreasuryCapabilityFlags,
  TreasurySnapshot,
} from "../common/types.js";
import { renderTable } from "../common/markdown.js";

export const DEFAULT_TREASURY_CAPABILITIES: TreasuryCapabilityFlags = {
  balanceRead: false,
  statementRead: false,
  cardTransactionRead: false,
  recipientManagement: false,
  transferCreation: false,
  spendControls: false,
  spendLimits: false,
  webhooks: false,
  psd2LimitedActions: true,
  browserLaneAvailable: false,
  personalTokenConfigured: false,
  oauthAppConfigured: false,
  emailReceiptIngest: false,
};

export function sampleLedger(): LedgerEntry[] {
  return [
    {
      id: "ledger-hetzner",
      bookedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      merchant: "Hetzner",
      amount: -14.92,
      currency: "USD",
      category: "hosting",
      initiativeId: "control-plane",
      recurring: true,
      notes: "Baseline control-plane VPS assumption.",
      budgetTag: "ops:hosting",
      source: "sample",
      evidencePaths: ["docs/treasury/capabilities.md"],
    },
    {
      id: "ledger-domain",
      bookedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      merchant: "Cloudflare Registrar",
      amount: -12.0,
      currency: "USD",
      category: "domains",
      initiativeId: "distribution-foundation",
      recurring: false,
      notes: "Initial launch-domain purchase.",
      budgetTag: "growth:domains",
      source: "sample",
      evidencePaths: ["docs/portfolio/lane-catalog.md"],
    },
    {
      id: "ledger-revenue",
      bookedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      merchant: "Pilot customer",
      amount: 450.0,
      currency: "USD",
      category: "revenue",
      initiativeId: "ops-audit-packs",
      recurring: false,
      notes: "Sample pilot revenue for dashboard and ROI wiring.",
      budgetTag: "revenue:services",
      source: "sample",
      evidencePaths: ["docs/experiments/exp-ops-audit-packs.md"],
    },
  ];
}

export function sampleBalances(): TreasuryBalance[] {
  return [
    { currency: "USD", amount: 2500 },
    { currency: "GBP", amount: 400 },
  ];
}

const DEFAULT_FX_SNAPSHOT: TreasurySnapshot["fx"] = {
  base: "USD",
  asOf: null,
  rates: {},
  source: "missing",
  stale: true,
};

export function calculateRecurringMonthlyUsd(
  ledger: LedgerEntry[],
  fx: TreasurySnapshot["fx"] = DEFAULT_FX_SNAPSHOT,
): number {
  return Number(
    ledger
      .filter((entry) => entry.recurring && entry.amount < 0)
      .reduce((total, entry) => {
        const amountUsd = convertToUsd(Math.abs(entry.amount), entry.currency, fx);
        return total + (amountUsd ?? 0);
      }, 0)
      .toFixed(2),
  );
}

export function calculateRunwayMonths(balanceUsd: number, recurringMonthlyUsd: number): number | null {
  if (recurringMonthlyUsd <= 0) {
    return null;
  }
  return Number((balanceUsd / recurringMonthlyUsd).toFixed(1));
}

export function defaultBudgetEnvelopes(): BudgetEnvelope[] {
  return [
    {
      category: "hosting",
      dailyUsd: 10,
      weeklyUsd: 40,
      monthlyUsd: 120,
      requiresExperimentTag: false,
    },
    {
      category: "domains",
      dailyUsd: 20,
      weeklyUsd: 60,
      monthlyUsd: 120,
      requiresExperimentTag: true,
    },
    {
      category: "marketplace-fees",
      dailyUsd: 20,
      weeklyUsd: 100,
      monthlyUsd: 250,
      requiresExperimentTag: true,
    },
    {
      category: "paid-acquisition",
      dailyUsd: 25,
      weeklyUsd: 125,
      monthlyUsd: 300,
      requiresExperimentTag: true,
    },
    {
      category: "tools-and-data",
      dailyUsd: 15,
      weeklyUsd: 75,
      monthlyUsd: 200,
      requiresExperimentTag: true,
    },
  ];
}

export function detectTreasuryAuthMode(capabilities: TreasuryCapabilityFlags): TreasuryAuthMode {
  if (capabilities.personalTokenConfigured && capabilities.browserLaneAvailable) {
    return "hybrid";
  }
  if (capabilities.oauthAppConfigured) {
    return "partner-oauth";
  }
  if (capabilities.personalTokenConfigured) {
    return "personal-token";
  }
  if (capabilities.browserLaneAvailable) {
    return "browser-only";
  }
  return "none";
}

export function detectTreasuryMode(capabilities: TreasuryCapabilityFlags): TreasurySnapshot["mode"] {
  if (capabilities.balanceRead && capabilities.browserLaneAvailable) {
    return "hybrid-live";
  }
  if (capabilities.balanceRead) {
    return "live-api";
  }
  if (capabilities.browserLaneAvailable || capabilities.emailReceiptIngest) {
    return "browser-only";
  }
  return "sample";
}

export function rollingWiseStatementWindow(now = new Date()): {
  intervalStart: string;
  intervalEnd: string;
} {
  const intervalEnd = new Date(now);
  const intervalStart = new Date(now);
  intervalStart.setUTCDate(intervalStart.getUTCDate() - 30);

  return {
    intervalStart: intervalStart.toISOString(),
    intervalEnd: intervalEnd.toISOString(),
  };
}

async function loadAppendOnlyLedgerImport(): Promise<LedgerEntry[]> {
  return readJsonFile<LedgerEntry[]>(
    resolveRepoPath("data", "imports", "wise-ledger-import.json"),
    [],
  );
}

function deriveLedgerTruth(
  mode: TreasurySnapshot["mode"],
  capabilities: TreasuryCapabilityFlags,
  balances: TreasuryBalance[],
  ledger: LedgerEntry[],
): Pick<TreasurySnapshot, "cashTruth" | "ledgerStatus" | "ledgerCoverageNote"> {
  if (mode === "sample") {
    return {
      cashTruth: "sample",
      ledgerStatus: "sample",
      ledgerCoverageNote: "Sample balances and sample ledger are active because no live Wise lane is verified yet.",
    };
  }

  const cashTruth = balances.length > 0 ? "live-known" : "unknown";
  if (ledger.length === 0) {
    return {
      cashTruth,
      ledgerStatus: "unavailable",
      ledgerCoverageNote:
        "No append-only ledger entries are available yet. Treasury can report live balances only when the active lane exposes them.",
    };
  }

  if (capabilities.statementRead || capabilities.cardTransactionRead) {
    return {
      cashTruth,
      ledgerStatus: "complete",
      ledgerCoverageNote:
        "Ledger entries exist and the current Wise capability probe can read transactional history, so reconciliation can be treated as materially complete.",
    };
  }

  return {
    cashTruth,
    ledgerStatus: "partial",
    ledgerCoverageNote:
      "Balances or receipts exist, but the current Wise lane cannot guarantee complete statement coverage yet. Treat burn and ROI as partial.",
  };
}

export function buildTreasurySnapshot(
  capabilities = DEFAULT_TREASURY_CAPABILITIES,
  options: {
    balances?: TreasuryBalance[];
    ledger?: LedgerEntry[];
    fx?: TreasurySnapshot["fx"];
  } = {},
): TreasurySnapshot {
  const mode = detectTreasuryMode(capabilities);
  const balances =
    options.balances ?? (mode === "sample" ? sampleBalances() : []);
  const ledger =
    options.ledger ?? (mode === "sample" ? sampleLedger() : []);
  const fx = options.fx ?? {
    base: "USD",
    asOf: null,
    rates: {},
    source: "missing",
    stale: true,
  };
  const recurringMonthlyUsd = calculateRecurringMonthlyUsd(ledger, fx);
  const totalUsdApprox = balances.reduce((total, balance) => {
    if (balance.currency === "USD") {
      return total + balance.amount;
    }

    const rate = fx.rates[balance.currency];
    if (!rate) {
      return total;
    }

    return total + balance.amount * rate;
  }, 0);
  const truth = deriveLedgerTruth(mode, capabilities, balances, ledger);

  return {
    asOf: new Date().toISOString(),
    mode,
    authMode: detectTreasuryAuthMode(capabilities),
    capabilities,
    balances,
    ledger,
    cashTruth: truth.cashTruth,
    ledgerStatus: truth.ledgerStatus,
    ledgerCoverageNote: truth.ledgerCoverageNote,
    recurringMonthlyUsd,
    runwayMonths: calculateRunwayMonths(totalUsdApprox, recurringMonthlyUsd),
    suspiciousSpendCount: ledger.filter((entry) => entry.amount < -250 && entry.category !== "hosting").length,
    budgetEnvelopes: defaultBudgetEnvelopes(),
    pendingReconciliations: ledger.filter((entry) => !entry.evidencePaths || entry.evidencePaths.length === 0).length,
    fx,
  };
}

export async function probeWiseCapabilities(): Promise<TreasuryCapabilityFlags> {
  await loadLocalRuntimeEnv();

  const token = process.env.WISE_API_TOKEN;
  const profileId = process.env.WISE_PROFILE_ID;
  const baseUrl = process.env.WISE_BASE_URL ?? "https://api.wise.com";
  const oauthClientId = process.env.WISE_OAUTH_CLIENT_ID;
  const oauthClientSecret = process.env.WISE_OAUTH_CLIENT_SECRET;
  const browserLaneAvailable = Boolean(process.env.WISE_EMAIL && (process.env.WISE_PASSWORD || process.env.WISE_PASSKEY));
  const emailReceiptIngest = Boolean(process.env.COMPANY_GMAIL_EMAIL && process.env.COMPANY_GMAIL_PASSWORD);

  if (!token || !profileId) {
    return {
      ...DEFAULT_TREASURY_CAPABILITIES,
      browserLaneAvailable,
      personalTokenConfigured: Boolean(token),
      oauthAppConfigured: Boolean(oauthClientId && oauthClientSecret),
      emailReceiptIngest,
    };
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const interval = rollingWiseStatementWindow();

  async function check(apiPath: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseUrl}${apiPath}`, { headers });
      return response.ok;
    } catch {
      return false;
    }
  }

  const balanceRead = await check(`/v4/profiles/${profileId}/balances?types=STANDARD`);
  const profilesReadable = await check("/v1/profiles");
  const statementRead = await check(
    `/v1/profiles/${profileId}/balance-statements?currency=GBP&intervalStart=${encodeURIComponent(interval.intervalStart)}&intervalEnd=${encodeURIComponent(interval.intervalEnd)}&type=COMPACT`,
  );

  return {
    balanceRead: balanceRead && profilesReadable,
    statementRead,
    cardTransactionRead: false,
    recipientManagement: false,
    transferCreation: false,
    spendControls: false,
    spendLimits: false,
    webhooks: false,
    psd2LimitedActions: true,
    browserLaneAvailable,
    personalTokenConfigured: true,
    oauthAppConfigured: Boolean(oauthClientId && oauthClientSecret),
    emailReceiptIngest,
  };
}

export async function ingestWiseBalances(): Promise<TreasuryBalance[]> {
  await loadLocalRuntimeEnv();

  const token = process.env.WISE_API_TOKEN;
  const profileId = process.env.WISE_PROFILE_ID;
  const baseUrl = process.env.WISE_BASE_URL ?? "https://api.wise.com";

  if (!token || !profileId) {
    return [];
  }

  try {
    const response = await fetch(`${baseUrl}/v4/profiles/${profileId}/balances?types=STANDARD`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as Array<Record<string, unknown>>;
    return payload
      .map((entry) => {
        const amount = Number((entry.amount as Record<string, unknown> | undefined)?.value ?? NaN);
        const currency = String(entry.currency ?? "");
        if (!currency || Number.isNaN(amount)) {
          return null;
        }
        return { currency, amount };
      })
      .filter((entry): entry is TreasuryBalance => entry !== null);
  } catch {
    return [];
  }
}

export async function buildRuntimeTreasurySnapshot(): Promise<TreasurySnapshot> {
  const capabilities = await probeWiseCapabilities();
  const fx = await loadFxSnapshot();
  const mode = detectTreasuryMode(capabilities);
  const balances = capabilities.balanceRead ? await ingestWiseBalances() : mode === "sample" ? sampleBalances() : [];
  const importedLedger = await loadAppendOnlyLedgerImport();
  const ledger = mode === "sample" ? sampleLedger() : importedLedger;

  return buildTreasurySnapshot(capabilities, {
    balances,
    ledger,
    fx,
  });
}

export function buildTreasuryMarkdown(snapshot: TreasurySnapshot): string {
  const capabilityRows = Object.entries(snapshot.capabilities).map(([capability, enabled]) => [
    capability,
    enabled ? "yes" : "no",
  ]);
  const balanceRows = snapshot.balances.map((balance) => [balance.currency, balance.amount.toFixed(2)]);
  const budgetRows = snapshot.budgetEnvelopes.map((envelope) => [
    envelope.category,
    `$${envelope.dailyUsd}`,
    `$${envelope.weeklyUsd}`,
    `$${envelope.monthlyUsd}`,
    envelope.requiresExperimentTag ? "yes" : "no",
  ]);

  return `# Treasury State

## Mode

- Snapshot mode: ${snapshot.mode}
- FX source: ${snapshot.fx.source}${snapshot.fx.stale ? " (stale or missing)" : ""}
- Cash truth: ${snapshot.cashTruth}
- Ledger status: ${snapshot.ledgerStatus}
- Coverage note: ${snapshot.ledgerCoverageNote}

## Auth mode

- Active treasury auth mode: ${snapshot.authMode}
- Pending reconciliations: ${snapshot.pendingReconciliations}

## Balances

${renderTable(["Currency", "Amount"], balanceRows)}

## Capability probe

${renderTable(["Capability", "Enabled"], capabilityRows)}

## Budget envelopes

${renderTable(["Category", "Daily", "Weekly", "Monthly", "Requires tag"], budgetRows)}

## Policy notes

- Treat Wise capability as runtime-discovered, not assumed.
- Freeze autonomous spend outside explicit envelopes or when probe confidence drops.
- Use the Wise API where the current auth mode supports it, but route unsupported actions through a browser lane with evidence capture.
- Do not present sample balances as live when credentials exist but real balance ingest is unavailable.
- Tag every outgoing spend to a category and initiative whenever possible.
`;
}
