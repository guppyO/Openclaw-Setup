import { readTextFile, resolveRepoPath } from "./fs.js";

function parseEnvFile(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    let value = rawValue;
    if (rawValue.startsWith("\"") && rawValue.endsWith("\"")) {
      try {
        value = JSON.parse(rawValue);
      } catch {
        value = rawValue.slice(1, -1);
      }
    } else if (rawValue.startsWith("'") && rawValue.endsWith("'")) {
      value = rawValue.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

let loaded = false;

export async function loadLocalRuntimeEnv(): Promise<void> {
  if (loaded) {
    return;
  }

  const candidatePaths = [
    resolveRepoPath(".secrets", "revenue-os.local.env"),
    resolveRepoPath(".secrets", "generated-service-credentials.env"),
    resolveRepoPath(".env.local"),
  ];

  for (const candidatePath of candidatePaths) {
    const contents = await readTextFile(candidatePath, "");
    if (!contents) {
      continue;
    }

    const values = parseEnvFile(contents);
    for (const [key, value] of Object.entries(values)) {
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }

  loaded = true;
}
