import { buildAutonomyQueue, createExperiments } from "../../services/experiment-runner/index.js";
import { defaultOpportunities, rankOpportunities } from "../../services/opportunity-engine/index.js";

describe("autonomy queue", () => {
  test("creates productive fallback work", () => {
    const opportunities = rankOpportunities(defaultOpportunities());
    const experiments = createExperiments(opportunities);
    const queue = buildAutonomyQueue(opportunities, experiments);

    expect(queue.length).toBeGreaterThan(3);
    expect(queue[0]!.reason).toBe("highest-ev-open-experiment");
  });
});
