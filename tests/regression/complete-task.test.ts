import { resolveGatewayHookBaseUrl, resolveRuntimeEnvironment } from "../../scripts/runtime/complete-task.js";

describe("complete-task gateway resolution", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("defaults to local loopback for local mode", () => {
    delete process.env.OPENCLAW_GATEWAY_BASE_URL;
    delete process.env.OPENCLAW_HOOK_BASE_URL;
    process.env.OPENCLAW_REMOTE_ACCESS_MODE = "local";

    const resolved = resolveGatewayHookBaseUrl("stage");
    expect(resolved.gatewayMode).toBe("local");
    expect(resolved.hookBaseUrl).toBe("http://127.0.0.1:4201");
  });

  test("uses local forwarded port for ssh tunnel mode", () => {
    delete process.env.OPENCLAW_GATEWAY_BASE_URL;
    delete process.env.OPENCLAW_HOOK_BASE_URL;
    process.env.OPENCLAW_REMOTE_ACCESS_MODE = "ssh-tunnel";
    process.env.OPENCLAW_GATEWAY_PORT = "5501";

    const resolved = resolveGatewayHookBaseUrl("prod");
    expect(resolved.gatewayMode).toBe("ssh-tunnel");
    expect(resolved.hookBaseUrl).toBe("http://127.0.0.1:5501");
  });

  test("requires an explicit remote base URL for tailscale mode", () => {
    delete process.env.OPENCLAW_GATEWAY_BASE_URL;
    delete process.env.OPENCLAW_HOOK_BASE_URL;
    process.env.OPENCLAW_REMOTE_ACCESS_MODE = "tailscale";

    const resolved = resolveGatewayHookBaseUrl("prod");
    expect(resolved.gatewayMode).toBe("tailscale");
    expect(resolved.hookBaseUrl).toBeNull();
  });

  test("defaults the runtime environment to stage", () => {
    delete process.env.REVENUE_OS_ENVIRONMENT;

    expect(resolveRuntimeEnvironment()).toBe("stage");
  });

  test("honors an explicit runtime environment override", () => {
    process.env.REVENUE_OS_ENVIRONMENT = "prod";

    expect(resolveRuntimeEnvironment()).toBe("prod");
  });
});
