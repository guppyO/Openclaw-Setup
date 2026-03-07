import { emitLog } from "../../services/common/logger.js";
import { loadLocalRuntimeEnv } from "../../services/common/env-loader.js";
import { readJsonFile, resolveRepoPath, writeJsonFile } from "../../services/common/fs.js";
import type { DispatchState, Experiment, Opportunity, QueueItem } from "../../services/common/types.js";
import { buildDispatchState } from "../../services/dispatch/index.js";
import { readModelCapabilityProbe } from "../../services/runtime-model/index.js";
import { pathToFileURL } from "node:url";

interface WakeAttempt {
  attemptedAt: string;
  environment: string;
  gatewayMode: string;
  hookBaseUrl: string | null;
  nextTaskId: string | null;
  completedTaskId: string;
  targetOwner: string | null;
  targetTaskId: string | null;
  targetTaskIds: string[];
  hookPath: string | null;
  ok: boolean;
  reason: string;
  statusCode?: number;
}

interface WakeSummary {
  attemptedAt: string;
  environment: string;
  gatewayMode: string;
  hookBaseUrl: string | null;
  nextTaskId: string | null;
  completedTaskId: string;
  targetedOwners: string[];
  ok: boolean;
  reason: string;
  wakeAttempts: WakeAttempt[];
}

interface WakeTarget {
  owner: string;
  taskIds: string[];
  primaryTaskId: string | null;
}

export function resolveRuntimeEnvironment(): string {
  return process.env.REVENUE_OS_ENVIRONMENT ?? "stage";
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

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function resolveGatewayHookBaseUrl(environment: string): {
  gatewayMode: string;
  hookBaseUrl: string | null;
} {
  const gatewayMode = process.env.OPENCLAW_REMOTE_ACCESS_MODE ?? "local";
  const configuredBaseUrl = process.env.OPENCLAW_HOOK_BASE_URL ?? process.env.OPENCLAW_GATEWAY_BASE_URL;
  const localPort = Number(process.env.OPENCLAW_GATEWAY_PORT ?? gatewayPortForEnvironment(environment));

  if (configuredBaseUrl) {
    return {
      gatewayMode,
      hookBaseUrl: stripTrailingSlash(configuredBaseUrl),
    };
  }

  if (gatewayMode === "local" || gatewayMode === "ssh-tunnel") {
    return {
      gatewayMode,
      hookBaseUrl: `http://127.0.0.1:${localPort}`,
    };
  }

  return {
    gatewayMode,
    hookBaseUrl: null,
  };
}

function buildWakeTargets(dispatchState: DispatchState): WakeTarget[] {
  const byOwner = new Map<string, string[]>();
  const prioritized = dispatchState.nextTask?.owner ?? null;

  for (const assignment of dispatchState.activeAssignments) {
    if (!byOwner.has(assignment.owner)) {
      byOwner.set(assignment.owner, []);
    }
    byOwner.get(assignment.owner)!.push(assignment.taskId);
  }

  const targets = Array.from(byOwner.entries()).map(([owner, taskIds]) => ({
    owner,
    taskIds,
    primaryTaskId: dispatchState.nextTask?.owner === owner ? dispatchState.nextTask.id : taskIds[0] ?? null,
  }));

  return targets.sort((left, right) => {
    if (prioritized && left.owner === prioritized && right.owner !== prioritized) {
      return -1;
    }
    if (prioritized && right.owner === prioritized && left.owner !== prioritized) {
      return 1;
    }
    return left.owner.localeCompare(right.owner);
  });
}

export async function completeTaskAndWake(completedTaskId: string): Promise<{
  dispatchState: DispatchState;
  wakeAttempt: WakeSummary;
}> {
  await loadLocalRuntimeEnv();

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

  const attemptedAt = new Date().toISOString();
  const environment = resolveRuntimeEnvironment();
  const hookToken = process.env.OPENCLAW_HOOK_TOKEN;
  const { gatewayMode, hookBaseUrl } = resolveGatewayHookBaseUrl(environment);
  const nextTaskId = dispatchState.nextTask?.id ?? null;
  const wakeTargets = buildWakeTargets(dispatchState);

  let wakeAttempt: WakeSummary = {
    attemptedAt,
    environment,
    gatewayMode,
    hookBaseUrl,
    completedTaskId,
    nextTaskId,
    targetedOwners: wakeTargets.map((target) => target.owner),
    ok: false,
    reason: "not-attempted",
    wakeAttempts: [],
  };

  if (!hookToken) {
    wakeAttempt = { ...wakeAttempt, reason: "missing-hook-token" };
  } else if (wakeTargets.length === 0) {
    wakeAttempt = { ...wakeAttempt, reason: "no-active-assignments" };
  } else if (!hookBaseUrl) {
    wakeAttempt = { ...wakeAttempt, reason: "missing-remote-gateway-base-url" };
  } else {
    const wakeAttempts = await Promise.all(
      wakeTargets.map(async (target): Promise<WakeAttempt> => {
        const hookPath = `/hooks/dispatch/${target.owner}`;
        const response = await fetch(`${hookBaseUrl}${hookPath}`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${hookToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            text: `Dispatch continuation requested after task completion. Completed task: ${completedTaskId}. Target owner: ${target.owner}. Primary task: ${target.primaryTaskId ?? "none"}.`,
            mode: "now",
            completedTaskId,
            nextTaskId,
            targetOwner: target.owner,
            targetTaskId: target.primaryTaskId,
            targetTaskIds: target.taskIds,
          }),
        }).catch(() => null);

        return response
          ? {
              attemptedAt,
              environment,
              gatewayMode,
              hookBaseUrl,
              completedTaskId,
              nextTaskId,
              targetOwner: target.owner,
              targetTaskId: target.primaryTaskId,
              targetTaskIds: target.taskIds,
              hookPath,
              ok: response.ok,
              reason: response.ok ? "wake-request-sent" : "wake-request-rejected",
              statusCode: response.status,
            }
          : {
              attemptedAt,
              environment,
              gatewayMode,
              hookBaseUrl,
              completedTaskId,
              nextTaskId,
              targetOwner: target.owner,
              targetTaskId: target.primaryTaskId,
              targetTaskIds: target.taskIds,
              hookPath,
              ok: false,
              reason: "wake-request-failed",
            };
      }),
    );

    const okCount = wakeAttempts.filter((attempt) => attempt.ok).length;
    wakeAttempt = {
      ...wakeAttempt,
      wakeAttempts,
      ok: okCount === wakeAttempts.length,
      reason:
        okCount === wakeAttempts.length
          ? "wake-requests-sent"
          : okCount > 0
            ? "wake-requests-partial"
            : "wake-requests-failed",
    };
  }

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

  return {
    dispatchState,
    wakeAttempt,
  };
}

async function main(): Promise<void> {
  const completedTaskId = parseTaskId();
  const result = await completeTaskAndWake(completedTaskId);

  console.log(
    JSON.stringify(
      {
        completedTaskId,
        nextTaskId: result.dispatchState.nextTask?.id ?? null,
        readyCount: result.dispatchState.readyQueue.length,
        activeAssignments: result.dispatchState.activeAssignments.length,
        wake: result.wakeAttempt,
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
