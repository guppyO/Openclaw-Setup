import path from "node:path";

import { renderTable } from "../common/markdown.js";
import { ensureDir, readTextFile, resolveRepoPath, writeJsonFile, writeTextFile } from "../common/fs.js";
import type { SecretBootstrapState, SecretInventoryEntry } from "../common/types.js";

const BOOTSTRAP_CREDENTIAL_FILES = ["credentials", "Credentials.txt"] as const;

interface ParsedSecretSection {
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
    default:
      return "runtime";
  }
}

function parseCredentialFile(raw: string): ParsedSecretSection[] {
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

async function detectCredentialSource(): Promise<string> {
  for (const candidate of BOOTSTRAP_CREDENTIAL_FILES) {
    const absolutePath = resolveRepoPath(candidate);
    const contents = await readTextFile(absolutePath, "");
    if (contents.trim()) {
      return absolutePath;
    }
  }

  throw new Error("No bootstrap credentials file found. Expected `credentials` or `Credentials.txt` in the repo root.");
}

function buildWarnings(sections: ParsedSecretSection[]): string[] {
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

async function writeImportedSecretFiles(sections: ParsedSecretSection[]): Promise<ImportedSecretFile[]> {
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
    const providerFilePath = resolveRepoPath(".secrets", "providers", `${provider}.env`);
    await ensureDir(path.dirname(providerFilePath));
    await writeTextFile(providerFilePath, renderEnvFile(envMap));
    importedFiles.push({
      provider,
      filePath: providerFilePath,
      keys: Object.keys(envMap).sort(),
    });

    for (const [key, value] of Object.entries(envMap)) {
      combinedEntries[key] = value;
    }
  }

  combinedEntries.REVENUE_OS_SECRET_BOOTSTRAP = "complete";
  combinedEntries.REVENUE_OS_SECRET_BOOTSTRAP_AT = new Date().toISOString();

  await writeTextFile(
    resolveRepoPath(".secrets", "revenue-os.local.env"),
    renderEnvFile(combinedEntries),
  );

  return importedFiles;
}

function buildInventory(
  sections: ParsedSecretSection[],
  importedFiles: ImportedSecretFile[],
  warnings: string[],
  sourceFile: string,
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
      storageRef: imported ? path.relative(resolveRepoPath(), imported.filePath).replace(/\\/g, "/") : ".secrets/",
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

export async function importBootstrapSecrets(): Promise<SecretBootstrapState> {
  const sourceFile = await detectCredentialSource();
  const raw = await readTextFile(sourceFile);
  const sections = parseCredentialFile(raw);

  if (sections.length === 0) {
    throw new Error(`Bootstrap credentials file ${path.basename(sourceFile)} did not contain any importable sections.`);
  }

  const warnings = buildWarnings(sections);
  const importedFiles = await writeImportedSecretFiles(sections);
  const inventory = buildInventory(sections, importedFiles, warnings, sourceFile);

  const state: SecretBootstrapState = {
    importedAt: new Date().toISOString(),
    sourceFile: path.basename(sourceFile),
    providers: sections.map((section) => section.provider),
    warnings,
    secretFileRefs: importedFiles.map((entry) => path.relative(resolveRepoPath(), entry.filePath).replace(/\\/g, "/")),
    inventory,
  };

  await writeJsonFile(resolveRepoPath("data", "exports", "secret-inventory.json"), state);
  await writeTextFile(resolveRepoPath("docs", "secret-inventory.md"), buildSecretInventoryMarkdown(state));

  return state;
}
