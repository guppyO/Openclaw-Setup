import { execFile, type ExecFileOptions } from "node:child_process";
import { promisify } from "node:util";
import { loadLocalRuntimeEnv } from "../common/env-loader.js";
import type {
  BrowserBrokerState,
  BrowserProfileClass,
  BrowserRouteDecision,
  BrowserTaskRequest,
} from "../common/types.js";

const execFileAsync = promisify(execFile);

export interface AttachedChromeProbe {
  paired: boolean;
  tabCount: number;
}

export interface SteelSessionRequest {
  sessionId?: string;
  profileId: string;
  initiativeId: string;
  metadata?: Record<string, unknown>;
  sessionTimeoutMinutes?: number;
  useProxy?: boolean;
}

export interface SteelSessionResult {
  ok: boolean;
  sessionId?: string;
  liveUrl?: string;
  replayUrl?: string;
  error?: string;
}

function parseCsv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function profileById(profileId: string): BrowserProfileClass | undefined {
  return defaultBrowserProfiles().find((profile) => profile.id === profileId);
}

function profileNeedsAuthState(profileId: string): boolean {
  const profile = profileById(profileId);
  return Boolean(profile && profile.riskBoundary !== "public-web");
}

function isLoopbackUrl(url: string): boolean {
  return /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i.test(url);
}

function steelAuthReadyProfiles(): Set<string> {
  return new Set(parseCsv(process.env.STEEL_AUTH_READY_PROFILES));
}

type ExecFileRunner = (
  file: string,
  args: readonly string[],
  options: ExecFileOptions,
) => Promise<{
  stdout: string;
  stderr: string;
}>;

export async function probeAttachedChromeRelay(
  runner: ExecFileRunner = execFileAsync as ExecFileRunner,
): Promise<AttachedChromeProbe> {
  try {
    const command =
      process.platform === "win32"
        ? {
            file: "cmd.exe",
            args: ["/d", "/s", "/c", "openclaw browser --browser-profile chrome tabs --json"],
          }
        : {
            file: "openclaw",
            args: ["browser", "--browser-profile", "chrome", "tabs", "--json"],
          };
    const { stdout } = await runner(
      command.file,
      command.args,
      {
        env: process.env,
        timeout: 10_000,
        windowsHide: true,
      },
    );
    const parsed = JSON.parse(stdout) as { tabs?: unknown[] };
    const tabCount = Array.isArray(parsed.tabs) ? parsed.tabs.length : 0;
    return {
      paired: tabCount > 0,
      tabCount,
    };
  } catch {
    return {
      paired: false,
      tabCount: 0,
    };
  }
}

export function defaultBrowserProfiles(): BrowserProfileClass[] {
  return [
    {
      id: "openclaw_research",
      lane: "openclaw-managed",
      namespace: "openclaw_research",
      purpose: "Default managed-browser lane for research and low-trust site work.",
      riskBoundary: "public-web",
      persistent: false,
    },
    {
      id: "chrome_company",
      lane: "attached-chrome",
      namespace: "chrome_company",
      purpose: "Attached local Chrome for company-authenticated sessions and operator-visible debugging.",
      riskBoundary: "company-auth",
      persistent: true,
    },
    {
      id: "clean_research",
      lane: "steel",
      namespace: "clean_research",
      purpose: "Parallel Steel research sessions with isolated, low-trust state.",
      riskBoundary: "public-web",
      persistent: true,
    },
    {
      id: "company_signup_identity",
      lane: "steel",
      namespace: "company_signup_identity",
      purpose: "Steel namespace for new company signups and verification flows.",
      riskBoundary: "company-auth",
      persistent: true,
    },
    {
      id: "gmail_primary",
      lane: "steel",
      namespace: "gmail_primary",
      purpose: "Steel namespace for the company Gmail inbox and email-confirmation flows.",
      riskBoundary: "root-identity",
      persistent: true,
    },
    {
      id: "wise_primary",
      lane: "steel",
      namespace: "wise_primary",
      purpose: "Steel namespace for Wise browser fallback tasks when token APIs are insufficient.",
      riskBoundary: "treasury",
      persistent: true,
    },
    {
      id: "hetzner_primary",
      lane: "steel",
      namespace: "hetzner_primary",
      purpose: "Steel namespace for Hetzner console and infrastructure tasks.",
      riskBoundary: "infrastructure",
      persistent: true,
    },
    {
      id: "marketplace_generic",
      lane: "steel",
      namespace: "marketplace_generic",
      purpose: "Steel namespace for scalable marketplace listing operations.",
      riskBoundary: "company-auth",
      persistent: true,
    },
  ];
}

