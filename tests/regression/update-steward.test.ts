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

  test("falls back to browser capture when direct fetch fails", async () => {
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
        browserCapture: async () => "<html><title>Browser</title><body>Fallback</body></html>",
      },
    );

    expect(snapshot.method).toBe("browser-capture");
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
        title: "GPT-5.4 frontier model",
        excerpt: "GPT-5.4 frontier 1.05M 1,050,000 context window",
        method: "direct-fetch",
      },
      {
        id: "openai-codex-upgrades",
        url: "https://example.com/codex",
        fetchedAt: new Date().toISOString(),
        ok: true,
        hash: "b",
        httpStatus: 200,
        title: "Codex upgrades",
        excerpt: "Codex introduces GPT-5.3-Codex on Codex surfaces",
        method: "direct-fetch",
      },
      {
        id: "openai-gpt-5.3-codex",
        url: "https://example.com/gpt-5.3-codex",
        fetchedAt: new Date().toISOString(),
        ok: true,
        hash: "c",
        httpStatus: 200,
        title: "GPT-5.3-Codex",
        excerpt: "GPT-5.3-Codex is available in Codex.",
        method: "direct-fetch",
      },
    ]);

    expect(anchors.find((anchor) => anchor.id === "anchor-2")?.status).toBe("verified");
    expect(anchors.find((anchor) => anchor.id === "anchor-3")?.status).toBe("drifted");
  });
});
