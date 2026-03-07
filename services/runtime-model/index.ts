import { exec, execFile } from "node:child_process";
import { promisify } from "node:util";

import { renderTable } from "../common/markdown.js";
import { fileExists, readJsonFile, resolveRepoPath, writeJsonFile, writeTextFile } from "../common/fs.js";
import { loadLocalRuntimeEnv } from "../common/env-loader.js";
import type { ModelAliasState, ModelCapabilityProbe, RuntimeProbeMode } from "../common/types.js";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

const CODEX_GENERAL_CANDIDATES = ["gpt-5.4", "gpt-5.4-pro"] as const;
const CODEX_DEEP_CANDIDATES = ["gpt-5.4-pro", "gpt-5.4"] as const;
const OPENCLAW_CANDIDATES = ["openai-codex/gpt-5.4", "openai-codex/gpt-5.4-pro"] as const;
const OPENCLAW_DEEP_CANDIDATES = ["openai-codex/gpt-5.4-pro", "openai-codex/gpt-5.4"] as const;

interface CodexProbeResult {
  supported: boolean;
  unsupportedByChatGptAccount: boolean;
  output: string;
}

interface OpenClawListedModel {
  key: string;
  available?: boolean;
  contextWindow?: number;
  tags?: string[];
}

async function commandExists(command: string): Promise<boolean> {
  try {
    if (command === "openclaw") {
      const explicit = process.env.OPENCLAW_BIN?.trim();
      if (explicit && (await fileExists(explicit))) {
        return true;
      }
    }

    if (process.platform === "win32") {
      const appData = process.env.APPDATA;
      if (appData) {
        const shimCandidates = [
          `${appData}\\npm\\${command}.ps1`,
          `${appData}\\npm\\${command}.cmd`,
          `${appData}\\npm\\${command}`,
        ];
        for (const candidate of shimCandidates) {
          if (await fileExists(candidate)) {
            return true;
          }
        }
      }

      await execFileAsync("where.exe", [command], {
        timeout: 20_000,
      });
      return true;
    }

    await execAsync(`command -v ${command}`, { timeout: 20_000 });
    return true;
  } catch {
    return false;
  }
}

function quoteArg(value: string): string {
  if (/^[A-Za-z0-9_./:-]+$/.test(value)) {
    return value;
  }

  return `"${value.replace(/(["\\$`])/g, "\\$1")}"`;
}

