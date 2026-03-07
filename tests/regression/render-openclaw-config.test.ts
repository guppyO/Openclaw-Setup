import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { renderOpenClawConfig } from "../../scripts/runtime/render-openclaw-config.js";

describe("rendered OpenClaw config", () => {
  test("infers the attached Chrome relay profile from the live tunnel and node-host state", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "revenue-os-render-"));
    const outputPath = path.join(tempDir, "stage.json");

    const previous = {
      OPENCLAW_GATEWAY_TOKEN: process.env.OPENCLAW_GATEWAY_TOKEN,
      OPENCLAW_HOOK_TOKEN: process.env.OPENCLAW_HOOK_TOKEN,
      OPENCLAW_GATEWAY_PORT: process.env.OPENCLAW_GATEWAY_PORT,
      OPENCLAW_NODE_HOST_STATUS: process.env.OPENCLAW_NODE_HOST_STATUS,
      OPENCLAW_CHROME_RELAY_STATUS: process.env.OPENCLAW_CHROME_RELAY_STATUS,
      OPENCLAW_CHROME_PROFILE_CDP_PORT: process.env.OPENCLAW_CHROME_PROFILE_CDP_PORT,
      OPENCLAW_ATTACHED_CHROME_CDP_PORT: process.env.OPENCLAW_ATTACHED_CHROME_CDP_PORT,
    };

    process.env.OPENCLAW_GATEWAY_TOKEN = "gateway-token";
    process.env.OPENCLAW_HOOK_TOKEN = "hook-token";
    process.env.OPENCLAW_GATEWAY_PORT = "4201";
    process.env.OPENCLAW_NODE_HOST_STATUS = "ready";
    process.env.OPENCLAW_CHROME_RELAY_STATUS = "paired";
    delete process.env.OPENCLAW_CHROME_PROFILE_CDP_PORT;
    delete process.env.OPENCLAW_ATTACHED_CHROME_CDP_PORT;

    try {
      await renderOpenClawConfig("stage", outputPath);
      const rendered = JSON.parse(await readFile(outputPath, "utf8")) as {
        browser?: { profiles?: { chrome?: { driver?: string; cdpPort?: number } } };
      };

      expect(rendered.browser?.profiles?.chrome?.driver).toBe("extension");
      expect(rendered.browser?.profiles?.chrome?.cdpPort).toBe(4204);
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
