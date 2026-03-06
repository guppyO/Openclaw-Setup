import { fetchSourceSnapshot } from "../../services/update-steward/index.js";

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
      },
    );

    expect(snapshot.method).toBe("manual-unverified");
    expect(snapshot.ok).toBe(false);
  });
});
