import { buildRuntimeTreasurySnapshot } from "../../services/treasury/index.js";
import { emitLog } from "../../services/common/logger.js";
import { resolveRepoPath, writeJsonFile, writeTextFile } from "../../services/common/fs.js";

async function main(): Promise<void> {
  const snapshot = await buildRuntimeTreasurySnapshot();
  await writeJsonFile(resolveRepoPath("data", "exports", "treasury.json"), snapshot);
  const { buildTreasuryMarkdown } = await import("../../services/treasury/index.js");
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
  console.log(
    `Wise capability probe complete. Mode: ${snapshot.mode}; balance read: ${snapshot.capabilities.balanceRead}; ledger: ${snapshot.ledgerStatus}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
