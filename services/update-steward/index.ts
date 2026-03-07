import { createHash } from "node:crypto";
import { exec } from "node:child_process";
import { promisify } from "node:util";

import { DEFAULT_ANCHOR_VERIFICATIONS, OFFICIAL_SOURCES } from "../common/source-catalog.js";
import { renderTable } from "../common/markdown.js";
import {
  fileExists,
  readJsonFile,
  readTextFile,
  resolveRepoPath,
  writeJsonFile,
  writeTextFile,
} from "../common/fs.js";
import type { AnchorStatus, AnchorVerification, BrowserTaskRequest, SourceRecord } from "../common/types.js";
import { buildBrowserBrokerState, routeBrowserTask } from "../browser-broker/index.js";

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
  method: "direct-fetch" | "browser-capture" | "ua-fetch-fallback" | "search-backed" | "manual-unverified";
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
    excerpt: text.slice(0, 20_000),
    method,
  };
}

function buildSourceBrowserTask(source: SourceRecord): BrowserTaskRequest {
  const antiBotSensitivity =
    source.domain === "openai" && /help\.openai|openai\.com\/index\//.test(source.url) ? 9 : 5;

  return {
    id: `source-${source.id}`,
    title: `Capture official source ${source.label}`,
    initiativeId: "runtime-verification",
    authLevel: "public",
    antiBotSensitivity,
    parallelism: 1,
    operatorVisible: false,
    requiresPersistentSession: false,
  };
}

async function readCapturedSourceArtifact(source: SourceRecord): Promise<string | null> {
  const candidates = [
    resolveRepoPath("data", "exports", "source-captures", `${source.id}.html`),
    resolveRepoPath("data", "captures", "sources", `${source.id}.html`),
  ];

  for (const candidate of candidates) {
    if (!(await fileExists(candidate))) {
      continue;
    }

    const contents = await readTextFile(candidate, "");
    if (contents.trim()) {
      return contents;
    }
  }

  return null;
}

