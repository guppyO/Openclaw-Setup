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
        attachedChromePaired: false,
        gatewayTokenConfigured: false,
        steel: true,
        steelMode: "cloud",
        steelReady: true,
        steelBaseUrl: "https://api.steel.dev",
        steelAuthConfigured: true,
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
        attachedChromePaired: true,
        gatewayTokenConfigured: true,
        steel: true,
        steelMode: "cloud",
        steelReady: true,
        steelBaseUrl: "https://api.steel.dev",
        steelAuthConfigured: true,
        steelApiConfigured: true,
      },
    );

    expect(decision.lane).toBe("attached-chrome");
    expect(decision.headless).toBe(false);
  });

  test("routes company signup flows to Steel when configured", () => {
    const decision = routeBrowserTask(
      {
        id: "signup",
        title: "Signup flow",
        initiativeId: "growth",
        authLevel: "company",
        antiBotSensitivity: 7,
        parallelism: 2,
        operatorVisible: false,
        requiresPersistentSession: true,
      },
      {
        managedBrowser: true,
        attachedChrome: false,
        attachedChromePaired: false,
        gatewayTokenConfigured: false,
        steel: true,
        steelMode: "cloud",
        steelReady: true,
        steelBaseUrl: "https://api.steel.dev",
        steelAuthConfigured: true,
        steelApiConfigured: true,
      },
    );

    expect(decision.lane).toBe("steel");
    expect(decision.profileId).toBe("company_signup_identity");
  });

  test("routes treasury tasks to Steel before attached Chrome unless operator-visible", () => {
    const decision = routeBrowserTask(
      {
        id: "wise-reconcile",
        title: "Treasury review",
        initiativeId: "treasury",
        authLevel: "treasury",
        antiBotSensitivity: 9,
        parallelism: 1,
        operatorVisible: false,
        requiresPersistentSession: true,
      },
      {
        managedBrowser: true,
        attachedChrome: true,
        attachedChromePaired: true,
        gatewayTokenConfigured: true,
        steel: true,
        steelMode: "self-hosted",
        steelReady: true,
        steelBaseUrl: "https://steel.internal",
        steelAuthConfigured: true,
        steelApiConfigured: false,
      },
    );

    expect(decision.lane).toBe("steel");
    expect(decision.profileId).toBe("wise_primary");
  });
});
