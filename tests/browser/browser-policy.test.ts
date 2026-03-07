import { defaultBrowserProfiles, routeBrowserTask } from "../../services/browser-broker/index.js";

const cloudCapabilities = {
  managedBrowser: true,
  attachedChrome: false,
  attachedChromePaired: false,
  nodeHostConfigured: false,
  nodeHostReady: false,
  gatewayTokenConfigured: false,
  remoteGatewayConfigured: true,
  remoteGatewayBaseUrl: "http://127.0.0.1:4301",
  remoteGatewayMode: "local" as const,
  steel: true,
  steelMode: "cloud" as const,
  steelReady: true,
  steelBaseUrl: "https://api.steel.dev",
  steelAuthConfigured: true,
  steelApiConfigured: true,
  steelCredentialsSupported: true,
  steelProfilesSupported: true,
  steelSessionPersistenceSupported: true,
  steelLiveDebugSupported: true,
  steelAuthStateReady: true,
};

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
      cloudCapabilities,
    );

    expect(decision.status).toBe("ready");
    expect(decision.lane).toBe("steel");
    expect(defaultBrowserProfiles().some((profile) => profile.id === decision.profileId)).toBe(true);
  });

  test("routes high-trust visible work to attached Chrome when fully ready", () => {
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
        ...cloudCapabilities,
        attachedChrome: true,
        attachedChromePaired: true,
        nodeHostConfigured: true,
        nodeHostReady: true,
        gatewayTokenConfigured: true,
        remoteGatewayMode: "ssh-tunnel",
      },
    );

    expect(decision.status).toBe("ready");
    expect(decision.lane).toBe("attached-chrome");
    expect(decision.headless).toBe(false);
  });

  test("blocks treasury work when no safe high-trust lane is ready", () => {
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
        ...cloudCapabilities,
        steelReady: false,
        steelAuthStateReady: false,
      },
    );

    expect(decision.status).toBe("blocked");
    expect(decision.lane).toBe("blocked");
    expect(decision.blockerReason).toBe("high-trust-browser-lane-unavailable");
  });

  test("blocks company-auth persistent work when Steel auth state is missing", () => {
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
        ...cloudCapabilities,
        steelAuthStateReady: false,
      },
    );

    expect(decision.status).toBe("blocked");
    expect(decision.blockerReason).toBe("company-auth-lane-unavailable");
  });

  test("does not treat Steel self-hosted as auth-ready for treasury work", () => {
    const decision = routeBrowserTask(
      {
        id: "wise-reconcile",
        title: "Treasury review",
        initiativeId: "treasury",
        authLevel: "treasury",
        antiBotSensitivity: 8,
        parallelism: 1,
        operatorVisible: false,
        requiresPersistentSession: true,
      },
      {
        ...cloudCapabilities,
        steelMode: "self-hosted",
        steelBaseUrl: "https://steel.internal",
        steelApiConfigured: false,
        steelCredentialsSupported: false,
        steelProfilesSupported: false,
      },
    );

    expect(decision.status).toBe("blocked");
    expect(decision.blockerReason).toBe("high-trust-browser-lane-unavailable");
  });

  test("routes public parallel work to self-hosted Steel when it is loopback-ready", () => {
    const decision = routeBrowserTask(
      {
        id: "public-research-self-hosted",
        title: "Parallel public research",
        initiativeId: "research",
        authLevel: "public",
        antiBotSensitivity: 2,
        parallelism: 4,
        operatorVisible: false,
        requiresPersistentSession: false,
      },
      {
        ...cloudCapabilities,
        steelMode: "self-hosted",
        steelBaseUrl: "http://127.0.0.1:4300",
        steelAuthConfigured: false,
        steelApiConfigured: false,
        steelCredentialsSupported: false,
        steelProfilesSupported: false,
      },
    );

    expect(decision.status).toBe("ready");
    expect(decision.lane).toBe("steel");
    expect(decision.profileId).toBe("clean_research");
  });
});