async function uaFetchFallback(source: SourceRecord): Promise<string | null> {
  try {
    const response = await fetch(source.url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "upgrade-insecure-requests": "1",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
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

async function defaultBrowserCapture(source: SourceRecord): Promise<string | null> {
  const broker = await buildBrowserBrokerState();
  const route = routeBrowserTask(buildSourceBrowserTask(source), broker.capabilities);
  const artifactCapture = await readCapturedSourceArtifact(source);
  if (artifactCapture) {
    return artifactCapture;
  }

  if (route.status === "blocked") {
    return null;
  }

  return runFallbackCommand(process.env.REVENUE_OS_BROWSER_CAPTURE_CMD, source);
}

async function defaultSearchCapture(source: SourceRecord): Promise<string | null> {
  try {
    const query = encodeURIComponent(`site:${new URL(source.url).hostname} ${source.label}`);
    const response = await fetch(`https://duckduckgo.com/html/?q=${query}`, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return null;
    }

    const raw = await response.text();
    const text = stripHtml(raw);
    return text.trim() ? text : null;
  } catch {
    return null;
  }
}

export async function fetchSourceSnapshot(
  source: SourceRecord,
  options: {
    fetchImpl?: typeof fetch;
    browserCapture?: (source: SourceRecord) => Promise<string | null>;
    uaFetchCapture?: (source: SourceRecord) => Promise<string | null>;
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

    const browserCapture = options.browserCapture ? await options.browserCapture(source) : await defaultBrowserCapture(source);
    if (browserCapture) {
      return snapshotFromText(source, browserCapture, response.status, true, "browser-capture");
    }

    const weakCapture = options.uaFetchCapture ? await options.uaFetchCapture(source) : await uaFetchFallback(source);
    if (weakCapture) {
      return snapshotFromText(source, weakCapture, response.status, true, "ua-fetch-fallback");
    }

    const searchCapture = options.searchCapture
      ? await options.searchCapture(source)
      : (await defaultSearchCapture(source)) ??
        (await runFallbackCommand(process.env.REVENUE_OS_SEARCH_FALLBACK_CMD, source));
    if (searchCapture) {
      return snapshotFromText(source, searchCapture, response.status, true, "search-backed");
    }

    return snapshotFromText(source, raw || `HTTP ${response.status}`, response.status, false, "manual-unverified");
  } catch (error) {
    const browserCapture = options.browserCapture ? await options.browserCapture(source) : await defaultBrowserCapture(source);
    if (browserCapture) {
      return snapshotFromText(source, browserCapture, 0, true, "browser-capture");
    }

    const weakCapture = options.uaFetchCapture ? await options.uaFetchCapture(source) : await uaFetchFallback(source);
    if (weakCapture) {
      return snapshotFromText(source, weakCapture, 0, true, "ua-fetch-fallback");
    }

    const searchCapture = options.searchCapture
      ? await options.searchCapture(source)
      : (await defaultSearchCapture(source)) ??
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

function lowerText(snapshot: SourceSnapshot | undefined): string {
  return `${snapshot?.title ?? ""} ${snapshot?.excerpt ?? ""}`.toLowerCase();
}

function containsAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function buildMethodNote(sourceIds: string[], snapshotMap: Map<string, SourceSnapshot>): string {
  const methods = sourceIds
    .map((sourceId) => snapshotMap.get(sourceId))
    .filter((snapshot): snapshot is SourceSnapshot => Boolean(snapshot))
    .map((snapshot) => `${snapshot.id}:${snapshot.method}`);
  return methods.length > 0 ? ` Methods: ${methods.join(", ")}.` : "";
}

function classifyAnchorSources(sourceIds: string[], snapshotMap: Map<string, SourceSnapshot>): AnchorStatus {
  const snapshots = sourceIds.map((sourceId) => snapshotMap.get(sourceId)).filter(Boolean) as SourceSnapshot[];
  if (snapshots.length !== sourceIds.length) {
    return "unsupported";
  }

  if (
    snapshots.some(
      (snapshot) =>
        (snapshot.httpStatus === 404 || snapshot.httpStatus === 410) &&
        snapshot.method !== "search-backed",
    )
  ) {
    return "unsupported";
  }

  if (snapshots.some((snapshot) => !snapshot.ok || snapshot.method === "manual-unverified")) {
    return "pending-runtime-check";
  }

  if (snapshots.some((snapshot) => snapshot.method === "search-backed" || snapshot.method === "ua-fetch-fallback")) {
    return "pending-runtime-check";
  }

  return "verified";
}

function evaluateAnchorVerification(
  anchor: AnchorVerification,
  snapshotMap: Map<string, SourceSnapshot>,
): AnchorVerification {
  const sourceStatus = classifyAnchorSources(anchor.sourceIds, snapshotMap);
  const sourcesText = anchor.sourceIds.map((sourceId) => lowerText(snapshotMap.get(sourceId))).join(" ");
  const methodNote = buildMethodNote(anchor.sourceIds, snapshotMap);
  const checkedAt = new Date().toISOString();

  if (sourceStatus !== "verified") {
    const pendingNote =
      sourceStatus === "unsupported"
        ? `One or more official sources are unavailable or moved, so this anchor cannot be verified automatically yet.${methodNote}`
        : `One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current.${methodNote}`;
    return {
      ...anchor,
      status: sourceStatus,
      note: pendingNote,
      checkedAt,
    };
  }

  let status: AnchorStatus = "verified";
  let note = anchor.note;

  switch (anchor.id) {
    case "anchor-1":
      status = containsAny(sourcesText, ["unlimited", "virtually unlimited"]) && containsAny(sourcesText, ["guardrail", "abuse"])
        ? "verified"
        : "drifted";
      note =
        status === "verified"
          ? "Official plan docs still frame GPT access in ChatGPT as unlimited or effectively unlimited subject to guardrails."
          : "The latest plan pages no longer clearly support the earlier unlimited-with-guardrails phrasing.";
      break;
    case "anchor-2":
      status = containsAny(sourcesText, ["gpt-5.4", "gpt-5.4 pro"]) && containsAny(sourcesText, ["1.05m", "1,050,000", "1050000"])
        ? "verified"
        : "pending-runtime-check";
      note =
        status === "verified"
          ? "The latest frontier model page still documents GPT-5.4 Pro and the 1.05M context window."
          : "The latest GPT-5.4 Pro page loads, but a real rendered or browser-backed confirmation is still needed to restate the frontier or 1.05M wording precisely.";
      break;
    case "anchor-3":
      status =
        containsAny(sourcesText, ["gpt-5.4", "gpt-5.4 pro", "latest: gpt-5.4"]) &&
        containsAny(sourcesText, ["codex", "cli", "ide", "computer use"])
        ? "verified"
        : "drifted";
      note =
        status === "verified"
          ? "Official frontier-model and Codex docs can be represented separately: GPT-5.4 stays the strategic frontier target while OpenClaw provider-model promotion remains a separate runtime-probed fact."
          : "Current official frontier-model and Codex docs still need a clearer separation from OpenClaw provider-model lag in the repo.";
      break;
    case "anchor-4":
      status = containsAny(sourcesText, ["openai-codex", "gpt-5.3-codex", "gpt-5.1-codex", "gpt-5-codex"])
        ? "verified"
        : "pending-runtime-check";
      note =
        status === "verified"
          ? "OpenClaw provider docs still expose Codex-provider example models that can lag the frontier OpenAI model page."
          : "The provider docs still need a clearer rendered read before restating the exact compatibility fallback assumptions automatically.";
      break;
    case "anchor-5":
      status = containsAny(sourcesText, ["sign in with chatgpt", "chatgpt plan", "chatgpt pro", "chatgpt business"]) && sourcesText.includes("codex")
        ? "verified"
        : "drifted";
      note =
        status === "verified"
          ? "Current Codex docs still support ChatGPT sign-in and plan-based access."
          : "Current Codex docs no longer clearly confirm ChatGPT sign-in or included plan access.";
      break;
    case "anchor-6":
      status = containsAny(sourcesText, ["5 hours", "messages", "weekly"]) ? "verified" : "pending-runtime-check";
      note =
        status === "verified"
          ? "The current Codex plan article still documents separate usage windows that require pacing discipline."
          : "The current Codex plan article could not be parsed cleanly enough to restate the present usage-window numbers automatically.";
      break;
    case "anchor-7":
      status = containsAny(sourcesText, ["openai-codex", "oauth"]) ? "verified" : "drifted";
      note =
        status === "verified"
          ? "OpenClaw provider docs still explicitly document OpenAI Codex OAuth support."
          : "OpenClaw provider docs no longer clearly expose the earlier Codex OAuth flow.";
      break;
    case "anchor-8":
      status = sourcesText.includes("node") && sourcesText.includes("bun") ? "verified" : "pending-runtime-check";
      note =
        status === "verified"
          ? "The current OpenClaw CLI docs still prefer Node and warn against Bun for stable gateways."
          : "The current CLI docs could not be parsed cleanly enough to restate the Node-versus-Bun guidance automatically.";
      break;
    case "anchor-9":
      status = containsAny(sourcesText, ["one gateway", "single gateway", "ssh tunnel", "tailscale", "node host"]) ? "verified" : "pending-runtime-check";
      note =
        status === "verified"
          ? "OpenClaw docs still recommend one primary gateway with secure remote access and remote nodes where needed."
          : "The latest OpenClaw remote-access pages need a human read before restating the gateway-plus-node pattern precisely.";
      break;
    case "anchor-10":
      status = sourcesText.includes("cron") && sourcesText.includes("heartbeat") ? "verified" : "pending-runtime-check";
      note =
        status === "verified"
          ? "The latest automation docs still distinguish cron from heartbeat and support wake-style continuation flows."
          : "The current docs did not expose the cron-versus-heartbeat guidance clearly enough for an automated restatement.";
      break;
    case "anchor-11":
      status = sourcesText.includes("markdown") && sourcesText.includes("embed") ? "verified" : "pending-runtime-check";
      note =
        status === "verified"
          ? "The latest memory docs still show Markdown-first memory and separate embedding requirements."
          : "The current memory docs did not expose the Markdown-plus-embedding wording clearly enough for full automated confirmation.";
      break;
    case "anchor-12":
      status = containsAny(sourcesText, ["qmd", "local embeddings", "local memory"]) ? "verified" : "pending-runtime-check";
      note =
        status === "verified"
          ? "The memory docs still advertise QMD and local-first search options."
          : "The current memory docs did not expose the local-search options clearly enough for full automated confirmation.";
      break;
    case "anchor-13":
      status = containsAny(sourcesText, ["trusted", "untrusted", "supply chain"]) ? "verified" : "pending-runtime-check";
      note =
        status === "verified"
          ? "OpenClaw security guidance still treats skills and plugins as trusted-code or supply-chain risk surfaces."
          : "The current security pages need a human read to restate the plugin or skill trust warning precisely.";
      break;
    case "anchor-14":
      status = containsAny(sourcesText, ["gateway.mode", "mode: \"local\"", "pdf", "secretref", "doctor"])
        ? "verified"
        : "pending-runtime-check";
      note =
        status === "verified"
          ? "Current OpenClaw docs still expose config requirements, broader secret coverage, and PDF tooling."
          : "The current OpenClaw docs did not expose every current config, secret, or PDF detail clearly enough for a full automatic restatement.";
      break;
    case "anchor-15":
      status = containsAny(sourcesText, ["browser", "chrome", "headless", "node host"]) ? "verified" : "pending-runtime-check";
      note =
        status === "verified"
          ? "The browser docs still cover managed browsing, attached Chrome, remote nodes, and headless tradeoffs."
          : "The latest browser docs need a human review to restate the managed-versus-attached or node-host guidance precisely.";
      break;
    case "anchor-16":
      status = containsAny(sourcesText, ["update itself", "not recommended"]) ? "verified" : "pending-runtime-check";
      note =
        status === "verified"
          ? "The current FAQ still treats self-update as possible but not the preferred operating pattern."
          : "The latest FAQ needs a human confirmation of the self-update guidance.";
      break;
    case "anchor-17":
      status = containsAny(sourcesText, ["oauth", "personal token", "psd2"]) ? "verified" : "pending-runtime-check";
      note =
        status === "verified"
          ? "Current Wise docs still separate personal-token and OAuth realities and preserve PSD2 constraints."
          : "The latest Wise docs need a human review before restating the token-versus-OAuth split or PSD2 limits.";
      break;
    case "anchor-18":
      status = containsAny(sourcesText, ["steel local", "steel cloud", "credentials api", "profiles api", "credentials are not supported"])
        ? "verified"
        : "pending-runtime-check";
      note =
        status === "verified"
          ? "Current Steel docs still distinguish Cloud from Local and separate credential or profile capabilities accordingly."
          : "The latest Steel docs need a human review before restating the Cloud-versus-Local capability split.";
      break;
    default:
      break;
  }

  return {
    ...anchor,
    status,
    note: `${note}${methodNote}`,
    checkedAt,
  };
}

export function deriveRuntimeVerification(snapshots: SourceSnapshot[]): AnchorVerification[] {
  const snapshotMap = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));
  return DEFAULT_ANCHOR_VERIFICATIONS.map((anchor) => evaluateAnchorVerification(anchor, snapshotMap));
}

function summarizeMethods(snapshots: SourceSnapshot[]): string {
  const counts = new Map<SourceSnapshot["method"], number>();
  for (const snapshot of snapshots) {
    counts.set(snapshot.method, (counts.get(snapshot.method) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([method, count]) => `${method}: ${count}`)
    .join(", ");
}

export function buildRuntimeVerificationMarkdown(
  anchors: AnchorVerification[],
  snapshots: SourceSnapshot[],
): string {
  return `# Runtime Verification

Generated against official OpenAI, OpenClaw, Wise, and Steel sources on ${new Date().toISOString().slice(0, 10)}.

## Summary

- Verified anchors: ${anchors.filter((anchor) => anchor.status === "verified").length}
- Drifted anchors: ${anchors.filter((anchor) => anchor.status === "drifted").length}
- Pending runtime checks: ${anchors.filter((anchor) => anchor.status === "pending-runtime-check").length}
- Unsupported anchors: ${anchors.filter((anchor) => anchor.status === "unsupported").length}
- Source capture methods: ${summarizeMethods(snapshots)}

## Anchor status

${renderTable(
  ["Anchor", "Status", "Checked", "Notes"],
  anchors.map((anchor) => [anchor.id, anchor.status, anchor.checkedAt.slice(0, 10), anchor.note]),
)}

## Build implications

- Keep GPT-5.4 as the strategic frontier target for substantive work; official OpenAI Codex docs already support that policy even when OpenClaw provider-model promotion still waits on live gateway proof.
- Keep OpenClaw provider identifiers behind aliases because public provider docs can lag frontier OpenAI model pages.
- Treat \`ua-fetch-fallback\` and \`search-backed\` source captures as advisory; they do not replace direct fetch or a real browser-produced artifact.
- Keep real browser-backed refresh available because some OpenAI pages still return HTTP 403 to plain fetches.
- Keep Wise and Steel modes runtime-probed; neither surface should be treated as fully live from config strings alone.
`;
}

export function buildSourceAnchorsMarkdown(snapshots: SourceSnapshot[]): string {
  const snapshotMap = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));

  return `# Source Anchors

Official pages used to verify runtime assumptions.

${renderTable(
  ["Id", "Domain", "Source", "Purpose", "Last method", "Status"],
  OFFICIAL_SOURCES.map((source) => {
    const snapshot = snapshotMap.get(source.id);
    return [
      source.id,
      source.domain,
      `[${source.label}](${source.url})`,
      source.purpose,
      snapshot?.method ?? "not-fetched",
      snapshot?.ok ? String(snapshot.httpStatus) : "pending",
    ];
  }),
)}
`;
}

async function loadStoredSnapshots(): Promise<SourceSnapshot[]> {
  const stored = await readJsonFile<Record<string, SourceSnapshot>>(
    resolveRepoPath("data", "exports", "source-snapshots.json"),
    {},
  );
  return Object.values(stored);
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
    if (previous[snapshot.id]?.hash !== snapshot.hash || previous[snapshot.id]?.method !== snapshot.method) {
      changedSources.push(snapshot);
    }
  }

  await writeJsonFile(resolveRepoPath("data", "exports", "source-snapshots.json"), current);
  return { snapshots, changedSources };
}

export async function readRuntimeVerification(): Promise<AnchorVerification[]> {
  const snapshots = await loadStoredSnapshots();
  if (snapshots.length === 0) {
    return DEFAULT_ANCHOR_VERIFICATIONS.map((anchor) => ({
      ...anchor,
      status: "pending-runtime-check",
      note: "No source snapshots have been captured yet, so this anchor is still waiting for the first runtime refresh.",
      checkedAt: new Date().toISOString(),
    }));
  }

  return deriveRuntimeVerification(snapshots);
}

export async function writeRuntimeDocs(options: {
  anchors?: AnchorVerification[];
  snapshots?: SourceSnapshot[];
} = {}): Promise<void> {
  const snapshots = options.snapshots ?? (await loadStoredSnapshots());
  const anchors = options.anchors ?? deriveRuntimeVerification(snapshots);
  await writeTextFile(
    resolveRepoPath("docs", "runtime-verification.md"),
    buildRuntimeVerificationMarkdown(anchors, snapshots),
  );
  await writeTextFile(resolveRepoPath("docs", "source-anchors.md"), buildSourceAnchorsMarkdown(snapshots));
  await writeJsonFile(resolveRepoPath("data", "exports", "runtime-verification.json"), anchors);
}
