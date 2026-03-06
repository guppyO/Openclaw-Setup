import { emitLog } from "../../services/common/logger.js";
import { loadLocalRuntimeEnv } from "../../services/common/env-loader.js";
import { readJsonFile, resolveRepoPath, writeJsonFile } from "../../services/common/fs.js";
import type { DispatchState, Experiment, Opportunity, QueueItem } from "../../services/common/types.js";
import { buildDispatchState } from "../../services/dispatch/index.js";
import { readModelCapabilityProbe } from "../../services/runtime-model/index.js";

interface WakeAttempt {
  attemptedAt: string;
  environment: string;
  nextTaskId: string | null;
  completedTaskId: string;
  ok: boolean;
  reason: string;
  statusCode?: number;
}

function parseTaskId(): string {
  const flagIndex = process.argv.findIndex((argument) => argument === "--task");
  if (flagIndex >= 0 && process.argv[flagIndex + 1]) {
    return process.argv[flagIndex + 1]!;
  }

  const positional = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
  if (!positional) {
    throw new Error("Pass a completed task id with --task <id>.");
  }

  return positional;
}

function gatewayPortForEnvironment(environment: string): number {
  if (environment === "lab") {
    return 4101;
  }
  if (environment === "stage") {
    return 4201;
  }
  return 4301;
}

async function wakeGatewayNow(completedTaskId: string, nextTaskId: string | null): Promise<WakeAttempt> {
  await loadLocalRuntimeEnv();

  const attemptedAt = new Date().toISOString();
  const environment = process.env.REVENUE_OS_ENVIRONMENT ?? "prod";
  const hookToken = process.env.OPENCLAW_HOOK_TOKEN;
  const port = Number(process.env.OPENCLAW_GATEWAY_PORT ?? gatewayPortForEnvironment(environment));

  if (!hookToken) {
    return {
      attemptedAt,
      environment,
      completedTaskId,
      nextTaskId,
      ok: false,
      reason: "missing-hook-token",
    };
  }

  if (!nextTaskId) {
    return {
      attemptedAt,
      environment,
      completedTaskId,
      nextTaskId,
      ok: false,
      reason: "no-next-task",
    };
  }

  const response = await fetch(`http://127.0.0.1:${port}/hooks/wake`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${hookToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text: `Dispatch continuation requested after task completion. Completed task: ${completedTaskId}. Next task: ${nextTaskId}.`,
      mode: "now",
      completedTaskId,
      nextTaskId,
    }),
  }).catch(() => null);

  if (!response) {
    return {
      attemptedAt,
      environment,
      completedTaskId,
      nextTaskId,
      ok: false,
      reason: "wake-request-failed",
    };
  }

  return {
    attemptedAt,
    environment,
    completedTaskId,
    nextTaskId,
    ok: response.ok,
    reason: response.ok ? "wake-request-sent" : "wake-request-rejected",
    statusCode: response.status,
  };
}

async function main(): Promise<void> {
  const completedTaskId = parseTaskId();
  const opportunities = await readJsonFile<Opportunity[]>(resolveRepoPath("data", "exports", "opportunities.json"), []);
  const experiments = await readJsonFile<Experiment[]>(resolveRepoPath("data", "exports", "experiments.json"), []);
  const queue = await readJsonFile<QueueItem[]>(resolveRepoPath("data", "exports", "autonomy-queue.json"), []);
  const blockedInitiativeIds = await readJsonFile<string[]>(
    resolveRepoPath("data", "exports", "blockers.json"),
    [],
  );
  const previousState = await readJsonFile<DispatchState | null>(
    resolveRepoPath("data", "exports", "dispatch-state.json"),
    null,
  );
  const modelProbe = await readModelCapabilityProbe();

  const dispatchState = buildDispatchState({
    opportunities,
    experiments,
    queue,
    previousState,
    completedTaskId,
    blockedInitiativeIds,
    modelProbe,
  });
  const wakeAttempt = await wakeGatewayNow(completedTaskId, dispatchState.nextTask?.id ?? null);

  await writeJsonFile(resolveRepoPath("data", "exports", "dispatch-state.json"), dispatchState);
  await writeJsonFile(resolveRepoPath("data", "exports", "autonomy-queue.json"), dispatchState.queue);
  await writeJsonFile(resolveRepoPath("data", "exports", "dispatch-wake.json"), wakeAttempt);

  await emitLog({
    agent: "ops",
    session: "dispatch-complete-task",
    initiative: "continuous-dispatch",
    actionType: "complete-and-wake",
    subsystem: "dispatch",
    success: true,
    evidencePaths: [
      "data/exports/dispatch-state.json",
      "data/exports/autonomy-queue.json",
      "data/exports/dispatch-wake.json",
    ],
  });

  console.log(
    JSON.stringify(
      {
        completedTaskId,
        nextTaskId: dispatchState.nextTask?.id ?? null,
        readyCount: dispatchState.readyQueue.length,
        wake: wakeAttempt,
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
