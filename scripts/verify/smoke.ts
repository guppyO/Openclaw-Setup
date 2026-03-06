import { buildDashboardState } from "../../services/analytics/index.js";
import { fileExists, readTextFile, resolveRepoPath } from "../../services/common/fs.js";
import { emitLog } from "../../services/common/logger.js";

async function main(): Promise<void> {
  const required = [
    "package.json",
    "docs/runtime-verification.md",
    "docs/runtime-model-policy.md",
    "docs/source-anchors.md",
    "data/exports/opportunities.json",
    "data/exports/experiments.json",
    "data/exports/autonomy-queue.json",
    "data/exports/dispatch-state.json",
    "data/exports/browser-broker.json",
    "data/exports/model-capabilities.json",
    "data/exports/treasury.json",
  ];

  for (const relativePath of required) {
    const exists = await fileExists(resolveRepoPath(relativePath));
    if (!exists) {
      throw new Error(`Missing required artifact: ${relativePath}`);
    }
  }

  const dashboardState = await buildDashboardState();
  if (dashboardState.topOpportunities.length === 0) {
    throw new Error("Dashboard state has no opportunities.");
  }
  if (dashboardState.queue.length === 0) {
    throw new Error("Autonomy queue is empty.");
  }
  if (dashboardState.browser.capabilities.attachedChromePaired && !dashboardState.browser.capabilities.gatewayTokenConfigured) {
    throw new Error("Attached Chrome is marked paired but OPENCLAW_GATEWAY_TOKEN is missing.");
  }
  if (!dashboardState.topOpportunities.some((opportunity) => opportunity.origin === "discovered")) {
    throw new Error("Opportunity ingest did not produce any discovered opportunities.");
  }
  if (!dashboardState.skillCandidates.some((candidate) => candidate.stage === "quarantine" || candidate.sourceType === "workspace")) {
    throw new Error("Skill discovery did not produce any quarantined or workspace-backed candidates.");
  }
  const stageUnit = await readTextFile(resolveRepoPath("openclaw", "stage", "systemd", "revenue-os-stage.service"), "");
  if (!stageUnit.includes("User=revenueos") || !stageUnit.includes("WantedBy=multi-user.target")) {
    throw new Error("Stage systemd unit is not configured for the dedicated revenueos runtime user.");
  }
  const stageConfig = await readTextFile(resolveRepoPath("openclaw", "stage", "openclaw.json"), "");
  if (!stageConfig.includes("\"hooks\"") || !stageConfig.includes("\"heartbeat\"")) {
    throw new Error("Stage OpenClaw config is missing the explicit hook or heartbeat configuration.");
  }

  await emitLog({
    agent: "ops",
    session: "smoke",
    initiative: "verification",
    actionType: "smoke-check",
    subsystem: "verify",
    success: true,
    evidencePaths: ["data/exports/dashboard-state.json"],
  });
  console.log(
    JSON.stringify(
      {
        ok: true,
        topOpportunity: dashboardState.topOpportunities[0]!.id,
        queueDepth: dashboardState.queue.length,
        treasuryLedgerStatus: dashboardState.treasury.ledgerStatus,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
