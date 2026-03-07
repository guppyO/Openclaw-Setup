import { exec, execFile } from "node:child_process";
import { promisify } from "node:util";

import { renderTable } from "../common/markdown.js";
import { fileExists, readJsonFile, resolveRepoPath, writeJsonFile, writeTextFile } from "../common/fs.js";
import { loadLocalRuntimeEnv } from "../common/env-loader.js";
import type { ModelAliasState, ModelCapabilityProbe, RuntimeProbeMode } from "../common/types.js";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

const CODEX_CANDIDATES = ["gpt-5.4", "gpt-5.4-codex", "gpt-5.3-codex"] as const;
const OPENCLAW_CANDIDATES = [
  "openai-codex/gpt-5.4",
  "openai-codex/gpt-5.4-codex",
  "openai-codex/gpt-5.3-codex",
  "openai-codex/gpt-5-codex",
  "openai-codex/gpt-5.1-codex",
] as const;

async function commandExists(command: string): Promise<boolean> {
  try {
    if (process.platform === "win32") {
      await execAsync(`powershell -NoProfile -Command "if (Get-Command ${command} -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"`, {
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

async function activeProbeCodexCli(): Promise<string | null> {
  for (const candidate of CODEX_CANDIDATES) {
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
    if (output?.includes("OK")) {
      return candidate;
    }
  }

  return null;
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
  codexModel: string;
  codexSurface: ModelAliasState["surface"];
  codexStatus: ModelAliasState["status"];
  codexNote: string;
  openClawPrimary: string;
  openClawSurface: ModelAliasState["surface"];
  openClawStatus: ModelAliasState["status"];
  openClawNote: string;
}): ModelAliasState[] {
  return [
    {
      alias: "model.primary_frontier",
      strategicTarget: "gpt-5.4",
      resolvedModel: probe.codexModel,
      reasoning: "high",
      surface: probe.codexSurface,
      status: probe.codexStatus,
      note: probe.codexNote,
    },
    {
      alias: "model.frontier_browser",
      strategicTarget: "gpt-5.4",
      resolvedModel: probe.codexModel,
      reasoning: "high",
      surface: probe.codexSurface,
      status: probe.codexStatus,
      note: probe.codexNote,
    },
    {
      alias: "model.frontier_research",
      strategicTarget: "gpt-5.4",
      resolvedModel: probe.codexModel,
      reasoning: "xhigh",
      surface: probe.codexSurface,
      status: probe.codexStatus,
      note: probe.codexNote,
    },
    {
      alias: "model.frontier_build",
      strategicTarget: "gpt-5.4",
      resolvedModel: probe.codexModel,
      reasoning: "high",
      surface: probe.codexSurface,
      status: probe.codexStatus,
      note: probe.codexNote,
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
    officialFrontierModel: "gpt-5.4",
    officialCodexDocsStatus: "verified",
    openClawPrimary: "openai-codex/gpt-5.3-codex",
    openClawFallback: "openai-codex/gpt-5-codex",
    openClawProbeSource: "docs-only",
    openClawVerifiedCandidates: [],
    aliases: buildAliases({
      codexModel: "gpt-5.4",
      codexSurface: "provisional",
      codexStatus: "candidate",
      codexNote:
        "No live model-capabilities artifact was available, so GPT-5.4 remains the strategic Codex target under a provisional alias until a passive or active probe confirms the route on this host.",
      openClawPrimary: "openai-codex/gpt-5.3-codex",
      openClawSurface: "source-fallback",
      openClawStatus: "docs-only",
      openClawNote:
        "Public OpenClaw provider docs still center GPT-5.3-Codex examples, so the gateway stays on the strongest documented fallback until a live gateway probe proves a GPT-5.4-compatible provider string.",
    }),
    drift: [
      "OpenClaw is not installed on this host, so provider-model support is inferred from official docs instead of a live gateway probe.",
      "Official OpenAI Codex docs support GPT-5.4 as the current frontier starting point, but OpenClaw provider-model support still needs a live gateway probe before the gateway config is auto-promoted.",
    ],
  };
}

export async function probeModelCapabilities(probeMode: RuntimeProbeMode = "passive"): Promise<ModelCapabilityProbe> {
  await loadLocalRuntimeEnv();

  const codexCliInstalled = await commandExists("codex");
  const openclawInstalled = await commandExists("openclaw");
  const strategicTarget = process.env.REVENUE_OS_STRATEGIC_MODEL ?? "gpt-5.4";
  const drift: string[] = [];

  let codexModel = process.env.CODEX_MODEL_PRIMARY ?? strategicTarget;
  if (probeMode === "active" && codexCliInstalled) {
    const probed = await activeProbeCodexCli();
    if (probed) {
      codexModel = probed;
    } else {
      drift.push("Active Codex CLI model probe did not confirm a GPT-5.4 candidate; keeping GPT-5.4 as the strategic alias target until runtime blocks it explicitly.");
    }
  } else if (!codexCliInstalled) {
    drift.push("Codex CLI is not installed on this host; GPT-5.4 aliases are policy defaults rather than live CLI probe results.");
  }

  let openClawPrimary = process.env.OPENCLAW_MODEL_PRIMARY ?? "";
  let openClawSurface: ModelAliasState["surface"] = "env-override";
  let openClawStatus: ModelAliasState["status"] = "preferred";
  let openClawNote = "Resolved from OPENCLAW_MODEL_PRIMARY override.";
  let openClawProbeSource: ModelCapabilityProbe["openClawProbeSource"] = "env-override";
  let openClawVerifiedCandidates: string[] = [];

  if (!openClawPrimary) {
    if (openclawInstalled && probeMode === "active") {
      openClawVerifiedCandidates = await probeOpenClawLiveCandidates();
      const livePreferred = choosePreferredModel(openClawVerifiedCandidates);
      if (livePreferred) {
        openClawPrimary = livePreferred;
        openClawSurface = "openclaw";
        openClawStatus = livePreferred.includes("gpt-5.4") ? "preferred" : "fallback";
        openClawNote =
          openClawStatus === "preferred"
            ? "A live OpenClaw gateway probe confirmed a GPT-5.4-compatible provider string on this host."
            : "A live OpenClaw gateway probe confirmed the strongest currently available Codex provider string on this host.";
        openClawProbeSource = "live-gateway";
      }
    }

    if (!openClawPrimary && openclawInstalled) {
      const configured = await detectOpenClawPrimary();
      if (configured && OPENCLAW_CANDIDATES.includes(configured as (typeof OPENCLAW_CANDIDATES)[number])) {
        openClawPrimary = configured;
        openClawSurface = "openclaw";
        openClawStatus = configured.includes("gpt-5.4") ? "preferred" : "fallback";
        openClawNote =
          openClawStatus === "preferred"
            ? "Live OpenClaw config on this host already resolves to a GPT-5.4-compatible provider string."
            : "Live OpenClaw config resolves to the strongest verified provider string currently configured on this host.";
        openClawProbeSource = "config-read";
        openClawVerifiedCandidates = openClawVerifiedCandidates.length > 0 ? openClawVerifiedCandidates : [configured];
      }
    }

    if (!openClawPrimary) {
      openClawPrimary = "openai-codex/gpt-5.3-codex";
      openClawSurface = "source-fallback";
      openClawStatus = openclawInstalled ? "fallback" : "docs-only";
      openClawNote =
        "OpenClaw provider docs still publicly center GPT-5.3-Codex examples, so the gateway stays on the strongest documented fallback until runtime proves GPT-5.4 support.";
      openClawProbeSource = "docs-only";

      if (!openclawInstalled) {
        drift.push("OpenClaw is not installed on this host, so provider-model support is inferred from official docs instead of a live gateway probe.");
      } else if (probeMode === "active") {
        drift.push("OpenClaw is installed, but a live gateway probe did not confirm a GPT-5.4-compatible provider string on this host yet.");
      } else {
        drift.push("OpenClaw is installed, but only passive config-read evidence is available on this host; use an active gateway probe after auth to auto-promote provider models.");
      }
    }
  }

  const openClawFallback = process.env.OPENCLAW_MODEL_FALLBACK ?? "openai-codex/gpt-5-codex";

  return {
    detectedAt: new Date().toISOString(),
    probeMode,
    provisional: false,
    codexCliInstalled,
    openclawInstalled,
    strategicTarget,
    officialFrontierModel: "gpt-5.4",
    officialCodexDocsStatus: "verified",
    openClawPrimary,
    openClawFallback,
    openClawProbeSource,
    openClawVerifiedCandidates,
    aliases: buildAliases({
      codexModel,
      codexSurface: codexCliInstalled ? "codex-cli" : "provisional",
      codexStatus: codexCliInstalled ? "preferred" : "candidate",
      codexNote: codexCliInstalled
        ? "Codex CLI is available on this host, so GPT-5.4 remains the preferred route for substantive work in line with current official Codex guidance."
        : "Codex CLI is not installed on this host, so GPT-5.4 remains an official strategic target rather than a locally verified CLI route.",
      openClawPrimary,
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
- Official frontier model page: \`${probe.officialFrontierModel}\`
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
- Fallback provider model: \`${probe.openClawFallback}\`
- Probe source: ${probe.openClawProbeSource}
- Live verified provider candidates: ${probe.openClawVerifiedCandidates.length > 0 ? probe.openClawVerifiedCandidates.join(", ") : "none yet"}

## Drift

${probe.drift.length === 0 ? "- None." : probe.drift.map((item) => `- ${item}`).join("\n")}

## Policy rules

- Use GPT-5.4 for substantive work on Codex-facing surfaces by default.
- Treat official OpenAI frontier-model docs, official Codex docs, and live OpenClaw provider proof as separate truths.
- Keep OpenClaw on the strongest verified provider string and auto-flip back to a GPT-5.4-compatible provider identifier only after a live gateway probe confirms it.
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
