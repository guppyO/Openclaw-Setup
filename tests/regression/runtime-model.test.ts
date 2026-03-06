import { buildDefaultModelProbe } from "../../services/runtime-model/index.js";

describe("runtime model policy", () => {
  test("keeps GPT-5.4 as the strategic target and docs-only fallback for OpenClaw when absent", () => {
    const probe = buildDefaultModelProbe();

    expect(probe.strategicTarget).toBe("gpt-5.4");
    expect(probe.openClawPrimary).toBe("openai-codex/gpt-5.3-codex");
    expect(probe.aliases.find((alias) => alias.alias === "openclaw.model.primary_frontier")?.status).toBe("docs-only");
  });
});
