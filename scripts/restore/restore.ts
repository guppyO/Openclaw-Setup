import path from "node:path";
import { readdir } from "node:fs/promises";
import * as tar from "tar";

function latest(files: string[]): string | null {
  const sorted = [...files].sort().reverse();
  return sorted[0] ?? null;
}

async function main(): Promise<void> {
  const backupDir = path.resolve(process.cwd(), "data", "backups");
  const override = process.argv.find((argument) => argument.startsWith("--file="));
  const selected = override?.slice("--file=".length);

  const file =
    selected ??
    (() => {
      const entriesPromise = readdir(backupDir);
      return entriesPromise.then((entries) => latest(entries.filter((entry) => entry.endsWith(".tar.gz"))));
    })();

  const resolved = typeof file === "string" ? file : await file;
  if (!resolved) {
    throw new Error("No backup archive found. Use --file=<path> if needed.");
  }
  const archive = path.isAbsolute(resolved) ? resolved : path.join(backupDir, resolved);
  await tar.extract({
    file: archive,
    cwd: process.cwd(),
  });
  console.log(`Restored ${archive}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
