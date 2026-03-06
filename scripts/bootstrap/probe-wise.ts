import { buildTreasuryMarkdown, buildTreasurySnapshot, probeWiseCapabilities } from "../../services/treasury/index.js";
import { emitLog } from "../../services/common/logger.js";
import { resolveRepoPath, writeJsonFile, writeTextFile } from "../../services/common/fs.js";

async function main(): Promise<void> {
  const capabilities = await probeWiseCapabilities();
  const snapshot = buildTreasurySnapshot(capabilities);
  await writeJsonFile(resolveRepoPath("data", "exports", "treasury.json"), snapshot);
  await writeTextFile(resolveRepoPath("docs", "treasury", "capabilities.md"), buildTreasuryMarkdown(snapshot));
  await emitLog({
    agent: "treasury",
    session: "bootstrap-wise",
    initiative: "treasury",
    actionType: "probe-capabilities",
    subsystem: "wise",
    success: true,
    evidencePaths: ["data/exports/treasury.json", "docs/treasury/capabilities.md"],
  });
  console.log(`Wise capability probe complete. Balance read: ${snapshot.capabilities.balanceRead}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
