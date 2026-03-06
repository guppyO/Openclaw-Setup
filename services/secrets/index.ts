import { createHash, randomBytes } from "node:crypto";
import { chmod, writeFile } from "node:fs/promises";
import path from "node:path";

import { renderTable } from "../common/markdown.js";
import { ensureDir, readJsonFile, readTextFile, resolveRepoPath, writeJsonFile, writeTextFile } from "../common/fs.js";
import type { SecretBootstrapState, SecretInventoryEntry } from "../common/types.js";

const BOOTSTRAP_CREDENTIAL_FILES = ["credentials", "Credentials.txt"] as const;

function fromRoot(rootDir: string, ...segments: string[]): string {
  return path.resolve(rootDir, ...segments);
}

export interface ParsedSecretSection {
  provider: string;
  heading: string;
  values: Record<string, string>;
}

interface ImportedSecretFile {
  provider: string;
  filePath: string;
  keys: string[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeKey(rawKey: string): string {
  return rawKey
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function detectProvider(heading: string): string {
  const normalized = heading.toLowerCase();
  if (normalized.includes("wise")) {
    return "wise";
  }
  if (normalized.includes("hetzner")) {
    return "hetzner";
  }
  if (normalized.includes("gmail") || normalized.includes("google")) {
    return "gmail";
  }
  if (normalized.includes("steel")) {
    return "steel";
  }
  if (normalized.includes("codex") || normalized.includes("chatgpt") || normalized.includes("openai")) {
    return "openai";
  }
  if (normalized.includes("openclaw")) {
    return "openclaw";
  }
  return slugify(heading);
}

function toEnvKey(provider: string, key: string): string {
  const normalizedProvider = provider.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  const normalizedKey = normalizeKey(key).toUpperCase();

  const overrides: Record<string, string> = {
    WISE_EMAIL: "WISE_EMAIL",
    WISE_PASSWORD: "WISE_PASSWORD",
    WISE_PASSKEY: "WISE_PASSKEY",
    HETZNER_EMAIL: "HETZNER_EMAIL",
    HETZNER_CLIENT_LOGIN: "HETZNER_LOGIN_ID",
    HETZNER_LOGIN: "HETZNER_LOGIN_ID",
    HETZNER_CLIENT: "HETZNER_LOGIN_ID",
    HETZNER_PASSWORD: "HETZNER_PASSWORD",
    GMAIL_EMAIL: "COMPANY_GMAIL_EMAIL",
    GMAIL_PASSWORD: "COMPANY_GMAIL_PASSWORD",
    STEEL_API_KEY: "STEEL_API_KEY",
    STEEL_BASE_URL: "STEEL_BASE_URL",
    OPENAI_EMAIL: "OPENAI_ACCOUNT_EMAIL",
    OPENAI_PASSWORD: "OPENAI_ACCOUNT_PASSWORD",
    OPENCLAW_EMAIL: "OPENCLAW_ACCOUNT_EMAIL",
    OPENCLAW_PASSWORD: "OPENCLAW_ACCOUNT_PASSWORD",
  };

  const overrideKey = `${normalizedProvider}_${normalizedKey}`;
  return overrides[overrideKey] ?? `${normalizedProvider}_${normalizedKey}`;
}

function renderEnvFile(entries: Record<string, string>): string {
  const lines = Object.entries(entries)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`);

  return `${lines.join("\n")}\n`;
}

function inventoryPurpose(provider: string): string {
  switch (provider) {
    case "gmail":
      return "Primary company mailbox and signup identity";
    case "wise":
      return "Treasury source account and money movement control";
    case "hetzner":
      return "Primary infrastructure provider for VPS control plane";
    case "steel":
      return "Steel browser session pool and namespace broker";
    case "openai":
      return "OpenAI or Codex account-level bootstrap credentials";
    case "openclaw":
      return "OpenClaw account or runtime bootstrap credentials";
    default:
      return "Runtime secret imported from bootstrap credentials";
  }
}

function inventoryScope(provider: string): string {
  switch (provider) {
    case "gmail":
      return "company-identity";
    case "wise":
      return "treasury";
    case "hetzner":
      return "infrastructure";
    case "steel":
      return "browser-fabric";
    case "openai":
      return "model-runtime";
    case "openclaw":
      return "control-plane";
    default:
      return "runtime";
  }
}

export function parseCredentialFile(raw: string): ParsedSecretSection[] {
  const sections: ParsedSecretSection[] = [];
  let current: ParsedSecretSection | null = null;

  for (const sourceLine of raw.split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line) {
      current = null;
      continue;
    }

    const pairMatch = line.match(/^([^:=\-"]{1,80}?)\s*[-:=]\s*"?(.*?)"?$/);
    if (!pairMatch) {
      current = {
        provider: detectProvider(line),
        heading: line,
        values: {},
      };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = {
        provider: "misc",
        heading: "Misc",
        values: {},
      };
      sections.push(current);
    }

    const rawKey = pairMatch[1]!.trim();
    const rawValue = pairMatch[2]!.trim();
    const cleanedValue = rawValue.replace(/^"|"$/g, "").trim();

    current.values[rawKey] = cleanedValue;
  }

  return sections.filter((section) => Object.keys(section.values).length > 0);
}

async function detectCredentialSource(rootDir: string): Promise<string> {
  for (const candidate of BOOTSTRAP_CREDENTIAL_FILES) {
    const absolutePath = fromRoot(rootDir, candidate);
    const contents = await readTextFile(absolutePath, "");
    if (contents.trim()) {
      return absolutePath;
    }
  }

  throw new Error("No bootstrap credentials file found. Expected `credentials` or `Credentials.txt` in the repo root.");
}

export function buildWarnings(sections: ParsedSecretSection[]): string[] {
  const warnings: string[] = [];
  const passwordToProviders = new Map<string, Set<string>>();

  for (const section of sections) {
    for (const [key, value] of Object.entries(section.values)) {
      const normalizedKey = normalizeKey(key);
      if (!normalizedKey.includes("password")) {
        continue;
      }

      const providers = passwordToProviders.get(value) ?? new Set<string>();
      providers.add(section.provider);
      passwordToProviders.set(value, providers);
    }
  }

  for (const providers of passwordToProviders.values()) {
    if (providers.size > 1) {
      warnings.push(
        `Shared password detected across providers: ${Array.from(providers).sort().join(", ")}. Rotate to unique service passwords.`,
      );
    }
  }

  return warnings;
}

function detectSharedPasswordProviders(sections: ParsedSecretSection[]): Set<string> {
  const passwordToProviders = new Map<string, Set<string>>();

  for (const section of sections) {
    for (const [key, value] of Object.entries(section.values)) {
      if (!normalizeKey(key).includes("password")) {
        continue;
      }

      const providers = passwordToProviders.get(value) ?? new Set<string>();
      providers.add(section.provider);
      passwordToProviders.set(value, providers);
    }
  }

  const sharedProviders = new Set<string>();
  for (const providers of passwordToProviders.values()) {
    if (providers.size <= 1) {
      continue;
    }

    for (const provider of providers) {
      sharedProviders.add(provider);
    }
  }

  return sharedProviders;
}

async function writeImportedSecretFiles(
  sections: ParsedSecretSection[],
  rootDir: string,
): Promise<ImportedSecretFile[]> {
  const providerEnvMaps = new Map<string, Record<string, string>>();

  for (const section of sections) {
    const envMap = providerEnvMaps.get(section.provider) ?? {};
    for (const [key, value] of Object.entries(section.values)) {
      envMap[toEnvKey(section.provider, key)] = value;
    }
    providerEnvMaps.set(section.provider, envMap);
  }

  const importedFiles: ImportedSecretFile[] = [];
  const combinedEntries: Record<string, string> = {};

  for (const [provider, envMap] of providerEnvMaps.entries()) {
    const providerFilePath = fromRoot(rootDir, ".secrets", "providers", `${provider}.env`);
    await ensureDir(path.dirname(providerFilePath));
    await writeSecretFile(providerFilePath, renderEnvFile(envMap));
    importedFiles.push({
      provider,
      filePath: providerFilePath,
      keys: Object.keys(envMap).sort(),
    });

    for (const [key, value] of Object.entries(envMap)) {
      combinedEntries[key] = value;
    }
  }

  if (!combinedEntries.OPENCLAW_GATEWAY_TOKEN) {
    combinedEntries.OPENCLAW_GATEWAY_TOKEN = randomBytes(24).toString("hex");
  }
  if (!combinedEntries.OPENCLAW_HOOK_TOKEN) {
    combinedEntries.OPENCLAW_HOOK_TOKEN = randomBytes(24).toString("hex");
  }
  combinedEntries.REVENUE_OS_SECRET_BOOTSTRAP = "complete";
  await writeSecretFile(
    fromRoot(rootDir, ".secrets", "revenue-os.local.env"),
    renderEnvFile(combinedEntries),
  );

  return importedFiles;
}

function buildInventory(
  sections: ParsedSecretSection[],
  importedFiles: ImportedSecretFile[],
  warnings: string[],
  sourceFile: string,
  rootDir: string,
): SecretInventoryEntry[] {
  const importedFileMap = new Map(importedFiles.map((entry) => [entry.provider, entry]));
  const sharedPasswordProviders = detectSharedPasswordProviders(sections);

  return sections.map((section) => {
    const imported = importedFileMap.get(section.provider);
    const notes = [`Imported from bootstrap file heading \`${section.heading}\`.`];

    if (sharedPasswordProviders.has(section.provider)) {
      notes.push("Rotation required because the current password is reused across root accounts.");
    }

    if (section.provider === "wise") {
      notes.push("Treat personal-token and browser lanes separately during treasury automation.");
    }
    if (section.provider === "hetzner") {
      notes.push("Use unique SSH or console credentials for runtime hosts instead of reusing account login secrets.");
    }

    return {
      id: `secret-${section.provider}`,
      provider: section.provider,
      purpose: inventoryPurpose(section.provider),
      scope: inventoryScope(section.provider),
      lastVerified: new Date().toISOString(),
      rotationNeeded: sharedPasswordProviders.has(section.provider),
      storageRef: imported ? path.relative(rootDir, imported.filePath).replace(/\\/g, "/") : ".secrets/",
      importSource: path.basename(sourceFile),
      secretKeys: imported?.keys ?? Object.keys(section.values).map((key) => toEnvKey(section.provider, key)),
      notes,
    };
  });
}