async function tryCommand(command: string, args: string[]): Promise<string | null> {
  try {
    const resolvedCommand = command === "openclaw" ? process.env.OPENCLAW_BIN?.trim() || command : command;
    const { stdout } = await execAsync(
      [resolvedCommand, ...args.map((argument) => quoteArg(argument))].join(" "),
      { timeout: 45_000 },
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function tryJsonCommand(command: string, args: string[]): Promise<unknown | null> {
  try {
    const resolvedCommand = command === "openclaw" ? process.env.OPENCLAW_BIN?.trim() || command : command;
    const { stdout } = await execFileAsync(resolvedCommand, args, { timeout: 45_000 });
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function collectStrings(value: unknown, results: Set<string> = new Set<string>()): Set<string> {
  if (typeof value === "string") {
    results.add(value);
    return results;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, results);
    }
    return results;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectStrings(item, results);
    }
  }

  return results;
}

function isOpenClawCodexModel(value: string): boolean {
  return value.startsWith("openai-codex/");
}

function parseListedModels(value: unknown): OpenClawListedModel[] {
  if (!value || typeof value !== "object" || !("models" in value)) {
    return [];
  }

  const models = (value as { models?: unknown }).models;
  if (!Array.isArray(models)) {
    return [];
  }

  return models
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .map((entry) => ({
      key: typeof entry.key === "string" ? entry.key : "",
      available: typeof entry.available === "boolean" ? entry.available : undefined,
      contextWindow: typeof entry.contextWindow === "number" ? entry.contextWindow : undefined,
      tags: Array.isArray(entry.tags) ? entry.tags.filter((tag): tag is string => typeof tag === "string") : undefined,
    }))
    .filter((entry) => entry.key.length > 0);
}

function rankOpenClawModel(model: OpenClawListedModel): number {
  let score = 0;

  if (model.key === "openai-codex/gpt-5.4-pro") {
    score += 10_000;
  } else if (model.key === "openai-codex/gpt-5.4") {
    score += 9_000;
  } else if (model.tags?.includes("default")) {
    score += 8_000;
  } else if (model.key.includes("codex")) {
    score += 7_000;
  }

  if (model.available !== false) {
    score += 500;
  }

  if (typeof model.contextWindow === "number") {
    score += Math.min(model.contextWindow, 2_000_000) / 1_000;
  }

  return score;
}

function chooseStrongestOpenClawModel(candidates: string[]): string | null {
  if (candidates.length === 0) {
    return null;
  }

  return candidates[0] ?? null;
}

function choosePreferredModel(candidates: string[]): string | null {
  for (const candidate of OPENCLAW_CANDIDATES) {
    if (candidates.includes(candidate)) {
      return candidate;
    }
  }

  return chooseStrongestOpenClawModel(candidates);
}

function choosePreferredDeepModel(candidates: string[]): string | null {
  for (const candidate of OPENCLAW_DEEP_CANDIDATES) {
    if (candidates.includes(candidate)) {
      return candidate;
    }
  }

  return chooseStrongestOpenClawModel(candidates);
}

async function probeCodexCandidate(candidate: string): Promise<boolean> {
  const output = await tryCommand("codex", [
    "exec",
    "--model",
    candidate,
    "--sandbox",
    "workspace-write",
    "Reply with exactly OK.",
  ]);
  return output?.includes("OK") ?? false;
}

async function runCodexProbe(candidate: string): Promise<CodexProbeResult> {
  try {
    const { stdout, stderr } = await execFileAsync("codex", [
      "exec",
      "--model",
      candidate,
      "--sandbox",
      "workspace-write",
      "Reply with exactly OK.",
    ], { timeout: 90_000 });
    const output = `${stdout}\n${stderr}`.trim();
    return {
      supported: /\bOK\b/.test(output),
      unsupportedByChatGptAccount: output.includes("not supported when using Codex with a ChatGPT account"),
      output,
    };
  } catch (error) {
    const stdout = error && typeof error === "object" && "stdout" in error ? String(error.stdout ?? "") : "";
    const stderr = error && typeof error === "object" && "stderr" in error ? String(error.stderr ?? "") : "";
    const message = error instanceof Error ? error.message : String(error ?? "");
    const output = [stdout, stderr, message].filter((value) => value.length > 0).join("\n").trim();
    return {
      supported: false,
      unsupportedByChatGptAccount: output.includes("not supported when using Codex with a ChatGPT account"),
      output,
    };
  }
}

async function activeProbeCodexCli(): Promise<{
  general: string | null;
  deep: string | null;
  generalProbe?: CodexProbeResult;
  deepProbe?: CodexProbeResult;
  deepUnsupportedByChatGptAccount: boolean;
}> {
  let generalProbe: CodexProbeResult | undefined;
  let general: string | null = null;
  for (const candidate of CODEX_GENERAL_CANDIDATES) {
    const probe = await runCodexProbe(candidate);
    if (!generalProbe) {
      generalProbe = probe;
    }
    if (probe.supported) {
      general = candidate;
      break;
    }
  }

  let deepProbe: CodexProbeResult | undefined;
  let deepUnsupportedByChatGptAccount = false;
  let deep: string | null = null;
  for (const candidate of CODEX_DEEP_CANDIDATES) {
    const probe = await runCodexProbe(candidate);
    if (probe.unsupportedByChatGptAccount) {
      deepUnsupportedByChatGptAccount = true;
    }
    if (!deepProbe || probe.supported || probe.unsupportedByChatGptAccount) {
      deepProbe = probe;
    }
    if (probe.supported) {
      deep = candidate;
      break;
    }
  }

  return { general, deep, generalProbe, deepProbe, deepUnsupportedByChatGptAccount };
}

async function detectOpenClawPrimary(): Promise<string | null> {
  const configured = await tryCommand("openclaw", ["config", "get", "model.primary"]);
  if (configured) {
    return configured;
  }

  return null;
}

async function probeOpenClawLiveCandidates(): Promise<string[]> {
  const outputs: string[] = [];
  const listPayload = await tryJsonCommand("openclaw", ["models", "list", "--provider", "openai-codex", "--json"]);
  if (listPayload) {
    const listedModels = parseListedModels(listPayload)
      .filter((model) => isOpenClawCodexModel(model.key))
      .filter((model) => model.available !== false)
      .sort((left, right) => rankOpenClawModel(right) - rankOpenClawModel(left))
      .map((model) => model.key);
    outputs.push(...listedModels);
    outputs.push(...collectStrings(listPayload));
  }

  const statusPayload = await tryJsonCommand("openclaw", ["models", "status", "--json"]);
  if (statusPayload) {
    outputs.push(...collectStrings(statusPayload));
  }

  const unique: string[] = [];
  for (const candidate of outputs) {
    if (!isOpenClawCodexModel(candidate) || unique.includes(candidate)) {
      continue;
    }
    unique.push(candidate);
  }

  return unique;
}

function parseEnvCandidateList(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((value): value is string => typeof value === "string" && isOpenClawCodexModel(value));
    }
  } catch {
    // fall through to comma-separated parsing
  }

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && isOpenClawCodexModel(value));
}

