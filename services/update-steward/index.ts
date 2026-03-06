import { createHash } from "node:crypto";
import { exec } from "node:child_process";
import { promisify } from "node:util";

import { DEFAULT_ANCHOR_VERIFICATIONS, OFFICIAL_SOURCES } from "../common/source-catalog.js";
import { renderTable } from "../common/markdown.js";
import { readJsonFile, resolveRepoPath, writeJsonFile, writeTextFile } from "../common/fs.js";
import type { AnchorVerification, SourceRecord } from "../common/types.js";

const execAsync = promisify(exec);

export interface SourceSnapshot {
  id: string;
  url: string;
  fetchedAt: string;
  ok: boolean;
  hash: string;
  httpStatus: number;
  title: string;
  excerpt: string;
  method: "direct-fetch" | "browser-capture" | "search-backed" | "manual-unverified";
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(rawHtml: string): string {
  const titleMatch = rawHtml.match(/<title>(.*?)<\/title>/i);
  if (titleMatch?.[1]) {
    return stripHtml(titleMatch[1]);
  }
  return "Untitled";
}

function snapshotFromText(
  source: SourceRecord,
  raw: string,
  status: number,
  ok: boolean,
  method: SourceSnapshot["method"],
): SourceSnapshot {
  const text = stripHtml(raw);
  return {
    id: source.id,
    url: source.url,
    fetchedAt: new Date().toISOString(),
    ok,
    hash: createHash("sha256").update(text).digest("hex"),
    httpStatus: status,
    title: extractTitle(raw),
    excerpt: text.slice(0, 400),
    method,
  };
}

async function runFallbackCommand(commandTemplate: string | undefined, source: SourceRecord): Promise<string | null> {
  if (!commandTemplate) {
    return null;
  }

  try {
    const command = commandTemplate.replace(/\{url\}/g, source.url);
    const { stdout } = await execAsync(command, { timeout: 120_000 });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function fetchSourceSnapshot(
  source: SourceRecord,
  options: {
    fetchImpl?: typeof fetch;
    browserCapture?: (source: SourceRecord) => Promise<string | null>;
    searchCapture?: (source: SourceRecord) => Promise<string | null>;
  } = {},
): Promise<SourceSnapshot> {
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(source.url, {
      headers: {
        "user-agent": "revenue-os/0.1",
      },
    });
    const raw = await response.text();
    if (response.ok) {
      return snapshotFromText(source, raw, response.status, true, "direct-fetch");
    }

    const browserCapture =
      (await options.browserCapture?.(source)) ??
      (await runFallbackCommand(process.env.REVENUE_OS_BROWSER_CAPTURE_CMD, source));
    if (browserCapture) {
      return snapshotFromText(source, browserCapture, response.status, true, "browser-capture");
    }

    const searchCapture =
      (await options.searchCapture?.(source)) ??
      (await runFallbackCommand(process.env.REVENUE_OS_SEARCH_FALLBACK_CMD, source));
    if (searchCapture) {
      return snapshotFromText(source, searchCapture, response.status, true, "search-backed");
    }

    return snapshotFromText(source, raw || `HTTP ${response.status}`, response.status, false, "manual-unverified");
  } catch (error) {
    const browserCapture =
      (await options.browserCapture?.(source)) ??
      (await runFallbackCommand(process.env.REVENUE_OS_BROWSER_CAPTURE_CMD, source));
    if (browserCapture) {
      return snapshotFromText(source, browserCapture, 0, true, "browser-capture");
    }

    const searchCapture =
      (await options.searchCapture?.(source)) ??
      (await runFallbackCommand(process.env.REVENUE_OS_SEARCH_FALLBACK_CMD, source));
    if (searchCapture) {
      return snapshotFromText(source, searchCapture, 0, true, "search-backed");
    }

    return {
      id: source.id,
      url: source.url,
      fetchedAt: new Date().toISOString(),
      ok: false,
      hash: createHash("sha256").update(String(error)).digest("hex"),
      httpStatus: 0,
      title: "Fetch failed",
      excerpt: String(error),
      method: "manual-unverified",
    };
  }
}

export async function refreshOfficialSources(): Promise<{
  snapshots: SourceSnapshot[];
  changedSources: SourceSnapshot[];
}> {
  const previous = await readJsonFile<Record<string, SourceSnapshot>>(
    resolveRepoPath("data", "exports", "source-snapshots.json"),
    {},
  );
  const snapshots = await Promise.all(OFFICIAL_SOURCES.map((source) => fetchSourceSnapshot(source)));
  const current: Record<string, SourceSnapshot> = {};
  const changedSources: SourceSnapshot[] = [];

  for (const snapshot of snapshots) {
    current[snapshot.id] = snapshot;
    if (previous[snapshot.id]?.hash !== snapshot.hash) {
      changedSources.push(snapshot);
    }
  }

  await writeJsonFile(resolveRepoPath("data", "exports", "source-snapshots.json"), current);
  return { snapshots, changedSources };
}

export function buildRuntimeVerificationMarkdown(anchors: AnchorVerification[] = DEFAULT_ANCHOR_VERIFICATIONS): string {
  return `# Runtime Verification

Generated against official OpenAI, OpenClaw, Wise, and Steel sources on ${new Date().toISOString().slice(0, 10)}.

## Summary

- Verified anchors: ${anchors.filter((anchor) => anchor.status === "verified").length}
- Drifted anchors: ${anchors.filter((anchor) => anchor.status === "drifted").length}
- Unsupported anchors: ${anchors.filter((anchor) => anchor.status === "unsupported").length}

## Anchor status

${renderTable(
  ["Anchor", "Status", "Notes"],
  anchors.map((anchor) => [anchor.id, anchor.status, anchor.note]),
)}

## Build implications

- Prefer GPT-5.4 for strategic reasoning surfaces that officially expose it.
- Keep Codex/OpenClaw model identifiers configurable because the current OpenClaw docs still center GPT-5-Codex and GPT-5.3-Codex.
- Treat Codex usage ceilings as moving operational constraints and batch context aggressively.
- Use QMD or another local-first memory backend because Codex OAuth does not cover embeddings.
- Probe Wise capabilities before automating any treasury action beyond read-only ingest.
- Keep Steel routing configurable because session pool, credentials, and self-hosting posture can change independently of OpenClaw.
- Some OpenAI help and blog pages currently return a bot-wall 403 to plain HTTP fetches; keep browser-backed or search-backed verification available for those sources.
`;
}

export function buildSourceAnchorsMarkdown(): string {
  return `# Source Anchors

Official pages used to verify runtime assumptions.

${renderTable(
  ["Id", "Domain", "Source", "Purpose"],
  OFFICIAL_SOURCES.map((source) => [
    source.id,
    source.domain,
    `[${source.label}](${source.url})`,
    source.purpose,
  ]),
)}
`;
}

export async function writeRuntimeDocs(): Promise<void> {
  await writeTextFile(resolveRepoPath("docs", "runtime-verification.md"), buildRuntimeVerificationMarkdown());
  await writeTextFile(resolveRepoPath("docs", "source-anchors.md"), buildSourceAnchorsMarkdown());
  await writeJsonFile(resolveRepoPath("data", "exports", "runtime-verification.json"), DEFAULT_ANCHOR_VERIFICATIONS);
}
