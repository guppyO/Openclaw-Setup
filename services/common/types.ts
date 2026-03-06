export const AGENT_IDS = [
  "ceo",
  "research",
  "builder",
  "distribution",
  "treasury",
  "skillsmith",
  "ops",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export const OPPORTUNITY_STATUSES = [
  "discovered",
  "researched",
  "scored",
  "approved",
  "asset-build",
  "launched",
  "measuring",
  "compound",
  "pause",
  "kill",
  "archive",
] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const EXPERIMENT_STATUSES = [
  "planned",
  "approved",
  "building",
  "launched",
  "measuring",
  "compound",
  "paused",
  "killed",
  "archived",
] as const;

export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

export type QueueReason =
  | "highest-ev-open-experiment"
  | "distribution-bottleneck"
  | "highest-priority-product-backlog"
  | "new-opportunity-research"
  | "skill-gap-reduction"
  | "changelog-adaptation"
  | "documentation-and-memory"
  | "resilience-work"
  | "winner-refinement";

export interface OpportunitySignal {
  source: string;
  description: string;
  capturedAt: string;
  strength: number;
  url?: string;
}

export interface OpportunityMetrics {
  expectedValue: number;
  confidence: number;
  speedToLaunch: number;
  speedToRevenue: number;
  capitalEfficiency: number;
  platformRisk: number;
  distributionEfficiency: number;
  buildComplexity: number;
  maintenanceBurden: number;
  compoundingPotential: number;
  automationSuitability: number;
  synergyWithExistingAssets: number;
  payoutReadiness: number;
  complianceFriction: number;
}

export interface ScoreBreakdown {
  total: number;
  rankedScore: number;
  weightVersion: string;
  dimensionScores: Record<keyof OpportunityMetrics, number>;
}

export interface Opportunity {
  id: string;
  title: string;
  thesis: string;
  laneFamily: string;
  monetizationRoute: string;
  demandSignals: OpportunitySignal[];
  requiredAssets: string[];
  requiredAccounts: string[];
  timeToLaunchDays: number;
  timeToRevenueDays: number;
  expectedMarginPct: number;
  capitalRequiredUsd: number;
  automationFit: number;
  defensibility: number;
  distributionFit: number;
  complianceFriction: number;
  payoutFriction: number;
  buildComplexity: number;
  maintenanceBurden: number;
  platformRisk: number;
  compoundingPotential: number;
  confidence: number;
  synergy: number;
  payoutReadiness: number;
  currentStatus: OpportunityStatus;
  experimentPlan: string;
  liveKpis: string[];
  score?: ScoreBreakdown;
}

export interface QueueItem {
  id: string;
  title: string;
  owner: AgentId;
  initiativeId: string;
  reason: QueueReason;
  priority: number;
  dueAt: string;
  notes: string;
}

export interface ExperimentOutcome {
  revenueUsd: number;
  spendUsd: number;
  qualifiedLeads: number;
  conversionRatePct: number;
  notes: string;
}

export interface Experiment {
  id: string;
  opportunityId: string;
  title: string;
  thesis: string;
  status: ExperimentStatus;
  successMetrics: string[];
  budgetCapUsd: number;
  launchChecklist: string[];
  measurementPlan: string[];
  killThreshold: string;
  compoundThreshold: string;
  reviewDate: string;
  nextActions: QueueItem[];
  outcome?: ExperimentOutcome;
}

export interface TreasuryCapabilityFlags {
  balanceRead: boolean;
  statementRead: boolean;
  cardTransactionRead: boolean;
  recipientManagement: boolean;
  transferCreation: boolean;
  spendControls: boolean;
  spendLimits: boolean;
  webhooks: boolean;
  psd2LimitedActions: boolean;
  browserLaneAvailable: boolean;
  personalTokenConfigured: boolean;
  oauthAppConfigured: boolean;
  emailReceiptIngest: boolean;
}

export interface TreasuryBalance {
  currency: string;
  amount: number;
}

export interface LedgerEntry {
  id: string;
  bookedAt: string;
  merchant: string;
  amount: number;
  currency: string;
  category: string;
  initiativeId?: string;
  recurring: boolean;
  notes?: string;
  budgetTag?: string;
  source?: "sample" | "wise-api" | "browser" | "email";
  evidencePaths?: string[];
}

export type TreasuryAuthMode = "none" | "browser-only" | "personal-token" | "partner-oauth" | "hybrid";

export interface BudgetEnvelope {
  category: string;
  dailyUsd: number;
  weeklyUsd: number;
  monthlyUsd: number;
  requiresExperimentTag: boolean;
}

export interface TreasurySnapshot {
  asOf: string;
  authMode: TreasuryAuthMode;
  capabilities: TreasuryCapabilityFlags;
  balances: TreasuryBalance[];
  ledger: LedgerEntry[];
  recurringMonthlyUsd: number;
  runwayMonths: number | null;
  suspiciousSpendCount: number;
  budgetEnvelopes: BudgetEnvelope[];
  pendingReconciliations: number;
}

export type SkillPromotionStage =
  | "seeded"
  | "quarantine"
  | "stage"
  | "prod"
  | "rejected";

export interface SkillCandidate {
  id: string;
  slug: string;
  source: string;
  sourceType: "clawhub" | "github" | "workspace" | "built-in";
  stage: SkillPromotionStage;
  rationale: string;
  provenance: string;
  versionPin: string;
  maintenanceSignal: number;
  overlapScore: number;
  riskScore: number;
  notes: string;
}

export type AnchorStatus = "verified" | "drifted" | "unsupported" | "pending-runtime-check";

export interface SourceRecord {
  id: string;
  label: string;
  domain: "openai" | "openclaw" | "wise" | "steel";
  url: string;
  purpose: string;
}

export interface AnchorVerification {
  id: string;
  anchor: string;
  status: AnchorStatus;
  note: string;
  checkedAt: string;
  sourceIds: string[];
}

export interface AgentStatus {
  agentId: AgentId;
  heartbeatCadence: string;
  lastHeartbeatAt: string | null;
  backlogCount: number;
  activeInitiative: string;
}

export interface DashboardState {
  generatedAt: string;
  treasury: TreasurySnapshot;
  topOpportunities: Opportunity[];
  activeExperiments: Experiment[];
  queue: QueueItem[];
  dispatch: DispatchState;
  browser: BrowserBrokerState;
  modelPolicy: ModelCapabilityProbe;
  skillCandidates: SkillCandidate[];
  anchors: AnchorVerification[];
  agents: AgentStatus[];
  notes: string[];
  blockers: string[];
}

export interface ActionLog {
  timestamp: string;
  agent: AgentId | "system";
  session: string;
  initiative: string;
  actionType: string;
  subsystem: string;
  success: boolean;
  budgetImpactUsd?: number;
  followUp?: string;
  evidencePaths?: string[];
  details?: Record<string, unknown>;
}

export interface SecretInventoryEntry {
  id: string;
  provider: string;
  purpose: string;
  scope: string;
  lastVerified: string;
  rotationNeeded: boolean;
  storageRef: string;
  importSource: string;
  secretKeys: string[];
  notes: string[];
}

export interface SecretBootstrapState {
  importedAt: string;
  sourceFile: string;
  providers: string[];
  warnings: string[];
  secretFileRefs: string[];
  inventory: SecretInventoryEntry[];
}

export type RuntimeProbeMode = "passive" | "active";

export interface ModelAliasState {
  alias: string;
  strategicTarget: string;
  resolvedModel: string;
  reasoning: "high" | "xhigh";
  surface: "codex-cli" | "openclaw" | "source-fallback" | "env-override";
  status: "preferred" | "fallback" | "candidate";
  note: string;
}

export interface ModelCapabilityProbe {
  detectedAt: string;
  probeMode: RuntimeProbeMode;
  codexCliInstalled: boolean;
  openclawInstalled: boolean;
  strategicTarget: string;
  openClawPrimary: string;
  openClawFallback: string;
  aliases: ModelAliasState[];
  drift: string[];
}

export interface DispatchState {
  generatedAt: string;
  queue: QueueItem[];
  readyQueue: QueueItem[];
  nextTask: QueueItem | null;
  immediateContinuations: QueueItem[];
  completedTaskIds: string[];
  recoveryActions: string[];
  cadence: {
    recoverySweepMinutes: number;
    heartbeatMinutes: number;
    immediateContinuation: boolean;
  };
  usagePolicy: {
    strategicModel: string;
    openClawModel: string;
    compactionRequired: boolean;
  };
}

export type BrowserLaneId = "openclaw-managed" | "attached-chrome" | "steel";

export interface BrowserTaskRequest {
  id: string;
  title: string;
  initiativeId: string;
  authLevel: "public" | "company" | "treasury" | "infrastructure";
  antiBotSensitivity: number;
  parallelism: number;
  operatorVisible: boolean;
  requiresPersistentSession: boolean;
  preferredProfileId?: string;
}

export interface BrowserRouteDecision {
  taskId: string;
  lane: BrowserLaneId;
  profileId: string;
  headless: boolean;
  reasons: string[];
}

export interface BrowserProfileClass {
  id: string;
  lane: BrowserLaneId;
  namespace: string;
  purpose: string;
  riskBoundary: string;
  persistent: boolean;
}

export interface BrowserBrokerState {
  generatedAt: string;
  capabilities: {
    managedBrowser: boolean;
    attachedChrome: boolean;
    steel: boolean;
    steelBaseUrl: string;
    steelApiConfigured: boolean;
  };
  profiles: BrowserProfileClass[];
  sampleRoutes: BrowserRouteDecision[];
  activeSessions: number;
}
