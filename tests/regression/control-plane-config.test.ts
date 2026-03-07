import { readFile } from "node:fs/promises";
import path from "node:path";

describe("control-plane config", () => {
  test("generated stage config requires local gateway mode and hooks", async () => {
    const configPath = path.join(process.cwd(), "openclaw", "stage", "openclaw.json");
    const config = await readFile(configPath, "utf8");

    expect(config).toContain("\"mode\": \"local\"");
    expect(config).toContain("\"auth\"");
    expect(config).toContain("\"hooks\"");
    expect(config).toContain("\"dispatch/ceo\"");
    expect(config).toContain("\"dispatch/research\"");
    expect(config).toContain("\"thinkingDefault\": \"high\"");
    expect(config).toContain("\"compaction\"");
    expect(config).toContain("\"id\": \"ceo\"");
    expect(config).toContain("\"token\": \"__OPENCLAW_GATEWAY_TOKEN__\"");
    expect(config).toContain("\"token\": \"__OPENCLAW_HOOK_TOKEN__\"");
    expect(config).not.toContain("\"controlUi\": false");
    expect(config).not.toContain("\"model\": {\n    \"primary\"");
  });
});
