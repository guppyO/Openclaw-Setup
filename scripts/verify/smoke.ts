import { buildDashboardState } from "../../services/analytics/index.js";
import { fileExists, resolveRepoPath } from "../../services/common/fs.js";
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
