import { buildDispatchState } from "../../services/dispatch/index.js";
import { buildAutonomyQueue, createExperiments } from "../../services/experiment-runner/index.js";
import { defaultOpportunities, rankOpportunities } from "../../services/opportunity-engine/index.js";

describe("autonomy queue", () => {
  test("creates productive fallback work and active assignments", () => {
    const opportunities = rankOpportunities(defaultOpportunities());
    const experiments = createExperiments(opportunities);
    const queue = buildAutonomyQueue(opportunities, experiments);
    const dispatch = buildDispatchState({ opportunities, experiments, queue });

    expect(queue.length).toBeGreaterThan(3);
    expect(queue[0]!.reason).toBe("highest-ev-open-experiment");
    expect(dispatch.nextTask).not.toBeNull();
    expect(dispatch.readyQueue.length).toBeGreaterThan(0);
    expect(dispatch.activeAssignments.length).toBeGreaterThan(0);
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
        activeAssignments: [],
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
          openClawModel: "openai-codex/gpt-5.4",
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

  test("promotes the next task immediately when a task completes", () => {
    const opportunities = rankOpportunities(defaultOpportunities());
    const experiments = createExperiments(opportunities);
    const queue = buildAutonomyQueue(opportunities, experiments);
    const completedTaskId = queue[0]!.id;

    const dispatch = buildDispatchState({
      opportunities,
      experiments,
      queue,
      completedTaskId,
      modelProbe: {
        detectedAt: new Date().toISOString(),
        probeMode: "passive",
        provisional: false,
        codexCliInstalled: true,
        openclawInstalled: true,
        strategicTarget: "gpt-5.4",
        deepThinkingTarget: "gpt-5.4-pro",
        officialFrontierModel: "gpt-5.4-pro",
        officialGeneralModel: "gpt-5.4",
        officialCodexDocsStatus: "verified",
        openClawPrimary: "openai-codex/gpt-5.4",
        openClawFallback: "openai-codex/gpt-5.4",
        openClawProbeSource: "config-read",
        openClawVerifiedCandidates: ["openai-codex/gpt-5.4"],
        aliases: [],
        drift: [],
      },
    });

    expect(dispatch.completedTaskIds).toContain(completedTaskId);
    expect(dispatch.nextTask?.id).not.toBe(completedTaskId);
    expect(dispatch.usagePolicy.strategicModel).toBe("gpt-5.4");
  });

  test("assigns parallel work to multiple specialist agents when capacity exists", () => {
    const opportunities = rankOpportunities(defaultOpportunities());
    const experiments = createExperiments(opportunities);
    const queue = buildAutonomyQueue(opportunities, experiments);
    const dispatch = buildDispatchState({ opportunities, experiments, queue });

    const owners = new Set(dispatch.activeAssignments.map((assignment) => assignment.owner));
    expect(dispatch.activeAssignments.length).toBeGreaterThan(1);
    expect(owners.size).toBeGreaterThan(1);
  });

  test("raises per-role concurrency when queue depth is high", () => {
    const opportunities = rankOpportunities(defaultOpportunities());
    const experiments = createExperiments(opportunities);
    const queue = [...buildAutonomyQueue(opportunities, experiments), ...buildAutonomyQueue(opportunities, experiments).map((task, index) => ({
      ...task,
      id: `${task.id}-burst-${index}`,
    }))];
    const dispatch = buildDispatchState({ opportunities, experiments, queue });

    expect(dispatch.agentConcurrencyLimits.builder).toBeGreaterThan(1);
    expect(dispatch.agentConcurrencyLimits.distribution).toBeGreaterThan(1);
    expect(dispatch.agentConcurrencyLimits.ops).toBeGreaterThan(2);
  });
});
