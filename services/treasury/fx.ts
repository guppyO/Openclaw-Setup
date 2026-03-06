import type { FxSnapshot } from "../common/types.js";
import { readJsonFile, resolveRepoPath } from "../common/fs.js";

export function buildMissingFxSnapshot(): FxSnapshot {
  return {
    base: "USD",
    asOf: null,
    rates: {},
    source: "missing",
    stale: true,
  };
}

export async function loadFxSnapshot(): Promise<FxSnapshot> {
  const snapshot = await readJsonFile<FxSnapshot | null>(
    resolveRepoPath("data", "exports", "fx-rates.json"),
    null,
  );

  if (!snapshot) {
    return buildMissingFxSnapshot();
  }

  const stale =
    !snapshot.asOf ||
    Date.now() - new Date(snapshot.asOf).getTime() > 24 * 60 * 60 * 1000;

  return {
    ...snapshot,
    stale,
  };
}

export function convertToUsd(amount: number, currency: string, fx: FxSnapshot): number | null {
  if (currency === "USD") {
    return amount;
  }

  const rate = fx.rates[currency];
  if (!rate) {
    return null;
  }

  return Number((amount * rate).toFixed(2));
}
