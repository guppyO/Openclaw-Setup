import path from "node:path";
import { ensureDir } from "../../services/common/fs.js";
import { emitLog } from "../../services/common/logger.js";
import * as tar from "tar";

async function main(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.resolve(process.cwd(), "data", "backups");
  await ensureDir(backupDir);
  const file = path.join(backupDir, `revenue-os-${timestamp}.tar.gz`);

  await tar.create(
    {
      gzip: true,
      file,
      cwd: process.cwd(),
    },
    ["docs", "openclaw", "agents", "skills", "services", "dashboards", "scripts", "data/exports"],
  );

  await emitLog({
    agent: "ops",
    session: "backup",
    initiative: "resilience",
    actionType: "create-backup",
    subsystem: "backup",
    success: true,
    evidencePaths: [file],
  });
  console.log(file);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
