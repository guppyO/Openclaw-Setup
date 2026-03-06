import path from "node:path";

import { ensureDir, resolveRepoPath } from "./fs.js";
import type { ActionLog } from "./types.js";
import { appendFile } from "node:fs/promises";

const LOG_FILE = resolveRepoPath("data", "exports", "logs", "actions.jsonl");

export async function emitLog(partial: Omit<ActionLog, "timestamp"> & { timestamp?: string }): Promise<void> {
  const entry: ActionLog = {
    timestamp: partial.timestamp ?? new Date().toISOString(),
    ...partial,
  };

  await ensureDir(path.dirname(LOG_FILE));
  await appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`, "utf8");
}