function buildAliases(probe: {
  codexGeneralModel: string;
  codexDeepModel: string;
  codexSurface: ModelAliasState["surface"];
  codexGeneralStatus: ModelAliasState["status"];
  codexDeepStatus: ModelAliasState["status"];
  codexGeneralNote: string;
  codexDeepNote: string;
  openClawPrimary: string;
  openClawDeep: string;
  openClawSurface: ModelAliasState["surface"];
  openClawPrimaryStatus: ModelAliasState["status"];
  openClawDeepStatus: ModelAliasState["status"];
  openClawPrimaryNote: string;
  openClawDeepNote: string;
}): ModelAliasState[] {
  return [
    {
      alias: "model.primary_frontier",
      strategicTarget: "gpt-5.4",
      resolvedModel: probe.codexGeneralModel,
      reasoning: "high",
      surface: probe.codexSurface,
      status: probe.codexGeneralStatus,
      note: probe.codexGeneralNote,
    },
    {
      alias: "model.frontier_deep",
      strategicTarget: "gpt-5.4-pro",
      resolvedModel: probe.codexDeepModel,
      reasoning: "xhigh",
      surface: probe.codexSurface,
      status: probe.codexDeepStatus,
      note: probe.codexDeepNote,
    },
    {
      alias: "model.frontier_browser",
      strategicTarget: "gpt-5.4",
      resolvedModel: probe.codexGeneralModel,
      reasoning: "high",
      surface: probe.codexSurface,
      status: probe.codexGeneralStatus,
      note: probe.codexGeneralNote,
    },
    {
      alias: "model.frontier_research",
      strategicTarget: "gpt-5.4-pro",
      resolvedModel: probe.codexDeepModel,
      reasoning: "xhigh",
      surface: probe.codexSurface,
      status: probe.codexDeepStatus,
      note: probe.codexDeepNote,
    },
    {
      alias: "model.frontier_build",
      strategicTarget: "gpt-5.4",
      resolvedModel: probe.codexGeneralModel,
      reasoning: "high",
      surface: probe.codexSurface,
      status: probe.codexGeneralStatus,
      note: probe.codexGeneralNote,
    },
    {
      alias: "openclaw.model.primary_frontier",
      strategicTarget: "gpt-5.4",
      resolvedModel: probe.openClawPrimary,
      reasoning: "high",
      surface: probe.openClawSurface,
      status: probe.openClawPrimaryStatus,
      note: probe.openClawPrimaryNote,
    },
    {
      alias: "openclaw.model.frontier_deep",
      strategicTarget: "gpt-5.4-pro",
      resolvedModel: probe.openClawDeep,
      reasoning: "xhigh",
      surface: probe.openClawSurface,
      status: probe.openClawDeepStatus,
      note: probe.openClawDeepNote,
    },
  ];
}

