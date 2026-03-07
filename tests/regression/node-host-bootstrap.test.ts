import { readFile } from "node:fs/promises";
import path from "node:path";

describe("node host bootstrap", () => {
  test("uses singular OpenClaw node commands, documented flags, and requires the gateway token", async () => {
    const scriptPath = path.join(process.cwd(), "scripts", "bootstrap", "bootstrap-openclaw-node-host.ps1");
    const script = await readFile(scriptPath, "utf8");

    expect(script).toContain("OPENCLAW_GATEWAY_TOKEN");
    expect(script).toContain("openclaw node install");
    expect(script).toContain("openclaw node run");
    expect(script).toContain("--node-id $NodeName");
    expect(script).toContain("--display-name $DisplayName");
    expect(script).not.toContain("openclaw nodes install");
    expect(script).not.toContain("openclaw nodes run");
    expect(script).not.toContain("openclaw node install $NodeName");
    expect(script).not.toContain("openclaw node run $NodeName");
  });
});
