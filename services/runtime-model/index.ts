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

async function commandExists(command: string): Promise<boolean> {
  try {
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
    const { stdout } = await execAsync(
      [command, ...args.map((argument) => quoteArg(argument))].join(" "),
      { timeout: 45_000 },
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function tryJsonCommand(command: string, args: string[]): Promise<unknown | null> {
  try {
    const { stdout } = await execFileAsync(command, args, { timeout: 45_000 });
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

function choosePreferredModel(candidates: string[]): string | null {
  for (const candidate of OPENCLAW_CANDIDATES) {
    if (candidates.includes(candidate)) {
      return candidate;
    }
  }

  return null;
}

function choosePreferredDeepModel(candidates: string[]): string | null {
  for (const candidate of OPENCLAW_DEEP_CANDIDATES) {
    if (candidates.includes(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function probeCodexCandidate(candidate: string): Promise<boolean> {
  const output = await tryCommand("codex", [
    "exec",
    "--model",
    candidate,
    "--sandbox",
    "workspace-write",
    "--ask-for-approval",
    "never",
    "Reply with exactly OK.",
  ]);
  return output?.includes("OK") ?? false;
}

async function activeProbeCodexCli(): Promise<{ general: string | null; deep: string | null }> {
  let general: string | null = null;
  for (const candidate of CODEX_GENERAL_CANDIDATES) {
    if (await probeCodexCandidate(candidate)) {
      general = candidate;
      break;
    }
  }

  let deep: string | null = null;
  for (const candidate of CODEX_DEEP_CANDIDATES) {
    if (await probeCodexCandidate(candidate)) {
      deep = candidate;
      break;
    }
  }

  return { general, deep };
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
    outputs.push(...collectStrings(listPayload));
  }

  const statusPayload = await tryJsonCommand("openclaw", ["models", "status", "--json"]);
  if (statusPayload) {
    outputs.push(...collectStrings(statusPayload));
  }

  return Array.from(new Set(outputs)).filter((value) => OPENCLAW_CANDIDATES.includes(value as (typeof OPENCLAW_CANDIDATES)[number]));
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
  openClawStatus: ModelAliasState["status"];
  openClawNote: string;
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
      status: probe.openClawStatus,
      note: probe.openClawNote,
    },
    {
      alias: "openclaw.model.frontier_deep",
      strategicTarget: "gpt-5.4-pro",
      resolvedModel: probe.openClawDeep,
      reasoning: "xhigh",
      surface: probe.openClawSurface,
      status: probe.openClawStatus,
      note: `${probe.openClawNote} Prefer the GPT-5.4 Pro provider route for the deepest control-plane work and fail fast instead of downshifting outside the GPT-5.4 family.`,
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
    openClawDeep: "openai-codex/gpt-5.4-pro",
    openClawFallback: "openai-codex/gpt-5.4",
    openClawProbeSource: "docs-only",
    openClawVerifiedCandidates: [],
    aliases: buildAliases({
      codexGeneralModel: "gpt-5.4",
      codexDeepModel: "gpt-5.4-pro",
      codexSurface: "provisional",
      codexGeneralStatus: "candidate",
      codexDeepStatus: "candidate",
      codexGeneralNote:
        "No live model-capabilities artifact was available, so GPT-5.4 remains the strategic Codex target under a provisional alias until a passive or active probe confirms the route on this host.",
      codexDeepNote:
        "GPT-5.4 Pro is the preferred deep-thinking alias when a surface exposes it; otherwise stay within the GPT-5.4 family and use xhigh reasoning.",
      openClawPrimary: "openai-codex/gpt-5.4",
      openClawDeep: "openai-codex/gpt-5.4-pro",
      openClawSurface: "source-fallback",
      openClawStatus: "candidate",
      openClawNote:
        "Current OpenClaw docs and merged upstream support point at openai-codex/gpt-5.4 for routine work and openai-codex/gpt-5.4-pro for the deepest GPT-5.4-family tasks, but a live authenticated gateway probe should still confirm the exact provider strings on the target host.",
    }),
    drift: [
      "OpenClaw is not installed on this host, so provider-model support is inferred from current official docs and merged upstream changes instead of a live gateway probe.",
      "GPT-5.4 Pro should be reserved for the deepest available surfaces; the OpenClaw runtime should stay within the GPT-5.4 family and fail fast on unsupported provider strings instead of downshifting to older model families.",
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

    if (probed.deep) {
      codexDeepModel = probed.deep;
      codexDeepStatus = "preferred";
      codexDeepNote = "A live Codex CLI probe confirmed GPT-5.4 Pro for deep reasoning on this host.";
    } else {
      codexDeepModel = codexGeneralModel;
      codexDeepStatus = codexGeneralStatus;
      codexDeepNote =
        "A live Codex CLI probe did not confirm GPT-5.4 Pro on this host, so deep work should stay on GPT-5.4 and increase reasoning effort to xhigh.";
    }
  } else if (!codexCliInstalled) {
    drift.push("Codex CLI is not installed on this host; GPT-5.4 aliases are policy defaults rather than live CLI probe results.");
  }

  let openClawPrimary = process.env.OPENCLAW_MODEL_PRIMARY ?? "";
  let openClawDeep = process.env.OPENCLAW_MODEL_DEEP ?? "openai-codex/gpt-5.4-pro";
  let openClawSurface: ModelAliasState["surface"] = "env-override";
  let openClawStatus: ModelAliasState["status"] = "preferred";
  let openClawNote = "Resolved from OPENCLAW_MODEL_PRIMARY override.";
  let openClawProbeSource: ModelCapabilityProbe["openClawProbeSource"] = "env-override";
  let openClawVerifiedCandidates: string[] = [];

  if (!openClawPrimary) {
    if (openclawInstalled && probeMode === "active") {
      openClawVerifiedCandidates = await probeOpenClawLiveCandidates();
      const livePreferred = choosePreferredModel(openClawVerifiedCandidates);
      const liveDeep = choosePreferredDeepModel(openClawVerifiedCandidates);
      if (livePreferred) {
        openClawPrimary = livePreferred;
        openClawDeep = liveDeep ?? openClawDeep;
        openClawSurface = "openclaw";
        openClawStatus = "preferred";
        openClawNote =
          "A live OpenClaw gateway probe confirmed GPT-5.4 provider routing on this host.";
        openClawProbeSource = "live-gateway";
      }
    }

    if (!openClawPrimary && openclawInstalled) {
      const configured = await detectOpenClawPrimary();
      if (configured && OPENCLAW_CANDIDATES.includes(configured as (typeof OPENCLAW_CANDIDATES)[number])) {
        openClawPrimary = configured;
        openClawSurface = "openclaw";
        openClawStatus = "preferred";
        openClawNote = "Live OpenClaw config on this host already resolves to GPT-5.4.";
        openClawProbeSource = "config-read";
        openClawVerifiedCandidates = openClawVerifiedCandidates.length > 0 ? openClawVerifiedCandidates : [configured];
      }
    }

    if (!openClawPrimary) {
      openClawPrimary = "openai-codex/gpt-5.4";
      openClawSurface = "source-fallback";
      openClawStatus = openclawInstalled ? "candidate" : "docs-only";
      openClawNote =
        "Current OpenClaw docs and merged upstream work point to GPT-5.4 for routine OpenClaw work and GPT-5.4 Pro for the deepest control-plane tasks, so the repo stays within the GPT-5.4 family and requires live runtime confirmation instead of silent downshifts.";
      openClawProbeSource = "docs-only";

      if (!openclawInstalled) {
        drift.push("OpenClaw is not installed on this host, so provider-model support is inferred from official docs instead of a live gateway probe.");
      } else if (probeMode === "active") {
        drift.push("OpenClaw is installed, but a live gateway probe did not yet confirm GPT-5.4 on this host. Do not downshift; update or re-auth the runtime instead.");
      } else {
        drift.push("OpenClaw is installed, but only passive evidence is available on this host; run an active gateway probe after auth to confirm GPT-5.4 provider routing.");
      }
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
      openClawStatus,
      openClawNote,
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
- Deep provider model: \`${probe.openClawDeep ?? "openai-codex/gpt-5.4-pro"}\`
- Fallback provider model: \`${probe.openClawFallback}\`
- Probe source: ${probe.openClawProbeSource}
- Live verified provider candidates: ${probe.openClawVerifiedCandidates.length > 0 ? probe.openClawVerifiedCandidates.join(", ") : "none yet"}

## Drift

${probe.drift.length === 0 ? "- None." : probe.drift.map((item) => `- ${item}`).join("\n")}

## Policy rules

- Use GPT-5.4 with high reasoning for substantive work by default.
- Prefer GPT-5.4 Pro with xhigh reasoning for the deepest available surfaces, but stay within the GPT-5.4 family instead of downshifting to older model families.
- Treat official OpenAI model docs, official Codex docs, merged OpenClaw upstream support, and live OpenClaw provider proof as separate truths.
- Keep OpenClaw configured within the GPT-5.4 family and fail fast on incompatibility instead of silently routing to weaker model families.
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
