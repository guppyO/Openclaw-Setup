import { emitLog } from "../../services/common/logger.js";
import { resolveRepoPath, writeJsonFile } from "../../services/common/fs.js";
import { buildBrowserBrokerState } from "../../services/browser-broker/index.js";

async function main(): Promise<void> {
  const state = await buildBrowserBrokerState();
  await writeJsonFile(resolveRepoPath("data", "exports", "browser-broker.json"), state);

  await emitLog({
    agent: "ops",
    session: "browser-broker",
    initiative: "browser-fabric",
    actionType: "snapshot-browser-broker",
    subsystem: "browser",
    success: true,
    evidencePaths: ["data/exports/browser-broker.json"],
  });

  console.log(
    JSON.stringify(
      {
        generatedAt: state.generatedAt,
        steelMode: state.capabilities.steelMode,
        steelReady: state.capabilities.steelReady,
        steelAuthStateReady: state.capabilities.steelAuthStateReady,
        attachedChrome: state.capabilities.attachedChrome,
        attachedChromePaired: state.capabilities.attachedChromePaired,
        nodeHostReady: state.capabilities.nodeHostReady,
        remoteGatewayConfigured: state.capabilities.remoteGatewayConfigured,
        sampleRoutes: state.sampleRoutes.length,
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
