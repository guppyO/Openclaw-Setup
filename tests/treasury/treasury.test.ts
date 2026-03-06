import {
  buildTreasurySnapshot,
  calculateRecurringMonthlyUsd,
  calculateRunwayMonths,
  rollingWiseStatementWindow,
  sampleLedger,
} from "../../services/treasury/index.js";

describe("treasury", () => {
  test("calculates recurring burn from recurring negative entries", () => {
    const recurring = calculateRecurringMonthlyUsd(sampleLedger());
    expect(recurring).toBeGreaterThan(0);
  });

  test("normalizes recurring burn into USD when FX is available", () => {
    const recurring = calculateRecurringMonthlyUsd(
      [
        {
          id: "gbp-hosting",
          bookedAt: new Date().toISOString(),
          merchant: "Hetzner EU",
          amount: -10,
          currency: "GBP",
          category: "hosting",
          recurring: true,
        },
      ],
      {
        base: "USD",
        asOf: new Date().toISOString(),
        rates: {
          GBP: 1.25,
        },
        source: "cached",
        stale: false,
      },
    );

    expect(recurring).toBe(12.5);
  });

  test("produces a runway when recurring costs exist", () => {
    expect(calculateRunwayMonths(1000, 100)).toBe(10);
  });

  test("builds a coherent snapshot", () => {
    const snapshot = buildTreasurySnapshot();
    expect(snapshot.balances.length).toBeGreaterThan(0);
    expect(snapshot.ledger.length).toBeGreaterThan(0);
    expect(snapshot.budgetEnvelopes.length).toBeGreaterThan(0);
    expect(snapshot.authMode).toBeDefined();
    expect(snapshot.mode).toBe("sample");
  });

  test("does not pretend browser-only mode has live sample balances", () => {
    const snapshot = buildTreasurySnapshot({
      balanceRead: false,
      statementRead: false,
      cardTransactionRead: false,
      recipientManagement: false,
      transferCreation: false,
      spendControls: false,
      spendLimits: false,
      webhooks: false,
      psd2LimitedActions: true,
      browserLaneAvailable: true,
      personalTokenConfigured: false,
      oauthAppConfigured: false,
      emailReceiptIngest: true,
    });

    expect(snapshot.mode).toBe("browser-only");
    expect(snapshot.balances).toHaveLength(0);
    expect(snapshot.ledgerStatus).toBe("unavailable");
  });

  test("marks browser-only mode partial when append-only ledger data exists", () => {
    const snapshot = buildTreasurySnapshot(
      {
        balanceRead: false,
        statementRead: false,
        cardTransactionRead: false,
        recipientManagement: false,
        transferCreation: false,
        spendControls: false,
        spendLimits: false,
        webhooks: false,
        psd2LimitedActions: true,
        browserLaneAvailable: true,
        personalTokenConfigured: false,
        oauthAppConfigured: false,
        emailReceiptIngest: true,
      },
      {
        ledger: [
          {
            id: "receipt-1",
            bookedAt: new Date().toISOString(),
            merchant: "Hetzner",
            amount: -19,
            currency: "USD",
            category: "hosting",
            recurring: true,
            source: "email",
          },
        ],
      },
    );

    expect(snapshot.ledgerStatus).toBe("partial");
    expect(snapshot.cashTruth).toBe("unknown");
  });

  test("builds a rolling Wise statement interval instead of a fixed month stub", () => {
    const interval = rollingWiseStatementWindow(new Date("2026-03-06T12:00:00.000Z"));

    expect(interval.intervalEnd).toBe("2026-03-06T12:00:00.000Z");
    expect(interval.intervalStart.startsWith("2026-02-")).toBe(true);
  });
});