export function buildSecretInventoryMarkdown(state: SecretBootstrapState): string {
  return `# Secret Inventory

Bootstrap metadata only. Raw secret values are intentionally excluded.

## Import summary

- Imported at: ${state.importedAt}
- Source file: ${state.sourceFile}
- Source hash: ${state.sourceHash}
- Providers: ${state.providers.join(", ")}
- Secret files: ${state.secretFileRefs.join(", ")}

## Inventory

${renderTable(
  ["Provider", "Purpose", "Scope", "Rotation needed", "Storage ref"],
  state.inventory.map((entry) => [
    entry.provider,
    entry.purpose,
    entry.scope,
    entry.rotationNeeded ? "yes" : "no",
    entry.storageRef,
  ]),
)}

## Warnings

${state.warnings.length === 0 ? "- None." : state.warnings.map((warning) => `- ${warning}`).join("\n")}

## Handling rules

- Do not commit bootstrap secret files or generated env files.
- Use the company Gmail identity for new accounts where appropriate, but generate unique per-service passwords.
- Treat Hetzner, Wise, and Gmail as root operational accounts with explicit rotation review.
`;
}

function hashSecretSource(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

async function writeSecretFile(filePath: string, contents: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, contents, { encoding: "utf8", mode: 0o600 });

  if (process.platform !== "win32") {
    await chmod(filePath, 0o600);
  }
}

