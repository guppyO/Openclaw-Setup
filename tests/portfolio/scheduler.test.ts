import { buildDispatchState } from "../../services/dispatch/index.js";
import { buildAutonomyQueue, createExperiments } from "../../services/experiment-runner/index.js";
import { defaultOpportunities, rankOpportunities } from "../../services/opportunity-engine/index.js";

describe("autonomy queue", () => {
  test("creates productive fallback work", () => {
    const opportunities = rankOpportunities(defaultOpportunities());
    const experiments = createExperiments(opportunities);
    const queue = buildAutonomyQueue(opportunities, experiments);
    const dispatch = buildDispatchState({ opportunities, experiments, queue });

    expect(queue.length).toBeGreaterThan(3);
    expect(queue[0]!.reason).toBe("highest-ev-open-experiment");
    expect(dispatch.nextTask).not.toBeNull();
    expect(dispatch.readyQueue.length).toBeGreaterThan(0);
  });
});