export function buildDefaultModelProbe(): ModelCapabilityProbe {
  return {
    detectedAt: new Date().toISOString(),
    probeMode: "passive",
    provisional: true,
    codexCliInstalled: false,
    openclawInstalled: false,
    strategicTarget: "gpt-5.4",
    deepThinkingTarget: "gpt-5.4-pro",
    officialFrontierModel: "gpt-5.4-pro",
    officialGeneralModel: "gpt-5.4",
    officialCodexDocsStatus: "verified",
    openClawPrimary: "openai-codex/gpt-5.4",
    openClawDeep: "openai-codex/gpt-5.4",
    openClawFallback: "openai-codex/gpt-5.4",
    openClawProbeSource: "docs-only",
    openClawVerifiedCandidates: [],
    aliases: buildAliases({
      codexGeneralModel: "gpt-5.4",
      codexDeepModel: "gpt-5.4",
      codexSurface: "provisional",
      codexGeneralStatus: "candidate",
      codexDeepStatus: "fallback",
      codexGeneralNote:
        "No live model-capabilities artifact was available, so GPT-5.4 remains the strategic Codex target under a provisional alias until a passive or active probe confirms the route on this host.",
      codexDeepNote:
        "GPT-5.4 Pro is only the deep-thinking alias when a surface actually exposes it. For ChatGPT-account-backed Codex work, the supportable deep route usually remains GPT-5.4 with xhigh reasoning until a live probe confirms GPT-5.4 Pro.",
      openClawPrimary: "openai-codex/gpt-5.4",
      openClawDeep: "openai-codex/gpt-5.4",
      openClawSurface: "source-fallback",
      openClawPrimaryStatus: "candidate",
      openClawDeepStatus: "fallback",
      openClawPrimaryNote:
        "Current OpenClaw docs and merged upstream support point at openai-codex/gpt-5.4 for routine work.",
      openClawDeepNote:
        "Keep xhigh reasoning on GPT-5.4 until a live authenticated gateway probe proves a deeper GPT-5.4 Pro provider route on the target host.",
    }),
    drift: [
      "OpenClaw is not installed on this host, so provider-model support is inferred from current official docs and merged upstream changes instead of a live gateway probe.",
      "GPT-5.4 Pro should be reserved for the deepest available surfaces; if the live OpenClaw provider still lags behind GPT-5.4, use the strongest verified provider candidate instead of a fake unsupported route.",
    ],
  };
}