export async function importBootstrapSecretsFromText(
  raw: string,
  sourceFile = "credentials",
  rootDir = resolveRepoPath(),
): Promise<SecretBootstrapState> {
  const sections = parseCredentialFile(raw);

  if (sections.length === 0) {
    throw new Error(`Bootstrap credentials file ${path.basename(sourceFile)} did not contain any importable sections.`);
  }

  const warnings = buildWarnings(sections);
  const importedFiles = await writeImportedSecretFiles(sections, rootDir);
  const inventory = [
    ...buildInventory(sections, importedFiles, warnings, sourceFile, rootDir),
    {
      id: "secret-openclaw-runtime",
      provider: "openclaw-runtime",
      purpose: "Gateway token and hook token for attached Chrome relay and immediate wake hooks",
      scope: "control-plane",
      lastVerified: new Date().toISOString(),
      rotationNeeded: false,
      storageRef: ".secrets/revenue-os.local.env",
      importSource: "generated-during-bootstrap",
      secretKeys: ["OPENCLAW_GATEWAY_TOKEN", "OPENCLAW_HOOK_TOKEN"],
      notes: [
        "Generated locally if missing during secret bootstrap.",
        "Required for the OpenClaw gateway auth path and wake-now hook flow.",
      ],
    },
  ];
  const sourceHash = hashSecretSource(raw);
  const previousState = await readJsonFile<SecretBootstrapState | null>(
    fromRoot(rootDir, "data", "exports", "secret-inventory.json"),
    null,
  );
  const importedAt =
    previousState?.sourceHash === sourceHash
      ? previousState.importedAt
      : new Date().toISOString();

  const state: SecretBootstrapState = {
    importedAt,
    sourceFile: path.basename(sourceFile),
    sourceHash,
    providers: sections.map((section) => section.provider),
    warnings,
    secretFileRefs: importedFiles.map((entry) => path.relative(rootDir, entry.filePath).replace(/\\/g, "/")),
    inventory,
  };

  await writeJsonFile(fromRoot(rootDir, "data", "exports", "secret-inventory.json"), state);
  await writeTextFile(fromRoot(rootDir, "docs", "secret-inventory.md"), buildSecretInventoryMarkdown(state));

  return state;
}

export async function importBootstrapSecrets(rootDir = resolveRepoPath()): Promise<SecretBootstrapState> {
  const sourceFile = await detectCredentialSource(rootDir);
  const raw = await readTextFile(sourceFile);
  return importBootstrapSecretsFromText(raw, sourceFile, rootDir);
}
