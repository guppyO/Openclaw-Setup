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
  });
});
