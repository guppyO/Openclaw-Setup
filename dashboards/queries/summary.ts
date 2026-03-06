import type { DashboardState } from "../../services/common/types.js";

export interface DashboardSummary {
  balanceUsdApprox: number;
  topOpportunityTitle: string;
  activeExperimentCount: number;
  queueDepth: number;
  readyQueueDepth: number;
  driftedAnchorCount: number;
  blockerCount: number;
}

export function summarizeDashboard(state: DashboardState): DashboardSummary {
  const balanceUsdApprox = state.treasury.balances.reduce((total, balance) => {
    const multiplier = balance.currency === "GBP" ? 1.27 : 1;
    return total + balance.amount * multiplier;
  }, 0);

  return {
    balanceUsdApprox: Number(balanceUsdApprox.toFixed(2)),
    topOpportunityTitle: state.topOpportunities[0]?.title ?? "None yet",
    activeExperimentCount: state.activeExperiments.length,
    queueDepth: state.queue.length,
    readyQueueDepth: state.dispatch.readyQueue.length,
    driftedAnchorCount: state.anchors.filter((anchor) => anchor.status === "drifted").length,
    blockerCount: state.blockers.length,
  };
}
