import { DEFAULT_ANCHOR_VERIFICATIONS } from "../common/source-catalog.js";
import { readJsonFile, resolveRepoPath } from "../common/fs.js";
import type {
  AgentId,
  AgentStatus,
  AnchorVerification,
  DashboardState,
  Experiment,
  Opportunity,
  QueueItem,
  SkillCandidate,
  TreasurySnapshot,
} from "../common/types.js";
import { AGENT_IDS } from "../common/types.js";
import { buildTreasurySnapshot } from "../treasury/index.js";

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
  const anchors = await readJsonFile<AnchorVerification[]>(
    resolveRepoPath("data", "exports", "runtime-verification.json"),
    DEFAULT_ANCHOR_VERIFICATIONS,
  );
  const treasury = await readJsonFile<TreasurySnapshot>(
    resolveRepoPath("data", "exports", "treasury.json"),
    buildTreasurySnapshot(),
  );

  return {
    generatedAt: new Date().toISOString(),
    treasury,
    topOpportunities: opportunities.slice(0, 5),
    activeExperiments: experiments.filter((experiment) => experiment.status !== "archived").slice(0, 5),
    queue,
    skillCandidates: skillCandidates.slice(0, 8),
    anchors,
    agents: defaultAgents(queue),
    notes: [
      "Use prod only after stage smoke, source refresh, and treasury capability probe all pass.",
      "Keep GPT-5.4 as the default strategy model where supported, but allow provider-level overrides where Codex/OpenClaw currently expose only GPT-5-Codex variants.",
      "The dashboard is file-driven; every recurring run should refresh JSON exports and the docs alongside them.",
    ],
  };
}
