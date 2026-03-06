import { loadLocalRuntimeEnv } from "../common/env-loader.js";
import type {
  BrowserBrokerState,
  BrowserProfileClass,
  BrowserRouteDecision,
  BrowserTaskRequest,
} from "../common/types.js";

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

export async function browserCapabilities(): Promise<BrowserBrokerState["capabilities"]> {
  await loadLocalRuntimeEnv();

  const configuredBaseUrl = process.env.STEEL_BASE_URL;
  const inferredSteelMode =
    process.env.STEEL_MODE === "cloud" || process.env.STEEL_MODE === "self-hosted"
      ? process.env.STEEL_MODE
      : configuredBaseUrl
        ? configuredBaseUrl.includes("api.steel.dev")
          ? "cloud"
          : "self-hosted"
        : process.env.STEEL_API_KEY
          ? "cloud"
          : "none";
  const steelBaseUrl = configuredBaseUrl ?? (inferredSteelMode === "cloud" ? "https://api.steel.dev" : "");
  const steelApiConfigured = Boolean(process.env.STEEL_API_KEY);
  const steelAuthConfigured =
    inferredSteelMode === "cloud"
      ? steelApiConfigured
      : inferredSteelMode === "self-hosted"
        ? Boolean(process.env.STEEL_SELF_HOSTED_TOKEN || process.env.STEEL_API_KEY)
        : false;
  const gatewayTokenConfigured = Boolean(process.env.OPENCLAW_GATEWAY_TOKEN);
  const attachedChromePaired = process.env.OPENCLAW_CHROME_RELAY_STATUS === "paired";

  return {
    managedBrowser: true,
    attachedChrome: attachedChromePaired && gatewayTokenConfigured,
    attachedChromePaired,
    gatewayTokenConfigured,
    steel: inferredSteelMode !== "none",
    steelMode: inferredSteelMode,
    steelReady: inferredSteelMode !== "none" && steelAuthConfigured && Boolean(steelBaseUrl),
    steelBaseUrl,
    steelAuthConfigured,
    steelApiConfigured,
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

export function routeBrowserTask(
  request: BrowserTaskRequest,
  capabilities: BrowserBrokerState["capabilities"],
): BrowserRouteDecision {
  if (request.preferredProfileId) {
    const preferredProfile = defaultBrowserProfiles().find((profile) => profile.id === request.preferredProfileId);
    if (preferredProfile) {
      return {
        taskId: request.id,
        lane: preferredProfile.lane,
        profileId: preferredProfile.id,
        headless: preferredProfile.lane !== "attached-chrome" && request.authLevel === "public",
        reasons: ["Preferred profile explicitly requested by the workflow."],
      };
    }
  }

  if (request.authLevel === "treasury" || request.authLevel === "infrastructure") {
    if (request.operatorVisible && capabilities.attachedChrome) {
      return {
        taskId: request.id,
        lane: "attached-chrome",
        profileId: "chrome_company",
        headless: false,
        reasons: [
          "This high-trust account task is explicitly operator-visible, so the attached Chrome lane takes precedence.",
        ],
      };
    }

    if (capabilities.steelReady) {
      return {
        taskId: request.id,
        lane: "steel",
        profileId: defaultProfileForRequest(request),
        headless: false,
        reasons: [
          "Treasury and infrastructure flows prefer a persistent Steel namespace unless attached Chrome is explicitly required.",
        ],
      };
    }

    if (capabilities.attachedChrome && request.antiBotSensitivity >= 9) {
      return {
        taskId: request.id,
        lane: "attached-chrome",
        profileId: "chrome_company",
        headless: false,
        reasons: [
          "Steel is unavailable and the task is highly sensitive, so attached Chrome becomes the fallback high-trust lane.",
        ],
      };
    }
  }

  if (
    capabilities.attachedChrome &&
    (request.operatorVisible || (request.authLevel === "company" && request.antiBotSensitivity >= 8))
  ) {
    return {
      taskId: request.id,
      lane: "attached-chrome",
      profileId: "chrome_company",
      headless: false,
      reasons: [
        "Attached Chrome is paired and this task benefits from high-trust or operator-visible browsing.",
      ],
    };
  }

  if (
    capabilities.steelReady &&
    (request.parallelism > 1 ||
      request.requiresPersistentSession ||
      request.authLevel === "company")
  ) {
    const profileId = defaultProfileForRequest(request);
    return {
      taskId: request.id,
      lane: "steel",
      profileId,
      headless: false,
      reasons: [
        "Steel is the best lane for persistent or parallel browser work tied to a reusable namespace.",
      ],
    };
  }

  return {
    taskId: request.id,
    lane: "openclaw-managed",
    profileId: "openclaw_research",
    headless: request.authLevel === "public",
    reasons: [
      "OpenClaw managed browser is the default typed lane when a stronger attached or Steel route is not ready.",
    ],
  };
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
    activeSessions: 0,
  };
}
