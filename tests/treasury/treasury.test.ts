import { buildTreasurySnapshot, calculateRecurringMonthlyUsd, calculateRunwayMonths, sampleLedger } from "../../services/treasury/index.js";

describe("treasury", () => {
  test("calculates recurring burn from recurring negative entries", () => {
    const recurring = calculateRecurringMonthlyUsd(sampleLedger());
    expect(recurring).toBeGreaterThan(0);
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
  });
});
