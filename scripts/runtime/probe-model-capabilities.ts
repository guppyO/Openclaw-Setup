import { emitLog } from "../../services/common/logger.js";
import { probeModelCapabilities, writeModelCapabilityArtifacts } from "../../services/runtime-model/index.js";

async function main(): Promise<void> {
  const probeMode = process.argv.includes("--active") ? "active" : "passive";
  const probe = await probeModelCapabilities(probeMode);
  await writeModelCapabilityArtifacts(probe);

  await emitLog({
    agent: "ops",
    session: "runtime-model-probe",
    initiative: "runtime-model-policy",
    actionType: "probe-model-capabilities",
    subsystem: "runtime-model",
    success: true,
    evidencePaths: [
      "docs/runtime-model-policy.md",
      "data/exports/model-capabilities.json",
    ],
  });

  console.log(
    JSON.stringify(
      {
        detectedAt: probe.detectedAt,
        probeMode: probe.probeMode,
        openClawPrimary: probe.openClawPrimary,
        strategicTarget: probe.strategicTarget,
        driftCount: probe.drift.length,
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
