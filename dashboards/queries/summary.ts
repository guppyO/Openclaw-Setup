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
    if (balance.currency === "USD") {
      return total + balance.amount;
    }

    const rate = state.treasury.fx.rates[balance.currency];
    if (!rate) {
      return total;
    }

    return total + balance.amount * rate;
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
