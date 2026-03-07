import { readFile } from "node:fs/promises";
import path from "node:path";

describe("control-plane config", () => {
  test("generated stage config requires local gateway mode and hooks", async () => {
    const configPath = path.join(process.cwd(), "openclaw", "stage", "openclaw.json");
    const config = await readFile(configPath, "utf8");
    const stageUnit = await readFile(
      path.join(process.cwd(), "openclaw", "stage", "systemd", "revenue-os-stage.service"),
      "utf8",
    );

    expect(config).toContain("\"mode\": \"local\"");
    expect(config).toContain("\"auth\"");
    expect(config).toContain("\"hooks\"");
    expect(config).toContain("\"dispatch/ceo\"");
    expect(config).toContain("\"dispatch/research\"");
    expect(config).toContain("\"thinkingDefault\": \"high\"");
    expect(config).toContain("\"compaction\"");
    expect(config).toContain("\"controlUi\": {\n      \"enabled\": true");
    expect(config).toContain("\"memorySearch\"");
    expect(config).toContain("\"extraPaths\": [\n          \"initiatives\"\n        ]");
    expect(config).toContain("\"provider\": \"local\"");
    expect(config).toContain("embeddinggemma-300m-qat-Q8_0.gguf");
    expect(config).toContain("\"id\": \"ceo\"");
    expect(config).toContain("\"token\": \"__OPENCLAW_GATEWAY_TOKEN__\"");
    expect(config).toContain("\"token\": \"__OPENCLAW_HOOK_TOKEN__\"");
    expect(config).not.toContain("\"model\": {\n    \"primary\"");
    expect(stageUnit).toContain("sync-runtime-workspace.sh stage");
    expect(stageUnit).toContain("resolve-openclaw-bin.sh /opt/revenue-os");
    expect(stageUnit).toContain("\"$OPENCLAW_BIN\" gateway");
  });
});
