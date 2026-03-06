import { emitLog } from "../../services/common/logger.js";
import { resolveRepoPath, writeJsonFile, writeTextFile } from "../../services/common/fs.js";
import { refreshOfficialSources, writeRuntimeDocs } from "../../services/update-steward/index.js";

async function main(): Promise<void> {
  const result = await refreshOfficialSources();
  await writeRuntimeDocs();
  const deltaPath = resolveRepoPath(
    "docs",
    "changelog-deltas",
    `${new Date().toISOString().slice(0, 10)}-official-source-refresh.md`,
  );

  const lines = [
    "# Official Source Refresh",
    "",
    `Generated at ${new Date().toISOString()}.`,
    "",
    "## Changed sources",
    "",
    ...result.changedSources.map(
      (source) => `- ${source.id}: status ${source.httpStatus}, title "${source.title}", ok=${source.ok}`,
    ),
  ];

  await writeTextFile(deltaPath, lines.join("\n"));
  await writeJsonFile(resolveRepoPath("data", "exports", "source-refresh-last.json"), {
    changedSources: result.changedSources.map((source) => source.id),
    checkedAt: new Date().toISOString(),
  });
  await emitLog({
    agent: "ops",
    session: "source-refresh",
    initiative: "update-steward",
    actionType: "refresh-official-sources",
    subsystem: "update-steward",
    success: true,
    evidencePaths: [deltaPath, "data/exports/source-snapshots.json"],
  });
  console.log(`Updated official source snapshots. Changes: ${result.changedSources.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
