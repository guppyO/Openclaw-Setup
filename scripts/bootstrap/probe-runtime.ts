import { emitLog } from "../../services/common/logger.js";
import { resolveRepoPath, writeJsonFile } from "../../services/common/fs.js";
import { probeModelCapabilities, writeModelCapabilityArtifacts } from "../../services/runtime-model/index.js";
import { deriveRuntimeVerification, refreshOfficialSources, writeRuntimeDocs } from "../../services/update-steward/index.js";

async function main(): Promise<void> {
  const result = await refreshOfficialSources();
  const anchors = deriveRuntimeVerification(result.snapshots);
  await writeRuntimeDocs({ anchors, snapshots: result.snapshots });
  const probe = await probeModelCapabilities(process.argv.includes("--active-model-probe") ? "active" : "passive");
  await writeModelCapabilityArtifacts(probe);
  await writeJsonFile(resolveRepoPath("data", "exports", "runtime-source-refresh.json"), {
    refreshedAt: new Date().toISOString(),
    methods: Object.fromEntries(result.snapshots.map((source) => [source.id, source.method])),
    changedSources: result.changedSources.map((source) => ({
      id: source.id,
      status: source.httpStatus,
      ok: source.ok,
      title: source.title,
      method: source.method,
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
      "docs/runtime-model-policy.md",
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