export async function probeModelCapabilities(probeMode: RuntimeProbeMode = "passive"): Promise<ModelCapabilityProbe> {
  await loadLocalRuntimeEnv();

  const codexCliInstalled = await commandExists("codex");
  const openclawInstalled = await commandExists("openclaw");
  const strategicTarget = process.env.REVENUE_OS_STRATEGIC_MODEL ?? "gpt-5.4";
  const deepThinkingTarget = process.env.REVENUE_OS_DEEP_MODEL ?? "gpt-5.4-pro";
  const drift: string[] = [];

  let codexGeneralModel = process.env.CODEX_MODEL_PRIMARY ?? strategicTarget;
  let codexDeepModel = process.env.CODEX_MODEL_DEEP ?? deepThinkingTarget;
  let codexGeneralStatus: ModelAliasState["status"] = codexCliInstalled ? "preferred" : "candidate";
  let codexDeepStatus: ModelAliasState["status"] = codexCliInstalled ? "candidate" : "candidate";
  let codexGeneralNote = codexCliInstalled
    ? "Codex CLI is available on this host, so GPT-5.4 remains the preferred route for substantive work."
    : "Codex CLI is not installed on this host, so GPT-5.4 remains an official strategic target rather than a locally verified CLI route.";
  let codexDeepNote =
    "GPT-5.4 Pro is preferred for the hardest reasoning work where a local surface exposes it; otherwise stay within GPT-5.4 and elevate reasoning effort to xhigh.";
  if (probeMode === "active" && codexCliInstalled) {
    const probed = await activeProbeCodexCli();
    if (probed.general) {
      codexGeneralModel = probed.general;
      codexGeneralStatus = "preferred";
      codexGeneralNote = "A live Codex CLI probe confirmed GPT-5.4 for routine substantive work on this host.";
    } else {
      drift.push("Active Codex CLI model probe did not confirm GPT-5.4 on this host; keep the repo policy pinned to GPT-5.4 and treat the local surface as needing re-auth or upgrade.");
    }

    if (probed.deep === "gpt-5.4-pro") {
      codexDeepModel = probed.deep;
      codexDeepStatus = "preferred";
      codexDeepNote = "A live Codex CLI probe confirmed GPT-5.4 Pro for deep reasoning on this host.";
    } else if (probed.deepUnsupportedByChatGptAccount) {
      codexDeepModel = codexGeneralModel;
      codexDeepStatus = "fallback";
      codexDeepNote =
        "The local ChatGPT-account-backed Codex surface rejects GPT-5.4 Pro, so deep work stays on GPT-5.4 with xhigh reasoning on this host.";
      drift.push("GPT-5.4 Pro is not supported when using Codex with a ChatGPT account on this host; the supportable deep Codex route remains GPT-5.4 with xhigh reasoning.");
    } else if (probed.deep) {
      codexDeepModel = probed.deep;
      codexDeepStatus = "fallback";
      codexDeepNote =
        "A live Codex CLI probe did not expose GPT-5.4 Pro on this host, so deep work stays on GPT-5.4 with xhigh reasoning.";
    } else {
      codexDeepModel = codexGeneralModel;
      codexDeepStatus = "fallback";
      codexDeepNote =
        "A live Codex CLI probe did not confirm GPT-5.4 Pro on this host, so deep work should stay on GPT-5.4 and increase reasoning effort to xhigh.";
    }
  } else if (!codexCliInstalled) {
    drift.push("Codex CLI is not installed on this host; GPT-5.4 aliases are policy defaults rather than live CLI probe results.");
  }

  const configuredOpenClawPrimary = process.env.OPENCLAW_MODEL_PRIMARY ?? "";
  const configuredOpenClawDeep =
    process.env.OPENCLAW_MODEL_DEEP ??
    configuredOpenClawPrimary ??
    process.env.OPENCLAW_LIVE_PROVIDER_DEEP ??
    process.env.OPENCLAW_LIVE_PROVIDER_PRIMARY ??
    "openai-codex/gpt-5.4";
  let openClawPrimary = "";
  let openClawDeep = configuredOpenClawDeep;
  let openClawSurface: ModelAliasState["surface"] = "env-override";
  let openClawPrimaryStatus: ModelAliasState["status"] = "preferred";
  let openClawDeepStatus: ModelAliasState["status"] = "fallback";
  let openClawPrimaryNote = "Resolved from OPENCLAW_MODEL_PRIMARY override.";
  let openClawDeepNote = "Resolved from OPENCLAW_MODEL_DEEP override.";
  let openClawProbeSource: ModelCapabilityProbe["openClawProbeSource"] = "env-override";
  let openClawVerifiedCandidates: string[] = [];

  if (openclawInstalled && probeMode === "active") {
    openClawVerifiedCandidates = await probeOpenClawLiveCandidates();
    const livePreferred = choosePreferredModel(openClawVerifiedCandidates);
    const liveDeep = choosePreferredDeepModel(openClawVerifiedCandidates);
    if (livePreferred) {
      openClawPrimary = livePreferred;
      openClawDeep = liveDeep ?? livePreferred;
      openClawSurface = "openclaw";
      openClawPrimaryStatus = OPENCLAW_CANDIDATES.includes(livePreferred as (typeof OPENCLAW_CANDIDATES)[number]) ? "preferred" : "fallback";
      openClawDeepStatus = openClawDeep === "openai-codex/gpt-5.4-pro" ? openClawPrimaryStatus : "fallback";
      openClawPrimaryNote = OPENCLAW_CANDIDATES.includes(livePreferred as (typeof OPENCLAW_CANDIDATES)[number])
        ? openClawDeep === "openai-codex/gpt-5.4-pro"
          ? "A live OpenClaw gateway probe confirmed GPT-5.4 routine routing and GPT-5.4 Pro as the deepest available provider route on this host."
          : "A live OpenClaw gateway probe confirmed GPT-5.4 as the strongest currently available provider route on this host; xhigh reasoning should stay on GPT-5.4 until GPT-5.4 Pro is actually exposed."
        : `A live OpenClaw gateway probe exposed ${livePreferred} as the strongest currently available provider candidate on this host.`;
      openClawDeepNote =
        openClawDeep === "openai-codex/gpt-5.4-pro"
          ? openClawPrimaryNote
          : "The authenticated OpenClaw provider on this host does not currently expose GPT-5.4 Pro, so deep control-plane work stays on GPT-5.4 with xhigh reasoning.";
      openClawProbeSource = "live-gateway";
      if (!OPENCLAW_CANDIDATES.includes(livePreferred as (typeof OPENCLAW_CANDIDATES)[number])) {
        drift.push(`The live authenticated OpenClaw provider on this host currently exposes ${livePreferred} instead of a GPT-5.4-family route.`);
      }
      if (configuredOpenClawPrimary && configuredOpenClawPrimary !== openClawPrimary) {
        drift.push(
          `OPENCLAW_MODEL_PRIMARY was ${configuredOpenClawPrimary}, but the live authenticated provider resolved to ${openClawPrimary}; live provider truth now takes precedence.`,
        );
      }
      if (configuredOpenClawDeep && configuredOpenClawDeep !== openClawDeep) {
        drift.push(
          `OPENCLAW_MODEL_DEEP was ${configuredOpenClawDeep}, but the live authenticated provider only supports ${openClawDeep} as the deepest current route on this host.`,
        );
      }
    }
  }

  if (!openClawPrimary && openclawInstalled) {
    const configured = await detectOpenClawPrimary();
    if (configured && isOpenClawCodexModel(configured)) {
      openClawPrimary = configured;
      openClawDeep = configured === "openai-codex/gpt-5.4" ? "openai-codex/gpt-5.4" : configured;
      openClawSurface = "openclaw";
      openClawPrimaryStatus = OPENCLAW_CANDIDATES.includes(configured as (typeof OPENCLAW_CANDIDATES)[number]) ? "preferred" : "fallback";
      openClawDeepStatus = openClawDeep === "openai-codex/gpt-5.4-pro" ? openClawPrimaryStatus : "fallback";
      openClawPrimaryNote = OPENCLAW_CANDIDATES.includes(configured as (typeof OPENCLAW_CANDIDATES)[number])
        ? configured === "openai-codex/gpt-5.4"
          ? "Live OpenClaw config on this host resolves to GPT-5.4; deeper reasoning should stay on GPT-5.4 with xhigh effort until a separate GPT-5.4 Pro route is exposed."
          : "Live OpenClaw config on this host already resolves to the GPT-5.4 family."
        : `Live OpenClaw config on this host already resolves to ${configured}.`;
      openClawDeepNote =
        openClawDeep === "openai-codex/gpt-5.4-pro"
          ? openClawPrimaryNote
          : "The saved OpenClaw config on this host does not expose GPT-5.4 Pro, so deep work stays on GPT-5.4 with xhigh reasoning.";
      openClawProbeSource = "config-read";
      openClawVerifiedCandidates = openClawVerifiedCandidates.length > 0 ? openClawVerifiedCandidates : [configured];
      if (!OPENCLAW_CANDIDATES.includes(configured as (typeof OPENCLAW_CANDIDATES)[number])) {
        drift.push(`The saved OpenClaw config on this host currently resolves to ${configured}, which is outside the GPT-5.4 family.`);
      }
    }
  }

  const remoteLivePrimary =
    process.env.OPENCLAW_LIVE_PROVIDER_PRIMARY?.trim() || process.env.OPENCLAW_REMOTE_PROVIDER_PRIMARY?.trim() || "";
  const remoteLiveDeep =
    process.env.OPENCLAW_LIVE_PROVIDER_DEEP?.trim() || process.env.OPENCLAW_REMOTE_PROVIDER_DEEP?.trim() || "";
  const remoteLiveCandidates = parseEnvCandidateList(
    process.env.OPENCLAW_LIVE_PROVIDER_CANDIDATES ?? process.env.OPENCLAW_REMOTE_PROVIDER_CANDIDATES,
  );
  if (!openClawPrimary && remoteLivePrimary && isOpenClawCodexModel(remoteLivePrimary)) {
    openClawPrimary = remoteLivePrimary;
    openClawDeep = remoteLiveDeep && isOpenClawCodexModel(remoteLiveDeep) ? remoteLiveDeep : remoteLivePrimary;
    openClawSurface = "openclaw";
    openClawPrimaryStatus = OPENCLAW_CANDIDATES.includes(remoteLivePrimary as (typeof OPENCLAW_CANDIDATES)[number])
      ? "preferred"
      : "fallback";
    openClawDeepStatus = openClawDeep === "openai-codex/gpt-5.4-pro" ? openClawPrimaryStatus : "fallback";
    openClawPrimaryNote =
      "Resolved from live remote OpenClaw gateway metadata stored in the local runtime env. This reflects the authenticated VPS gateway rather than the local Windows CLI surface.";
    openClawDeepNote =
      openClawDeep === "openai-codex/gpt-5.4-pro"
        ? openClawPrimaryNote
        : "Resolved from live remote OpenClaw gateway metadata. The deployed gateway does not currently expose GPT-5.4 Pro, so deep control-plane work stays on GPT-5.4 with xhigh reasoning.";
    openClawProbeSource = "live-gateway";
    openClawVerifiedCandidates = remoteLiveCandidates.length > 0 ? remoteLiveCandidates : [remoteLivePrimary];
  }

  if (!openClawPrimary && configuredOpenClawPrimary) {
    openClawPrimary = configuredOpenClawPrimary;
    openClawDeep = configuredOpenClawDeep;
    openClawSurface = "env-override";
    openClawPrimaryStatus = "preferred";
    openClawDeepStatus = openClawDeep === "openai-codex/gpt-5.4-pro" ? "preferred" : "fallback";
    openClawPrimaryNote = "Resolved from OPENCLAW_MODEL_PRIMARY override because no live provider evidence was available.";
    openClawDeepNote =
      openClawDeep === "openai-codex/gpt-5.4-pro"
        ? "Resolved from OPENCLAW_MODEL_DEEP override because no live provider evidence was available."
        : "Resolved from OPENCLAW_MODEL_DEEP override. Deep work stays on GPT-5.4 until a live provider proves GPT-5.4 Pro.";
  }

  if (!openClawPrimary) {
    openClawPrimary = "openai-codex/gpt-5.4";
    openClawDeep = "openai-codex/gpt-5.4";
    openClawSurface = "source-fallback";
    openClawPrimaryStatus = openclawInstalled ? "candidate" : "docs-only";
    openClawDeepStatus = "fallback";
    openClawPrimaryNote =
      "Current OpenClaw docs and merged upstream work point to GPT-5.4 for routine OpenClaw work, so the repo treats GPT-5.4 as the intended route until a live runtime proves the exact provider candidate on the target host.";
    openClawDeepNote =
      "The best supportable deep OpenClaw route remains GPT-5.4 with xhigh reasoning until a live runtime proves a GPT-5.4 Pro provider route on the target host.";
    openClawProbeSource = "docs-only";

    if (!openclawInstalled) {
      drift.push("OpenClaw is not installed on this host, so provider-model support is inferred from official docs instead of a live gateway probe.");
    } else if (probeMode === "active") {
      drift.push("OpenClaw is installed, but a live gateway probe did not yet confirm a provider candidate on this host. Keep GPT-5.4 as the intended route and re-probe after auth.");
    } else {
      drift.push("OpenClaw is installed, but only passive evidence is available on this host; run an active gateway probe after auth to confirm GPT-5.4 provider routing.");
    }
  }

  const openClawFallback = process.env.OPENCLAW_MODEL_FALLBACK ?? openClawPrimary;

  return {
    detectedAt: new Date().toISOString(),
    probeMode,
    provisional: false,
    codexCliInstalled,
    openclawInstalled,
    strategicTarget,
    deepThinkingTarget,
    officialFrontierModel: "gpt-5.4-pro",
    officialGeneralModel: "gpt-5.4",
    officialCodexDocsStatus: "verified",
    openClawPrimary,
    openClawDeep,
    openClawFallback,
    openClawProbeSource,
    openClawVerifiedCandidates,
    aliases: buildAliases({
      codexGeneralModel,
      codexDeepModel,
      codexSurface: codexCliInstalled ? "codex-cli" : "provisional",
      codexGeneralStatus,
      codexDeepStatus,
      codexGeneralNote,
      codexDeepNote,
      openClawPrimary,
      openClawDeep,
      openClawSurface,
      openClawPrimaryStatus,
      openClawDeepStatus,
      openClawPrimaryNote,
      openClawDeepNote,
    }),
    drift,
  };
}

