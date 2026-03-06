import { loadLocalRuntimeEnv } from "../common/env-loader.js";
import type {
  BudgetEnvelope,
  LedgerEntry,
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

export function calculateRecurringMonthlyUsd(ledger: LedgerEntry[]): number {
  return Number(
    ledger
      .filter((entry) => entry.recurring && entry.amount < 0)
      .reduce((total, entry) => total + Math.abs(entry.amount), 0)
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

export function buildTreasurySnapshot(
  capabilities = DEFAULT_TREASURY_CAPABILITIES,
  ledger = sampleLedger(),
): TreasurySnapshot {
  const balances = [
    { currency: "USD", amount: 2500 },
    { currency: "GBP", amount: 400 },
  ];
  const recurringMonthlyUsd = calculateRecurringMonthlyUsd(ledger);
  const totalUsdApprox = balances.reduce((total, balance) => {
    const multiplier = balance.currency === "GBP" ? 1.27 : 1;
    return total + balance.amount * multiplier;
  }, 0);

  return {
    asOf: new Date().toISOString(),
    authMode: detectTreasuryAuthMode(capabilities),
    capabilities,
    balances,
    ledger,
    recurringMonthlyUsd,
    runwayMonths: calculateRunwayMonths(totalUsdApprox, recurringMonthlyUsd),
    suspiciousSpendCount: ledger.filter((entry) => entry.amount < -250 && entry.category !== "hosting").length,
    budgetEnvelopes: defaultBudgetEnvelopes(),
    pendingReconciliations: ledger.filter((entry) => !entry.evidencePaths || entry.evidencePaths.length === 0).length,
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
    `/v1/profiles/${profileId}/balance-statements?currency=GBP&intervalStart=2026-03-01T00:00:00Z&intervalEnd=2026-03-06T00:00:00Z&type=COMPACT`,
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
- Tag every outgoing spend to a category and initiative whenever possible.
`;
}
