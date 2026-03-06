import { buildSkillIntakeMarkdown, seedSkillCandidates } from "../../services/skill-intake/index.js";
import { emitLog } from "../../services/common/logger.js";
import { resolveRepoPath, writeJsonFile, writeTextFile } from "../../services/common/fs.js";

async function main(): Promise<void> {
  const candidates = seedSkillCandidates();
  await writeJsonFile(resolveRepoPath("data", "exports", "skill-candidates.json"), candidates);
  await writeTextFile(resolveRepoPath("docs", "skills", "skill-intake.md"), buildSkillIntakeMarkdown(candidates));
  await writeTextFile(resolveRepoPath("skills", "reports", "seed-skill-report.md"), buildSkillIntakeMarkdown(candidates));
  await emitLog({
    agent: "skillsmith",
    session: "bootstrap-skills",
    initiative: "skill-pipeline",
    actionType: "seed-skill-candidates",
    subsystem: "skill-intake",
    success: true,
    evidencePaths: [
      "data/exports/skill-candidates.json",
      "docs/skills/skill-intake.md",
      "skills/reports/seed-skill-report.md",
    ],
  });
  console.log(`Seeded ${candidates.length} skill candidates.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