export function buildModelPolicyMarkdown(probe: ModelCapabilityProbe): string {
  return `# Runtime Model Policy

Generated on ${probe.detectedAt}.

## Strategic defaults

- Company-level target: \`${probe.strategicTarget}\`
- Deep-thinking target: \`${probe.deepThinkingTarget}\`
- Official frontier model page: \`${probe.officialFrontierModel}\`
- Official general model route: \`${probe.officialGeneralModel}\`
- Official Codex docs state: ${probe.officialCodexDocsStatus}
- Provisional artifact: ${probe.provisional ? "yes" : "no"}
- Codex CLI installed: ${probe.codexCliInstalled ? "yes" : "no"}
- OpenClaw installed on this host: ${probe.openclawInstalled ? "yes" : "no"}
- Probe mode: ${probe.probeMode}

## Alias map

${renderTable(
  ["Alias", "Resolved model", "Reasoning", "Status", "Surface"],
  probe.aliases.map((alias) => [
    alias.alias,
    alias.resolvedModel,
    alias.reasoning,
    alias.status,
    alias.surface,
  ]),
)}

## OpenClaw routing

- Primary provider model: \`${probe.openClawPrimary}\`
- Deep provider model: \`${probe.openClawDeep ?? probe.openClawPrimary ?? "openai-codex/gpt-5.4"}\`
- Fallback provider model: \`${probe.openClawFallback}\`
- Probe source: ${probe.openClawProbeSource}
- Live verified provider candidates: ${probe.openClawVerifiedCandidates.length > 0 ? probe.openClawVerifiedCandidates.join(", ") : "none yet"}

## Drift

${probe.drift.length === 0 ? "- None." : probe.drift.map((item) => `- ${item}`).join("\n")}

## Policy rules

- Use GPT-5.4 with high reasoning for substantive work by default.
- Prefer GPT-5.4 Pro with xhigh reasoning for the deepest available surfaces.
- Treat official OpenAI model docs, official Codex docs, merged OpenClaw upstream support, and live OpenClaw provider proof as separate truths.
- Keep GPT-5.4 as the intended OpenClaw route, but if the live authenticated provider still exposes an older Codex model, use the strongest verified provider candidate on that host until the provider catches up.
- Use high reasoning by default and xhigh for architecture, policy-sensitive research, major debugging, and capital allocation decisions.
`;
}

export async function writeModelCapabilityArtifacts(
  probe: ModelCapabilityProbe,
): Promise<void> {
  await writeJsonFile(resolveRepoPath("data", "exports", "model-capabilities.json"), probe);
  await writeTextFile(resolveRepoPath("docs", "runtime-model-policy.md"), buildModelPolicyMarkdown(probe));
}

export async function readModelCapabilityProbe(): Promise<ModelCapabilityProbe> {
  const filePath = resolveRepoPath("data", "exports", "model-capabilities.json");
  if (await fileExists(filePath)) {
    return readJsonFile<ModelCapabilityProbe>(filePath, buildDefaultModelProbe());
  }

  try {
    return await probeModelCapabilities("passive");
  } catch {
    return buildDefaultModelProbe();
  }
}