function inferRemoteGatewayMode(
  configuredMode: string | undefined,
  baseUrl: string,
): BrowserBrokerState["capabilities"]["remoteGatewayMode"] {
  if (configuredMode === "ssh-tunnel" || configuredMode === "tailscale" || configuredMode === "https" || configuredMode === "local") {
    return configuredMode;
  }

  if (!baseUrl) {
    return "local";
  }

  if (/^https:\/\//i.test(baseUrl)) {
    return "https";
  }

  return "custom";
}

async function probeSteelReachability(baseUrl: string): Promise<boolean> {
  if (!baseUrl) {
    return false;
  }

  try {
    const response = await fetch(baseUrl, {
      method: "GET",
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok || response.status === 401 || response.status === 403;
  } catch {
    return false;
  }
}

export async function browserCapabilities(): Promise<BrowserBrokerState["capabilities"]> {
  await loadLocalRuntimeEnv();

  const configuredBaseUrl = process.env.STEEL_BASE_URL;
  const configuredSteelMode =
    process.env.STEEL_MODE === "cloud" || process.env.STEEL_MODE === "self-hosted"
      ? process.env.STEEL_MODE
      : undefined;
  const inferredSteelMode =
    configuredSteelMode ??
    (configuredBaseUrl
      ? configuredBaseUrl.includes("api.steel.dev")
        ? "cloud"
        : "self-hosted"
      : process.env.STEEL_API_KEY
        ? "cloud"
        : "none");
  const steelBaseUrl = configuredBaseUrl ?? (inferredSteelMode === "cloud" ? "https://api.steel.dev" : "");
  const steelApiConfigured = Boolean(process.env.STEEL_API_KEY);
  const steelAuthConfigured =
    inferredSteelMode === "cloud"
      ? steelApiConfigured
      : inferredSteelMode === "self-hosted"
        ? Boolean(process.env.STEEL_SELF_HOSTED_TOKEN || process.env.STEEL_API_KEY)
        : false;

  const steelCredentialsSupported = inferredSteelMode === "cloud";
  const steelProfilesSupported = inferredSteelMode === "cloud";
  const steelSessionPersistenceSupported = inferredSteelMode !== "none";
  const steelAuthReady = steelAuthReadyProfiles().size > 0;
  const steelSelfHostedPublicReady =
    inferredSteelMode === "self-hosted" &&
    process.env.STEEL_SELF_HOSTED_PUBLIC_READY === "true" &&
    Boolean(steelBaseUrl) &&
    isLoopbackUrl(steelBaseUrl);
  const steelReachable = await probeSteelReachability(steelBaseUrl);
  const steelReady =
    inferredSteelMode !== "none" &&
    Boolean(steelBaseUrl) &&
    steelSessionPersistenceSupported &&
    (steelAuthConfigured || steelSelfHostedPublicReady);
  const steelLiveDebugSupported = inferredSteelMode !== "none" && steelReachable;

  const gatewayTokenConfigured = Boolean(process.env.OPENCLAW_GATEWAY_TOKEN);
  const attachedChromeProbe = await probeAttachedChromeRelay();
  const attachedChromePaired =
    process.env.OPENCLAW_CHROME_RELAY_STATUS === "paired" || attachedChromeProbe.paired;
  const remoteGatewayBaseUrl =
    process.env.OPENCLAW_GATEWAY_BASE_URL ??
    process.env.OPENCLAW_HOOK_BASE_URL ??
    "";
  const remoteGatewayMode = inferRemoteGatewayMode(
    process.env.OPENCLAW_REMOTE_ACCESS_MODE,
    remoteGatewayBaseUrl,
  );
  const remoteGatewayConfigured =
    remoteGatewayMode === "local" ? true : Boolean(remoteGatewayBaseUrl);
  const nodeHostConfigured = Boolean(
    process.env.OPENCLAW_NODE_HOST_ID ||
      process.env.OPENCLAW_NODE_HOST_COMMAND ||
      process.env.OPENCLAW_NODE_HOST_WS_URL,
  );
  const nodeHostReady = process.env.OPENCLAW_NODE_HOST_STATUS === "ready";
  const attachedChrome =
    attachedChromePaired &&
    gatewayTokenConfigured &&
    remoteGatewayConfigured &&
    (remoteGatewayMode === "local" || nodeHostReady);

  return {
    managedBrowser: true,
    attachedChrome,
    attachedChromePaired,
    nodeHostConfigured,
    nodeHostReady,
    gatewayTokenConfigured,
    remoteGatewayConfigured,
    remoteGatewayBaseUrl,
    remoteGatewayMode,
    steel: inferredSteelMode !== "none",
    steelMode: inferredSteelMode,
    steelReady,
    steelBaseUrl,
    steelAuthConfigured,
    steelApiConfigured,
    steelCredentialsSupported,
    steelProfilesSupported,
    steelSessionPersistenceSupported,
    steelLiveDebugSupported,
    steelAuthStateReady: steelAuthReady,
  };
}

function defaultProfileForRequest(request: BrowserTaskRequest): string {
  switch (request.authLevel) {
    case "treasury":
      return "wise_primary";
    case "infrastructure":
      return "hetzner_primary";
    case "company":
      return request.parallelism > 1 ? "company_signup_identity" : "chrome_company";
    default:
      return request.parallelism > 1 ? "clean_research" : "openclaw_research";
  }
}

function readyDecision(
  request: BrowserTaskRequest,
  lane: BrowserRouteDecision["lane"],
  profileId: string,
  headless: boolean,
  reasons: string[],
): BrowserRouteDecision {
  return {
    taskId: request.id,
    status: "ready",
    lane,
    profileId,
    headless,
    reasons,
  };
}

function blockedDecision(request: BrowserTaskRequest, blockerReason: string, reasons: string[]): BrowserRouteDecision {
  return {
    taskId: request.id,
    status: "blocked",
    lane: "blocked",
    profileId: null,
    headless: false,
    blockerReason,
    reasons,
  };
}

function steelProfileReady(
  profileId: string,
  capabilities: BrowserBrokerState["capabilities"],
): boolean {
  if (!capabilities.steelReady) {
    return false;
  }

  if (!profileNeedsAuthState(profileId)) {
    return true;
  }

  if (!capabilities.steelCredentialsSupported || !capabilities.steelProfilesSupported) {
    return false;
  }

  return steelAuthReadyProfiles().has(profileId);
}

export function routeBrowserTask(
  request: BrowserTaskRequest,
  capabilities: BrowserBrokerState["capabilities"],
): BrowserRouteDecision {
  const preferredProfileId = request.preferredProfileId ?? defaultProfileForRequest(request);
  const preferredProfile = profileById(preferredProfileId);

  if (request.authLevel === "treasury" || request.authLevel === "infrastructure") {
    if (capabilities.attachedChrome) {
      return readyDecision(request, "attached-chrome", "chrome_company", false, [
        "High-trust work defaults to attached Chrome when the paired relay and node host are both ready.",
      ]);
    }

    if (preferredProfile && preferredProfile.lane === "steel" && steelProfileReady(preferredProfile.id, capabilities)) {
      return readyDecision(request, "steel", preferredProfile.id, false, [
        "Steel Cloud is ready with profile-backed auth state for this high-trust task.",
      ]);
    }

    return blockedDecision(request, "high-trust-browser-lane-unavailable", [
      "Treasury and infrastructure work will not silently degrade into the generic managed browser.",
      capabilities.attachedChrome
        ? "Attached Chrome is ready, but this task requested a non-visible or non-preferred path."
        : "Attached Chrome is not fully ready through pairing, token auth, remote gateway reachability, and node host.",
      capabilities.steelMode === "cloud"
        ? "Steel Cloud is missing auth-ready profile state for this task."
        : capabilities.steelMode === "self-hosted"
          ? "Steel Local or self-hosted mode is not treated as auth-ready for credential-injection tasks."
          : "Steel is not configured for auth-sensitive browser work.",
    ]);
  }

  if (request.authLevel === "company" && request.requiresPersistentSession) {
    if (capabilities.attachedChrome) {
      return readyDecision(request, "attached-chrome", "chrome_company", false, [
        "Attached Chrome is the default safe lane for persistent company-auth work.",
      ]);
    }

    if (preferredProfile && preferredProfile.lane === "steel" && steelProfileReady(preferredProfile.id, capabilities)) {
      return readyDecision(request, "steel", preferredProfile.id, false, [
        "Steel Cloud is ready with persistent profile-backed auth for this company task.",
      ]);
    }

    return blockedDecision(request, "company-auth-lane-unavailable", [
      "Company-auth work that needs persistent state will not silently fall back to the generic managed browser.",
    ]);
  }

  if (capabilities.attachedChrome && (request.operatorVisible || (request.authLevel === "company" && request.antiBotSensitivity >= 8))) {
    return readyDecision(request, "attached-chrome", "chrome_company", false, [
      "Attached Chrome is paired and ready for the requested visible or high-sensitivity flow.",
    ]);
  }

  if (
    preferredProfile &&
    preferredProfile.lane === "steel" &&
    capabilities.steelReady &&
    (request.parallelism > 1 || request.requiresPersistentSession || request.authLevel === "company")
  ) {
    if (profileNeedsAuthState(preferredProfile.id) && !steelProfileReady(preferredProfile.id, capabilities)) {
      return blockedDecision(request, "steel-auth-state-missing", [
        "The requested Steel profile requires auth-ready profile state that has not been provisioned yet.",
      ]);
    }

    return readyDecision(request, "steel", preferredProfile.id, false, [
      "Steel is the best available lane for persistent or parallel browser work tied to a reusable namespace.",
    ]);
  }

  return readyDecision(request, "openclaw-managed", "openclaw_research", request.authLevel === "public", [
    "OpenClaw managed browser is the default typed lane for public or low-trust work.",
  ]);
}

function authHeaders(mode: BrowserBrokerState["capabilities"]["steelMode"]): HeadersInit {
  const headers: HeadersInit = {
    "content-type": "application/json",
  };

  if (mode === "self-hosted") {
    if (process.env.STEEL_SELF_HOSTED_TOKEN) {
      return {
        ...headers,
        authorization: `Bearer ${process.env.STEEL_SELF_HOSTED_TOKEN}`,
      };
    }

    if (process.env.STEEL_API_KEY) {
      return {
        ...headers,
        "steel-api-key": process.env.STEEL_API_KEY,
      };
    }

    return headers;
  }

  return {
    ...headers,
    "steel-api-key": process.env.STEEL_API_KEY ?? "",
  };
}

export async function createSteelSession(request: SteelSessionRequest): Promise<SteelSessionResult> {
  await loadLocalRuntimeEnv();

  const capabilities = await browserCapabilities();
  const baseUrl = capabilities.steelBaseUrl;
  if (!capabilities.steelReady || !baseUrl) {
    return {
      ok: false,
      error: "Steel is not fully configured for the active cloud or self-hosted mode.",
    };
  }

  if (profileNeedsAuthState(request.profileId) && !steelProfileReady(request.profileId, capabilities)) {
    return {
      ok: false,
      error:
        capabilities.steelMode === "self-hosted"
          ? "Steel self-hosted mode is not treated as auth-ready for credential-backed account lanes."
          : `Steel profile ${request.profileId} is not marked auth-ready in STEEL_AUTH_READY_PROFILES.`,
    };
  }

  const response = await fetch(`${baseUrl}/v1/sessions`, {
    method: "POST",
    headers: authHeaders(capabilities.steelMode),
    body: JSON.stringify({
      sessionId: request.sessionId,
      namespace: request.profileId,
      useProxy: request.useProxy ?? true,
      sessionTimeoutMinutes: request.sessionTimeoutMinutes ?? 45,
      metadata: {
        initiativeId: request.initiativeId,
        ...request.metadata,
      },
      credentials:
        capabilities.steelMode === "cloud" && profileNeedsAuthState(request.profileId)
          ? {
              profileId: request.profileId,
            }
          : undefined,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    return {
      ok: false,
      error: String(payload.error ?? `Steel session create failed with ${response.status}`),
    };
  }

  return {
    ok: true,
    sessionId: String(payload.id ?? payload.sessionId ?? ""),
    liveUrl: typeof payload.liveUrl === "string" ? payload.liveUrl : undefined,
    replayUrl: typeof payload.replayUrl === "string" ? payload.replayUrl : undefined,
  };
}

export async function releaseSteelSession(sessionId: string): Promise<SteelSessionResult> {
  await loadLocalRuntimeEnv();

  const capabilities = await browserCapabilities();
  const baseUrl = capabilities.steelBaseUrl;
  if (!capabilities.steelReady || !baseUrl) {
    return {
      ok: false,
      error: "Steel is not fully configured for the active cloud or self-hosted mode.",
    };
  }

  const response = await fetch(`${baseUrl}/v1/sessions/${sessionId}`, {
    method: "DELETE",
    headers: authHeaders(capabilities.steelMode),
  });

  if (!response.ok) {
    return {
      ok: false,
      error: `Steel session release failed with ${response.status}`,
    };
  }

  return {
    ok: true,
    sessionId,
  };
}

export async function buildBrowserBrokerState(): Promise<BrowserBrokerState> {
  const capabilities = await browserCapabilities();
  const attachedChromeProbe = await probeAttachedChromeRelay();
  const profiles = defaultBrowserProfiles();
  const sampleRequests: BrowserTaskRequest[] = [
    {
      id: "market-research",
      title: "Run market research sweep",
      initiativeId: "research",
      authLevel: "public",
      antiBotSensitivity: 3,
      parallelism: 4,
      operatorVisible: false,
      requiresPersistentSession: false,
    },
    {
      id: "wise-reconcile",
      title: "Review Wise dashboard for reconciliation evidence",
      initiativeId: "treasury",
      authLevel: "treasury",
      antiBotSensitivity: 9,
      parallelism: 1,
      operatorVisible: true,
      requiresPersistentSession: true,
    },
    {
      id: "signup-run",
      title: "Complete a company account signup",
      initiativeId: "growth",
      authLevel: "company",
      antiBotSensitivity: 7,
      parallelism: 2,
      operatorVisible: false,
      requiresPersistentSession: true,
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    capabilities,
    profiles,
    sampleRoutes: sampleRequests.map((request) => routeBrowserTask(request, capabilities)),
    activeSessions: attachedChromeProbe.tabCount,
  };
}
