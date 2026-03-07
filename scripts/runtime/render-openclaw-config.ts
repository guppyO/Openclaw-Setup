import { chmod } from "node:fs/promises";
import path from "node:path";

import { loadLocalRuntimeEnv } from "../../services/common/env-loader.js";
import { ensureDir, readJsonFile, resolveRepoPath, writeJsonFile } from "../../services/common/fs.js";

const GATEWAY_TOKEN_PLACEHOLDER = "__OPENCLAW_GATEWAY_TOKEN__";
const HOOK_TOKEN_PLACEHOLDER = "__OPENCLAW_HOOK_TOKEN__";

function parseEnvironmentArg(): "lab" | "stage" | "prod" {
  const envFlagIndex = process.argv.findIndex((value) => value === "--environment" || value === "--env");
  const raw =
    (envFlagIndex >= 0 ? process.argv[envFlagIndex + 1] : undefined) ??
    process.argv[2] ??
    process.env.REVENUE_OS_ENVIRONMENT ??
    "stage";
  if (raw === "lab" || raw === "stage" || raw === "prod") {
    return raw;
  }
  throw new Error(`Unsupported environment: ${raw}`);
}

function parseOutputArg(environment: "lab" | "stage" | "prod"): string {
  const outputFlagIndex = process.argv.findIndex((value) => value === "--output");
  if (outputFlagIndex >= 0 && process.argv[outputFlagIndex + 1]) {
    return path.resolve(process.argv[outputFlagIndex + 1]!);
  }
  return resolveRepoPath("data", "generated", "openclaw", `${environment}.json`);
}

function replaceSecretPlaceholders(value: unknown, replacements: Record<string, string>): unknown {
  if (typeof value === "string") {
    return replacements[value] ?? value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => replaceSecretPlaceholders(entry, replacements));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, replaceSecretPlaceholders(entry, replacements)]),
    );
  }

  return value;
}

function applyAttachedChromeProfile(config: Record<string, unknown>): void {
  const browser = config.browser;
  if (!browser || typeof browser !== "object" || Array.isArray(browser)) {
    return;
  }

  const cdpUrl =
    process.env.OPENCLAW_CHROME_PROFILE_CDP_URL ??
    process.env.OPENCLAW_ATTACHED_CHROME_CDP_URL ??
    process.env.OPENCLAW_BROWSER_CHROME_CDP_URL ??
    "";
  const cdpPortRaw = process.env.OPENCLAW_CHROME_PROFILE_CDP_PORT ?? process.env.OPENCLAW_ATTACHED_CHROME_CDP_PORT;
  const explicitCdpPort = cdpPortRaw ? Number.parseInt(cdpPortRaw, 10) : undefined;
  const gatewayPortRaw = process.env.OPENCLAW_GATEWAY_PORT;
  const gatewayPort = gatewayPortRaw ? Number.parseInt(gatewayPortRaw, 10) : undefined;
  const relayReady =
    process.env.OPENCLAW_NODE_HOST_STATUS === "ready" ||
    process.env.OPENCLAW_CHROME_RELAY_STATUS === "paired";
  const inferredCdpPort =
    explicitCdpPort ??
    (relayReady && gatewayPort && Number.isFinite(gatewayPort) ? gatewayPort + 3 : undefined);
  const cdpPort = inferredCdpPort && Number.isFinite(inferredCdpPort) ? inferredCdpPort : undefined;
  const browserRecord = browser as Record<string, unknown>;

  if (!cdpUrl && !cdpPort) {
    delete browserRecord.profiles;
    return;
  }

  browserRecord.profiles = {
    chrome: {
      driver: "extension",
      color: "#F59E0B",
      ...(cdpUrl ? { cdpUrl } : {}),
      ...(cdpPort ? { cdpPort } : {}),
    },
  };
}

export async function renderOpenClawConfig(environment: "lab" | "stage" | "prod", outputPath?: string): Promise<string> {
  await loadLocalRuntimeEnv();

  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;
  const hookToken = process.env.OPENCLAW_HOOK_TOKEN;
  if (!gatewayToken) {
    throw new Error("OPENCLAW_GATEWAY_TOKEN is required before rendering the runtime OpenClaw config.");
  }
  if (!hookToken) {
    throw new Error("OPENCLAW_HOOK_TOKEN is required before rendering the runtime OpenClaw config.");
  }

  const templatePath = resolveRepoPath("openclaw", environment, "openclaw.json");
  const outputFile = outputPath ?? resolveRepoPath("data", "generated", "openclaw", `${environment}.json`);
  const template = await readJsonFile<Record<string, unknown>>(templatePath, {});
  const rendered = replaceSecretPlaceholders(template, {
    [GATEWAY_TOKEN_PLACEHOLDER]: gatewayToken,
    [HOOK_TOKEN_PLACEHOLDER]: hookToken,
  }) as Record<string, unknown>;

  applyAttachedChromeProfile(rendered);
  await ensureDir(path.dirname(outputFile));
  await writeJsonFile(outputFile, rendered);
  if (process.platform !== "win32") {
    await chmod(outputFile, 0o600);
  }
  return outputFile;
}

async function main(): Promise<void> {
  const environment = parseEnvironmentArg();
  const outputFile = parseOutputArg(environment);
  const renderedPath = await renderOpenClawConfig(environment, outputFile);
  console.log(`Rendered OpenClaw config for ${environment} to ${renderedPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
