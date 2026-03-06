import { buildAccountRegistryMarkdown, defaultAccountRegistry } from "../../services/account-capability/index.js";
import { buildDashboardState } from "../../services/analytics/index.js";
import { buildAutonomyQueue, buildExperimentMarkdown, createExperiments } from "../../services/experiment-runner/index.js";
import { writeRuntimeDocs } from "../../services/update-steward/index.js";
import { defaultOpportunities, buildPortfolioMarkdown, rankOpportunities } from "../../services/opportunity-engine/index.js";
import { publishLandingPagePackage } from "../../services/publishing/index.js";
import { buildSkillIntakeMarkdown, seedSkillCandidates } from "../../services/skill-intake/index.js";
import { buildTreasuryMarkdown, buildTreasurySnapshot } from "../../services/treasury/index.js";
import { emitLog } from "../../services/common/logger.js";
import { resolveRepoPath, writeJsonFile, writeTextFile } from "../../services/common/fs.js";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main(): Promise<void> {
  const opportunitiesOnly = process.argv.includes("--opportunities-only");
  const opportunities = rankOpportunities(defaultOpportunities());
  const experiments = createExperiments(opportunities);
  const queue = buildAutonomyQueue(opportunities, experiments);
  const treasury = buildTreasurySnapshot();
  const skills = seedSkillCandidates();
  const registry = defaultAccountRegistry();

  await writeJsonFile(resolveRepoPath("data", "exports", "opportunities.json"), opportunities);
  await writeTextFile(resolveRepoPath("docs", "portfolio", "lane-catalog.md"), buildPortfolioMarkdown(opportunities));

  if (opportunitiesOnly) {
    console.log("Opportunity state refreshed.");
    return;
  }

  await writeRuntimeDocs();
  await writeJsonFile(resolveRepoPath("data", "exports", "experiments.json"), experiments);
  await writeJsonFile(resolveRepoPath("data", "exports", "autonomy-queue.json"), queue);
  await writeJsonFile(resolveRepoPath("data", "exports", "treasury.json"), treasury);
  await writeJsonFile(resolveRepoPath("data", "exports", "skill-candidates.json"), skills);
  await writeJsonFile(resolveRepoPath("data", "exports", "account-registry.json"), registry);

  await writeTextFile(resolveRepoPath("docs", "treasury", "capabilities.md"), buildTreasuryMarkdown(treasury));
  await writeTextFile(resolveRepoPath("docs", "skills", "skill-intake.md"), buildSkillIntakeMarkdown(skills));
  await writeTextFile(resolveRepoPath("docs", "account-registry.md"), buildAccountRegistryMarkdown(registry));

  for (const experiment of experiments) {
    const opportunity = opportunities.find((candidate) => candidate.id === experiment.opportunityId);
    if (!opportunity) {
      continue;
    }
    await writeTextFile(
      resolveRepoPath("docs", "experiments", `${slugify(experiment.id)}.md`),
      buildExperimentMarkdown(experiment, opportunity),
    );
  }

  if (opportunities[0] && experiments[0]) {
    await publishLandingPagePackage(opportunities[0], experiments[0]);
  }

  const dashboardState = await buildDashboardState();
  await writeJsonFile(resolveRepoPath("data", "exports", "dashboard-state.json"), dashboardState);
  await emitLog({
    agent: "ops",
    session: "bootstrap-state",
    initiative: "company-bootstrap",
    actionType: "seed-operating-state",
    subsystem: "portfolio",
    success: true,
    evidencePaths: [
      "data/exports/dashboard-state.json",
      "docs/portfolio/lane-catalog.md",
      "docs/treasury/capabilities.md",
    ],
  });
  console.log(`Initialized operating state with ${opportunities.length} opportunities and ${experiments.length} experiments.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
