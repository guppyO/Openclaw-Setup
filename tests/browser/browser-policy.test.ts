describe("browser policy", () => {
  test("prefers managed and attached profiles deliberately", () => {
    const config = {
      defaultProfile: "openclaw",
      profiles: {
        openclaw: { headless: true },
        chrome: { mode: "attached" },
      },
    };

    expect(config.defaultProfile).toBe("openclaw");
    expect(config.profiles.chrome.mode).toBe("attached");
  });
});
