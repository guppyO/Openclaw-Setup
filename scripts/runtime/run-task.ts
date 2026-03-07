import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

import { completeTaskAndWake } from "./complete-task.js";

function parseArgs(): { taskId: string; command: string[] } {
  const taskIndex = process.argv.findIndex((argument) => argument === "--task");
  const separatorIndex = process.argv.findIndex((argument) => argument === "--");
  const taskId = taskIndex >= 0 ? process.argv[taskIndex + 1] : undefined;

  if (!taskId) {
    throw new Error("Pass --task <id> before the command separator.");
  }

  if (separatorIndex < 0 || separatorIndex === process.argv.length - 1) {
    throw new Error("Pass the tracked command after `--`.");
  }

  return {
    taskId,
    command: process.argv.slice(separatorIndex + 1),
  };
}

async function main(): Promise<void> {
  const { taskId, command } = parseArgs();
  const [program, ...args] = command;
  if (!program) {
    throw new Error("Missing command to run.");
  }

  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn(program, args, {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: true,
    });

    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    process.exitCode = exitCode;
    return;
  }

  const result = await completeTaskAndWake(taskId);
  console.log(
    JSON.stringify(
      {
        completedTaskId: taskId,
        nextTaskId: result.dispatchState.nextTask?.id ?? null,
        wake: result.wakeAttempt.reason,
      },
      null,
      2,
    ),
  );
}

const isMain = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
