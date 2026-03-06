import { DEFAULT_ANCHOR_VERIFICATIONS } from "../common/source-catalog.js";
import { readJsonFile, resolveRepoPath } from "../common/fs.js";
import type {
  AgentId,
  AgentStatus,
  AnchorVerification,
  BrowserBrokerState,
  DashboardState,
  DispatchState,
  Experiment,
  ModelCapabilityProbe,
  Opportunity,
  QueueItem,
  SkillCandidate,
  TreasurySnapshot,
} from "../common/types.js";
import { AGENT_IDS } from "../common/types.js";
import { buildBrowserBrokerState } from "../browser-broker/index.js";
import { buildDispatchState } from "../dispatch/index.js";
import { buildDefaultModelProbe } from "../runtime-model/index.js";
import { buildRuntimeTreasurySnapshot } from "../treasury/index.js";

function defaultAgents(queue: QueueItem[]): AgentStatus[] {
  const cadence = {
    ceo: "15m",
    research: "30m",
    builder: "15m",
    distribution: "60m",
    treasury: "24h",
    skillsmith: "4h",
    ops: "15m",
  } as const;

  return AGENT_IDS.map((agentId: AgentId) => ({
    agentId,
    heartbeatCadence: cadence[agentId],
    lastHeartbeatAt: null,
    backlogCount: queue.filter((item) => item.owner === agentId).length,
    activeInitiative: queue.find((item) => item.owner === agentId)?.initiativeId ?? "none",
  }));
}

export async function buildDashboardState(): Promise<DashboardState> {
  const opportunities = await readJsonFile<Opportunity[]>(resolveRepoPath("data", "exports", "opportunities.json"), []);
  const experiments = await readJsonFile<Experiment[]>(resolveRepoPath("data", "exports", "experiments.json"), []);
  const queue = await readJsonFile<QueueItem[]>(resolveRepoPath("data", "exports", "autonomy-queue.json"), []);
  const skillCandidates = await readJsonFile<SkillCandidate[]>(
    resolveRepoPath("data", "exports", "skill-candidates.json"),
    [],
  );
  const dispatchFromDisk = await readJsonFile<DispatchState>(
    resolveRepoPath("data", "exports", "dispatch-state.json"),
    buildDispatchState({ opportunities, experiments, queue }),
  );
  const dispatch =
    dispatchFromDisk.nextTask === null && queue.length > 0
      ? buildDispatchState({ opportunities, experiments, queue, previousState: dispatchFromDisk })
      : dispatchFromDisk;
  const browser = await readJsonFile<BrowserBrokerState>(
    resolveRepoPath("data", "exports", "browser-broker.json"),
    await buildBrowserBrokerState(),
  );
  const modelPolicy = await readJsonFile<ModelCapabilityProbe>(
    resolveRepoPath("data", "exports", "model-capabilities.json"),
    buildDefaultModelProbe(),
  );
  const anchors = await readJsonFile<AnchorVerification[]>(
    resolveRepoPath("data", "exports", "runtime-verification.json"),
    DEFAULT_ANCHOR_VERIFICATIONS,
  );
  const treasury = await readJsonFile<TreasurySnapshot>(
    resolveRepoPath("data", "exports", "treasury.json"),
    await buildRuntimeTreasurySnapshot(),
  );

  return {
    generatedAt: new Date().toISOString(),
    treasury,
    topOpportunities: opportunities.slice(0, 5),
    activeExperiments: experiments.filter((experiment) => experiment.status !== "archived").slice(0, 5),
    queue,
    dispatch,
    browser,
    modelPolicy,
    skillCandidates: skillCandidates.slice(0, 8),
    anchors,
    agents: defaultAgents(queue),
    notes: [
      "Use prod only after stage smoke, source refresh, treasury probe, and browser broker checks all pass.",
      "Keep GPT-5.4 as the default strategy model where supported, while OpenClaw stays on the strongest verified provider string until runtime proves a GPT-5.4 provider path.",
      "The dispatcher should continue work immediately after task completion instead of waiting for the next heartbeat sweep.",
    ],
    blockers: [
      ...(browser.capabilities.attachedChrome ? [] : ["Attached Chrome relay is not yet paired on the Windows browser host."]),
      ...(browser.capabilities.steelApiConfigured ? [] : ["Steel API or self-hosted base URL is not yet configured for session automation."]),
      ...(treasury.authMode === "none" ? ["Wise automation is still limited to sample state until a token or browser lane is verified."] : []),
    ],
  };
}
