import { deriveRuntimeVerification, fetchSourceSnapshot, refreshOfficialSources } from "../../services/update-steward/index.js";
import { writeJsonFile } from "../../services/common/fs.js";

describe("update steward", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("records direct fetch success", async () => {
    const snapshot = await fetchSourceSnapshot(
      {
        id: "test",
        label: "Test",
        domain: "openai",
        url: "https://example.com",
        purpose: "test",
      },
      {
        fetchImpl: async () =>
          new Response("<html><title>Ok</title><body>Hello</body></html>", {
            status: 200,
          }),
      },
    );

    expect(snapshot.method).toBe("direct-fetch");
    expect(snapshot.ok).toBe(true);
  });

  test("records real browser capture separately from weak UA fetch fallback", async () => {
    const snapshot = await fetchSourceSnapshot(
      {
        id: "test",
        label: "Test",
        domain: "openai",
        url: "https://example.com",
        purpose: "test",
      },
      {
        fetchImpl: async () =>
          new Response("blocked", {
            status: 403,
          }),
        browserCapture: async () => "<html><title>Browser</title><body>Captured</body></html>",
      },
    );

    expect(snapshot.method).toBe("browser-capture");
    expect(snapshot.ok).toBe(true);
  });

  test("labels UA fallback honestly when no real browser capture exists", async () => {
    const snapshot = await fetchSourceSnapshot(
      {
        id: "test",
        label: "Test",
        domain: "openai",
        url: "https://example.com",
        purpose: "test",
      },
      {
        fetchImpl: async () =>
          new Response("blocked", {
            status: 403,
          }),
        browserCapture: async () => null,
        uaFetchCapture: async () => "<html><title>UA</title><body>Fallback</body></html>",
      },
    );

    expect(snapshot.method).toBe("ua-fetch-fallback");
    expect(snapshot.ok).toBe(true);
  });

  test("does not relabel an arbitrary shell command as browser capture", async () => {
    process.env.REVENUE_OS_BROWSER_CAPTURE_CMD =
      `"${process.execPath}" -e "process.stdout.write('<html><title>Shell</title><body>Capture</body></html>')"`;

    const snapshot = await fetchSourceSnapshot(
      {
        id: "test",
        label: "Test",
        domain: "openai",
        url: "https://example.com",
        purpose: "test",
      },
      {
        fetchImpl: async () =>
          new Response("blocked", {
            status: 403,
          }),
        uaFetchCapture: async () => null,
        searchCapture: async () => null,
      },
    );

    expect(snapshot.method).toBe("manual-unverified");
    expect(snapshot.ok).toBe(false);
  });

  test("prefers repo-native browser capture over UA fallback when a browser lane is ready", async () => {
    const snapshot = await fetchSourceSnapshot(
      {
        id: "test",
        label: "Test",
        domain: "openai",
        url: "https://example.com",
        purpose: "test",
      },
      {
        fetchImpl: async () =>
          new Response("blocked", {
            status: 403,
          }),
        brokerState: {
          generatedAt: new Date().toISOString(),
          capabilities: {
            managedBrowser: true,
            attachedChrome: true,
            attachedChromePaired: true,
            nodeHostConfigured: true,
            nodeHostReady: true,
            gatewayTokenConfigured: true,
            remoteGatewayConfigured: true,
            remoteGatewayBaseUrl: "http://127.0.0.1:4201",
            remoteGatewayMode: "ssh-tunnel",
            steel: false,
            steelMode: "none",
            steelReady: false,
            steelBaseUrl: "",
            steelAuthConfigured: false,
            steelApiConfigured: false,
            steelCredentialsSupported: false,
            steelProfilesSupported: false,
            steelSessionPersistenceSupported: false,
            steelLiveDebugSupported: false,
            steelAuthStateReady: false,
          },
          profiles: [],
          sampleRoutes: [],
          activeSessions: 0,
        },
        nativeBrowserCapture: async () => "<html><title>Native</title><body>Captured in repo</body></html>",
        uaFetchCapture: async () => "<html><title>UA</title><body>Fallback</body></html>",
      },
    );

    expect(snapshot.method).toBe("browser-capture");
    expect(snapshot.title).toBe("Native");
  });

  test("marks the source manual-unverified when all methods fail", async () => {
    const snapshot = await fetchSourceSnapshot(
      {
        id: "test",
        label: "Test",
        domain: "openai",
        url: "https://example.com",
        purpose: "test",
      },
      {
        fetchImpl: async () => {
          throw new Error("network");
        },
        browserCapture: async () => null,
        uaFetchCapture: async () => null,
        searchCapture: async () => null,
      },
    );

    expect(snapshot.method).toBe("manual-unverified");
    expect(snapshot.ok).toBe(false);
  });

  test("derives runtime verification from fresh snapshots instead of static defaults", () => {
    const anchors = deriveRuntimeVerification([
      {
        id: "openai-gpt-5.4-model",
        url: "https://example.com/gpt-5.4",
        fetchedAt: new Date().toISOString(),
        ok: true,
        hash: "a",
        httpStatus: 200,
        title: "GPT-5.4 Pro frontier model",
        excerpt: "GPT-5.4 Pro 1.05M 1,050,000 context window",
        method: "direct-fetch",
      },
      {
        id: "openai-codex-plan",
        url: "https://example.com/codex-plan",
        fetchedAt: new Date().toISOString(),
        ok: true,
        hash: "b",
        httpStatus: 200,
        title: "Using Codex with your ChatGPT plan",
        excerpt: "Sign in with ChatGPT. The default model is GPT-5.1-Codex. 300 messages every 5 hours.",
        method: "browser-capture",
      },
      {
        id: "openai-codex-upgrades",
        url: "https://example.com/codex",
        fetchedAt: new Date().toISOString(),
        ok: true,
        hash: "c",
        httpStatus: 200,
        title: "Codex upgrades",
        excerpt: "Codex app, CLI, IDE extension, and Codex Cloud are available.",
        method: "browser-capture",
      },
      {
        id: "openai-codex-app",
        url: "https://example.com/codex-app",
        fetchedAt: new Date().toISOString(),
        ok: true,
        hash: "d",
        httpStatus: 200,
        title: "Codex app",
        excerpt: "Windows app, IDE extension, and CLI support continuous work.",
        method: "browser-capture",
      },
      {
        id: "openclaw-changelog",
        url: "https://example.com/openclaw-changelog",
        fetchedAt: new Date().toISOString(),
        ok: true,
        hash: "e",
        httpStatus: 200,
        title: "OpenClaw changelog",
        excerpt: "Merged GPT-5.4 support, xhigh thinking support, and updated provider routing.",
        method: "direct-fetch",
      },
      {
        id: "openclaw-pr-36905",
        url: "https://example.com/openclaw-pr-36905",
        fetchedAt: new Date().toISOString(),
        ok: true,
        hash: "f",
        httpStatus: 200,
        title: "OpenClaw PR 36905",
        excerpt: "Change default reasoning models to latest GPT-5.4.",
        method: "direct-fetch",
      },
    ]);

    expect(anchors.find((anchor) => anchor.id === "anchor-2")?.status).toBe("verified");
    expect(anchors.find((anchor) => anchor.id === "anchor-3")?.status).toBe("verified");
  });

  test("keeps stronger prior snapshots when a refresh falls back to a weaker method", async () => {
    const originalFetch = globalThis.fetch;
    await writeJsonFile("data/exports/source-snapshots.json", {
      "openai-gpt-5.4-model": {
        id: "openai-gpt-5.4-model",
        url: "https://example.com/prior",
        fetchedAt: new Date().toISOString(),
        ok: true,
        hash: "strong-prior",
        httpStatus: 200,
        title: "Prior",
        excerpt: "Strong prior snapshot",
        method: "direct-fetch",
      },
    });

    globalThis.fetch = async () => new Response("blocked", { status: 403 });
    try {
      const result = await refreshOfficialSources();
      const kept = result.snapshots.find((snapshot) => snapshot.id === "openai-gpt-5.4-model");
      expect(kept?.method).toBe("direct-fetch");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
