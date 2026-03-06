import { defaultBrowserProfiles, routeBrowserTask } from "../../services/browser-broker/index.js";

describe("browser policy", () => {
  test("routes public parallel work to Steel when available", () => {
    const decision = routeBrowserTask(
      {
        id: "research",
        title: "Research sweep",
        initiativeId: "research",
        authLevel: "public",
        antiBotSensitivity: 3,
        parallelism: 3,
        operatorVisible: false,
        requiresPersistentSession: false,
      },
      {
        managedBrowser: true,
        attachedChrome: false,
        steel: true,
        steelBaseUrl: "https://api.steel.dev",
        steelApiConfigured: true,
      },
    );

    expect(decision.lane).toBe("steel");
    expect(defaultBrowserProfiles().some((profile) => profile.id === decision.profileId)).toBe(true);
  });

  test("routes high-trust visible work to attached Chrome when paired", () => {
    const decision = routeBrowserTask(
      {
        id: "wise",
        title: "Wise review",
        initiativeId: "treasury",
        authLevel: "treasury",
        antiBotSensitivity: 9,
        parallelism: 1,
        operatorVisible: true,
        requiresPersistentSession: true,
      },
      {
        managedBrowser: true,
        attachedChrome: true,
        steel: true,
        steelBaseUrl: "https://api.steel.dev",
        steelApiConfigured: true,
      },
    );

    expect(decision.lane).toBe("attached-chrome");
    expect(decision.headless).toBe(false);
  });
});
