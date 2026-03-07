import { readFile } from "node:fs/promises";
import path from "node:path";

describe("node host bootstrap", () => {
  test("uses singular OpenClaw node commands and requires the gateway token", async () => {
    const scriptPath = path.join(process.cwd(), "scripts", "bootstrap", "bootstrap-openclaw-node-host.ps1");
    const script = await readFile(scriptPath, "utf8");

    expect(script).toContain("OPENCLAW_GATEWAY_TOKEN");
    expect(script).toContain("openclaw node install");
    expect(script).toContain("openclaw node run");
    expect(script).not.toContain("openclaw nodes install");
    expect(script).not.toContain("openclaw nodes run");
  });
});
