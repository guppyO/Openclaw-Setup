import { exec, execFile } from "node:child_process";
import { promisify } from "node:util";

import { renderTable } from "../common/markdown.js";
import { readJsonFile, resolveRepoPath, writeJsonFile, writeTextFile } from "../common/fs.js";
import { loadLocalRuntimeEnv } from "../common/env-loader.js";
import type { ModelAliasState, ModelCapabilityProbe, RuntimeProbeMode } from "../common/types.js";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

const CODEX_CANDIDATES = ["gpt-5.4", "gpt-5.4-codex", "gpt-5.3-codex"] as const;
const OPENCLAW_CANDIDATES = [
  "openai-codex/gpt-5.4-codex",
  "openai-codex/gpt-5.4",
  "openai-codex/gpt-5.3-codex",
  "openai-codex/gpt-5-codex",
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

function buildAliases(probe: {
  codexModel: string;
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
      surface: "codex-cli",
      status: "preferred",
      note: "Default strategic alias for research, coding, and operating decisions.",
    },
    {
      alias: "model.frontier_browser",
      strategicTarget: "gpt-5.4",
      resolvedModel: probe.codexModel,
      reasoning: "high",
      surface: "codex-cli",
      status: "preferred",
      note: "Browser-heavy work should stay on GPT-5.4 unless the runtime blocks it.",
    },
    {
      alias: "model.frontier_research",
      strategicTarget: "gpt-5.4",
      resolvedModel: probe.codexModel,
      reasoning: "xhigh",
      surface: "codex-cli",
      status: "preferred",
      note: "Use the highest-reasoning GPT-5.4 route for multi-source synthesis and policy-sensitive research.",
    },
    {
      alias: "model.frontier_build",
      strategicTarget: "gpt-5.4",
      resolvedModel: probe.codexModel,
      reasoning: "high",
      surface: "codex-cli",
      status: "preferred",
      note: "Builder defaults remain GPT-5.4-first to preserve coding quality.",
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
    codexCliInstalled: true,
    openclawInstalled: false,
    strategicTarget: "gpt-5.4",
    openClawPrimary: "openai-codex/gpt-5.3-codex",
    openClawFallback: "openai-codex/gpt-5-codex",
    aliases: buildAliases({
      codexModel: "gpt-5.4",
      openClawPrimary: "openai-codex/gpt-5.3-codex",
      openClawSurface: "source-fallback",
      openClawStatus: "docs-only",
      openClawNote: "Public OpenClaw provider docs still center GPT-5.3-Codex, so the gateway stays on the strongest verified provider string until runtime proves GPT-5.4 support.",
    }),
    drift: [
      "OpenClaw is not installed on this host, so provider-model support is inferred from official docs instead of a live gateway probe.",
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
      drift.push("Active Codex CLI model probe did not confirm a GPT-5.4 candidate; keeping the strategic alias target as GPT-5.4 until runtime blocks it explicitly.");
    }
  } else if (!codexCliInstalled) {
    drift.push("Codex CLI is not installed on this host; GPT-5.4 aliases are policy defaults rather than live CLI probe results.");
  }

  let openClawPrimary = process.env.OPENCLAW_MODEL_PRIMARY ?? "";
  let openClawSurface: ModelAliasState["surface"] = "env-override";
  let openClawStatus: ModelAliasState["status"] = "preferred";
  let openClawNote = "Resolved from OPENCLAW_MODEL_PRIMARY override.";

  if (!openClawPrimary) {
    if (openclawInstalled) {
      const configured = await detectOpenClawPrimary();
      if (configured && OPENCLAW_CANDIDATES.includes(configured as (typeof OPENCLAW_CANDIDATES)[number])) {
        openClawPrimary = configured;
        openClawSurface = "openclaw";
        openClawStatus = configured.includes("gpt-5.4") ? "preferred" : "fallback";
        openClawNote =
          openClawStatus === "preferred"
            ? "Live OpenClaw config on this host already resolves to a GPT-5.4-compatible provider string."
            : "Live OpenClaw config resolves to the strongest verified Codex provider string on this host.";
      }
    }

    if (!openClawPrimary) {
      openClawPrimary = "openai-codex/gpt-5.3-codex";
      openClawSurface = "source-fallback";
      openClawStatus = openclawInstalled ? "fallback" : "docs-only";
      openClawNote =
        "OpenClaw provider docs still publicly center GPT-5.3-Codex, so the gateway stays on the strongest documented fallback until runtime proves GPT-5.4 support.";

      if (!openclawInstalled) {
        drift.push("OpenClaw is not installed on this host, so provider-model support is inferred from official docs instead of a live gateway probe.");
      } else {
        drift.push("OpenClaw is installed but the current host did not prove a GPT-5.4 provider string; using the strongest documented fallback.");
      }
    }
  }

  const openClawFallback = process.env.OPENCLAW_MODEL_FALLBACK ?? "openai-codex/gpt-5-codex";

  return {
    detectedAt: new Date().toISOString(),
    probeMode,
    codexCliInstalled,
    openclawInstalled,
    strategicTarget,
    openClawPrimary,
    openClawFallback,
    aliases: buildAliases({
      codexModel,
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

## Drift

${probe.drift.length === 0 ? "- None." : probe.drift.map((item) => `- ${item}`).join("\n")}

## Policy rules

- Use GPT-5.4 for substantive work on Codex-facing surfaces by default.
- Keep OpenClaw on the strongest verified provider string and auto-flip back to GPT-5.4-compatible provider identifiers when runtime and official sources both support them.
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
  return readJsonFile<ModelCapabilityProbe>(
    resolveRepoPath("data", "exports", "model-capabilities.json"),
    buildDefaultModelProbe(),
  );
}
