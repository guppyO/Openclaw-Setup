import { emitLog } from "../../services/common/logger.js";
import { resolveRepoPath, writeJsonFile } from "../../services/common/fs.js";
import { refreshOfficialSources, writeRuntimeDocs } from "../../services/update-steward/index.js";

async function main(): Promise<void> {
  const result = await refreshOfficialSources();
  await writeRuntimeDocs();
  await writeJsonFile(resolveRepoPath("data", "exports", "runtime-source-refresh.json"), {
    refreshedAt: new Date().toISOString(),
    changedSources: result.changedSources.map((source) => ({
      id: source.id,
      status: source.httpStatus,
      ok: source.ok,
      title: source.title,
    })),
  });
  await emitLog({
    agent: "ops",
    session: "bootstrap-runtime",
    initiative: "runtime-verification",
    actionType: "runtime-source-refresh",
    subsystem: "update-steward",
    success: true,
    evidencePaths: [
      "docs/runtime-verification.md",
      "docs/source-anchors.md",
      "data/exports/source-snapshots.json",
    ],
  });
  console.log(`Runtime verification refreshed. Changed sources: ${result.changedSources.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
