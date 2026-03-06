import type { LedgerEntry, TreasuryCapabilityFlags, TreasurySnapshot } from "../common/types.js";
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
    capabilities,
    balances,
    ledger,
    recurringMonthlyUsd,
    runwayMonths: calculateRunwayMonths(totalUsdApprox, recurringMonthlyUsd),
    suspiciousSpendCount: ledger.filter((entry) => entry.amount < -250 && entry.category !== "hosting").length,
  };
}

export async function probeWiseCapabilities(): Promise<TreasuryCapabilityFlags> {
  const token = process.env.WISE_API_TOKEN;
  const profileId = process.env.WISE_PROFILE_ID;
  const baseUrl = process.env.WISE_BASE_URL ?? "https://api.wise.com";

  if (!token || !profileId) {
    return DEFAULT_TREASURY_CAPABILITIES;
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

  return {
    balanceRead: balanceRead && profilesReadable,
    statementRead: false,
    cardTransactionRead: false,
    recipientManagement: false,
    transferCreation: false,
    spendControls: false,
    spendLimits: false,
    webhooks: false,
    psd2LimitedActions: true,
  };
}

export function buildTreasuryMarkdown(snapshot: TreasurySnapshot): string {
  const capabilityRows = Object.entries(snapshot.capabilities).map(([capability, enabled]) => [
    capability,
    enabled ? "yes" : "no",
  ]);
  const balanceRows = snapshot.balances.map((balance) => [balance.currency, balance.amount.toFixed(2)]);

  return `# Treasury State

## Balances

${renderTable(["Currency", "Amount"], balanceRows)}

## Capability probe

${renderTable(["Capability", "Enabled"], capabilityRows)}

## Policy notes

- Treat Wise capability as runtime-discovered, not assumed.
- Freeze autonomous spend outside explicit envelopes or when probe confidence drops.
- Tag every outgoing spend to a category and initiative whenever possible.
`;
}
