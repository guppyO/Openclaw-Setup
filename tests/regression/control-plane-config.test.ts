import { readFile } from "node:fs/promises";
import path from "node:path";

describe("control-plane config", () => {
  test("generated stage config requires local gateway mode and hooks", async () => {
    const configPath = path.join(process.cwd(), "openclaw", "stage", "openclaw.json");
    const config = await readFile(configPath, "utf8");

    expect(config).toContain("\"mode\": \"local\"");
    expect(config).toContain("\"auth\"");
    expect(config).toContain("\"hooks\"");
    expect(config).toContain("\"heartbeat\"");
    expect(config).toContain("\"dispatch/ceo\"");
    expect(config).toContain("\"dispatch/research\"");
  });
});
