import { deriveRuntimeVerification, fetchSourceSnapshot } from "../../services/update-steward/index.js";

describe("update steward", () => {
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
    ]);

    expect(anchors.find((anchor) => anchor.id === "anchor-2")?.status).toBe("verified");
    expect(anchors.find((anchor) => anchor.id === "anchor-3")?.status).toBe("verified");
  });
});
