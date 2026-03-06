import { emitLog } from "../../services/common/logger.js";
import { readJsonFile, resolveRepoPath, writeJsonFile } from "../../services/common/fs.js";
import type { DispatchState, Experiment, Opportunity, QueueItem } from "../../services/common/types.js";
import { buildDispatchState } from "../../services/dispatch/index.js";

function parseCompletedTaskId(): string | undefined {
  const flagIndex = process.argv.findIndex((argument) => argument === "--complete");
  if (flagIndex < 0) {
    return undefined;
  }

  return process.argv[flagIndex + 1];
}

async function main(): Promise<void> {
  const opportunities = await readJsonFile<Opportunity[]>(resolveRepoPath("data", "exports", "opportunities.json"), []);
  const experiments = await readJsonFile<Experiment[]>(resolveRepoPath("data", "exports", "experiments.json"), []);
  const queue = await readJsonFile<QueueItem[]>(resolveRepoPath("data", "exports", "autonomy-queue.json"), []);
  const previousState = await readJsonFile<DispatchState | null>(
    resolveRepoPath("data", "exports", "dispatch-state.json"),
    null,
  );

  const completedTaskId = parseCompletedTaskId();
  const dispatchState = buildDispatchState({
    opportunities,
    experiments,
    queue,
    previousState,
    completedTaskId,
  });

  await writeJsonFile(resolveRepoPath("data", "exports", "dispatch-state.json"), dispatchState);
  await writeJsonFile(resolveRepoPath("data", "exports", "autonomy-queue.json"), dispatchState.queue);

  await emitLog({
    agent: "ops",
    session: "dispatch-recovery",
    initiative: "continuous-dispatch",
    actionType: completedTaskId ? "complete-and-continue" : "recovery-sweep",
    subsystem: "dispatch",
    success: true,
    evidencePaths: [
      "data/exports/dispatch-state.json",
      "data/exports/autonomy-queue.json",
    ],
  });

  console.log(
    JSON.stringify(
      {
        generatedAt: dispatchState.generatedAt,
        nextTask: dispatchState.nextTask?.id ?? null,
        readyCount: dispatchState.readyQueue.length,
        recoveryActions: dispatchState.recoveryActions.length,
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
