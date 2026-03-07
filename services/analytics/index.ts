import { readJsonFile, resolveRepoPath } from "../common/fs.js";
import type {
  AgentId,
  AgentStatus,
  AnchorVerification,
  BrowserBrokerState,
  CredentialRegistryState,
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
import { readModelCapabilityProbe } from "../runtime-model/index.js";
import { buildRuntimeTreasurySnapshot } from "../treasury/index.js";
import { readRuntimeVerification } from "../update-steward/index.js";

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
  const modelPolicy = await readModelCapabilityProbe();
  const skillCandidates = await readJsonFile<SkillCandidate[]>(
    resolveRepoPath("data", "exports", "skill-candidates.json"),
    [],
  );
  const credentialRegistry = await readJsonFile<CredentialRegistryState>(
    resolveRepoPath("data", "exports", "credential-registry.json"),
    {
      generatedAt: new Date(0).toISOString(),
      storageRef: ".secrets/generated-service-credentials.env",
      warnings: [],
      entries: [],
    },
  );
  const dispatchFallback = buildDispatchState({ opportunities, experiments, queue, modelProbe: modelPolicy });
  const dispatchFromDisk = await readJsonFile<DispatchState>(
    resolveRepoPath("data", "exports", "dispatch-state.json"),
    dispatchFallback,
  );
  const dispatch =
    ((dispatchFromDisk.nextTask === null && queue.length > 0) ||
      !Array.isArray(dispatchFromDisk.activeAssignments) ||
      dispatchFromDisk.activeAssignments.length === 0 ||
      dispatchFromDisk.usagePolicy.openClawModel !== modelPolicy.openClawPrimary ||
      dispatchFromDisk.usagePolicy.strategicModel !== modelPolicy.strategicTarget)
      ? buildDispatchState({ opportunities, experiments, queue, previousState: dispatchFromDisk, modelProbe: modelPolicy })
      : dispatchFromDisk;
  const browserFromDisk = await readJsonFile<BrowserBrokerState | null>(
    resolveRepoPath("data", "exports", "browser-broker.json"),
    null,
  );
  const browser = browserFromDisk ?? (await buildBrowserBrokerState());
  const anchors = await readRuntimeVerification();
  const treasuryFromDisk = await readJsonFile<TreasurySnapshot | null>(
    resolveRepoPath("data", "exports", "treasury.json"),
    null,
  );
  const treasury = treasuryFromDisk ?? (await buildRuntimeTreasurySnapshot());

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
      "Keep GPT-5.4 as the routine strategic model target and use GPT-5.4 Pro on the deepest available surfaces instead of downshifting to older model families.",
      "The dispatcher should continue work immediately after task completion and keep multiple specialists occupied when ready work exists.",
      `Treasury truth is ${treasury.cashTruth} cash with ${treasury.ledgerStatus} ledger coverage.`,
      `Managed credential entries: ${credentialRegistry.entries.length}.`,
      ...(credentialRegistry.entries.some((entry) => entry.rotationPending)
        ? ["Account hardening note: some externally managed root credentials still have rotationPending metadata."]
        : []),
    ],
    blockers: [
      ...(browser.capabilities.attachedChrome
        ? []
        : browser.capabilities.attachedChromePaired
          ? browser.capabilities.gatewayTokenConfigured
            ? browser.capabilities.remoteGatewayMode === "local" || browser.capabilities.nodeHostReady
              ? []
              : ["Attached Chrome relay is paired, but the remote node host is not ready for the VPS-first gateway path."]
            : ["Attached Chrome relay is marked paired but OPENCLAW_GATEWAY_TOKEN is missing, so the relay is not actually usable yet."]
          : ["Attached Chrome relay is not yet paired on the Windows browser host."]),
      ...(browser.capabilities.remoteGatewayConfigured
        ? []
        : ["Remote gateway access is not configured yet. Set OPENCLAW_GATEWAY_BASE_URL or establish the documented SSH tunnel path before remote wake or node-host flows can work."]),
      ...(browser.capabilities.steelReady
        ? []
        : browser.capabilities.steelMode === "self-hosted"
          ? ["Steel self-hosted mode is configured without cloud-only auth-state features, so auth-sensitive Steel lanes are not live yet."]
          : ["Steel is not fully configured for session automation yet."]),
      ...(browser.sampleRoutes.some((route) => route.status === "blocked")
        ? ["One or more browser routes are intentionally blocked because no safe high-trust lane is ready."]
        : []),
      ...(treasury.authMode === "none" && treasury.mode === "sample"
        ? ["Wise automation is still limited to sample state until a token, OAuth app, or browser lane is verified."]
        : []),
    ],
  };
}
