import { exec, execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { fileExists, resolveRepoPath, writeTextFile } from "../../services/common/fs.js";
import { renderOpenClawConfig } from "../runtime/render-openclaw-config.js";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

function parseEnvironmentArg(): "lab" | "stage" | "prod" {
  const raw = process.argv[2] ?? process.env.REVENUE_OS_ENVIRONMENT ?? "stage";
  if (raw === "lab" || raw === "stage" || raw === "prod") {
    return raw;
  }
  throw new Error(`Unsupported environment: ${raw}`);
}

async function resolveOpenClawExecutable(): Promise<string> {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA;
    if (appData) {
      const cmdPath = path.join(appData, "npm", "openclaw.cmd");
      if (await fileExists(cmdPath)) {
        return cmdPath;
      }
      const ps1Path = path.join(appData, "npm", "openclaw.ps1");
      if (await fileExists(ps1Path)) {
        return ps1Path;
      }
    }
  }

  return "openclaw";
}

async function main(): Promise<void> {
  const environment = parseEnvironmentArg();
  const renderedPath = await renderOpenClawConfig(environment);
  const artifactPath = resolveRepoPath("data", "exports", `openclaw-config-validate-${environment}.json`);
  const openclawExecutable = await resolveOpenClawExecutable();

  const commandEnv = {
    ...process.env,
    OPENCLAW_CONFIG_PATH: renderedPath,
  };
  const stdout =
    process.platform === "win32"
      ? (
          await execAsync(`"${openclawExecutable}" config validate --json`, {
            env: commandEnv,
            timeout: 120_000,
            maxBuffer: 4 * 1024 * 1024,
          })
        ).stdout
      : (
          await execFileAsync(openclawExecutable, ["config", "validate", "--json"], {
            env: commandEnv,
            timeout: 120_000,
            maxBuffer: 4 * 1024 * 1024,
          })
        ).stdout;

  await writeTextFile(artifactPath, stdout);
  const payload = JSON.parse(stdout) as { valid?: boolean; issues?: unknown[]; path?: string };
  if (!payload.valid) {
    throw new Error(
      `OpenClaw config validation failed for ${environment}. Rendered path: ${renderedPath}. Issues: ${JSON.stringify(payload.issues ?? [])}`,
    );
  }

  console.log(`OpenClaw config validation passed for ${environment} using ${payload.path ?? renderedPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
