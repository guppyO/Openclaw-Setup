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

  test("recovers stale locks and prevents duplicate queued ids", () => {
    const opportunities = rankOpportunities(defaultOpportunities());
    const experiments = createExperiments(opportunities);
    const queue = buildAutonomyQueue(opportunities, experiments);
    const duplicated = [...queue, queue[0]!];

    const dispatch = buildDispatchState({
      opportunities,
      experiments,
      queue: duplicated,
      previousState: {
        generatedAt: new Date().toISOString(),
        queue: duplicated,
        readyQueue: duplicated,
        nextTask: duplicated[0]!,
        immediateContinuations: [],
        completedTaskIds: [],
        blockedInitiativeIds: [],
        locks: [
          {
            taskId: duplicated[0]!.id,
            owner: duplicated[0]!.owner,
            acquiredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
        ],
        agentConcurrencyLimits: {
          ceo: 1,
          research: 1,
          builder: 1,
          distribution: 1,
          treasury: 1,
          skillsmith: 1,
          ops: 2,
        },
        recoveryActions: [],
        cadence: {
          recoverySweepMinutes: 3,
          heartbeatMinutes: 12,
          immediateContinuation: true,
        },
        usagePolicy: {
          strategicModel: "gpt-5.4",
          openClawModel: "openai-codex/gpt-5.3-codex",
          compactionRequired: true,
        },
      },
    });

    expect(dispatch.queue.filter((item) => item.id === duplicated[0]!.id)).toHaveLength(1);
    expect(dispatch.recoveryActions.some((item) => item.includes("Recovered stale lock"))).toBe(true);
  });

  test("isolates blocked initiatives while keeping other work ready", () => {
    const opportunities = rankOpportunities(defaultOpportunities());
    const experiments = createExperiments(opportunities);
    const queue = buildAutonomyQueue(opportunities, experiments);

    const dispatch = buildDispatchState({
      opportunities,
      experiments,
      queue,
      blockedInitiativeIds: ["ops-audit-packs"],
    });

    expect(dispatch.readyQueue.every((item) => item.initiativeId !== "ops-audit-packs")).toBe(true);
    expect(dispatch.recoveryActions.some((item) => item.includes("blocked"))).toBe(true);
  });
});
