import { createHash } from "node:crypto";

import { DEFAULT_ANCHOR_VERIFICATIONS, OFFICIAL_SOURCES } from "../common/source-catalog.js";
import { renderTable } from "../common/markdown.js";
import { readJsonFile, resolveRepoPath, writeJsonFile, writeTextFile } from "../common/fs.js";
import type { AnchorVerification, SourceRecord } from "../common/types.js";

export interface SourceSnapshot {
  id: string;
  url: string;
  fetchedAt: string;
  ok: boolean;
  hash: string;
  httpStatus: number;
  title: string;
  excerpt: string;
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

export async function fetchSourceSnapshot(source: SourceRecord): Promise<SourceSnapshot> {
  try {
    const response = await fetch(source.url, {
      headers: {
        "user-agent": "revenue-os/0.1",
      },
    });
    const raw = await response.text();
    const text = stripHtml(raw);
    return {
      id: source.id,
      url: source.url,
      fetchedAt: new Date().toISOString(),
      ok: response.ok,
      hash: createHash("sha256").update(text).digest("hex"),
      httpStatus: response.status,
      title: extractTitle(raw),
      excerpt: text.slice(0, 400),
    };
  } catch (error) {
    return {
      id: source.id,
      url: source.url,
      fetchedAt: new Date().toISOString(),
      ok: false,
      hash: createHash("sha256").update(String(error)).digest("hex"),
      httpStatus: 0,
      title: "Fetch failed",
      excerpt: String(error),
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

Generated against official OpenAI, OpenClaw, and Wise sources on ${new Date().toISOString().slice(0, 10)}.

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
