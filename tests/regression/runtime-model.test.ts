import { buildDefaultModelProbe } from "../../services/runtime-model/index.js";

describe("runtime model policy", () => {
  test("keeps GPT-5.4 as the strategic target while separating docs truth from provider lag", () => {
    const probe = buildDefaultModelProbe();

    expect(probe.strategicTarget).toBe("gpt-5.4");
    expect(probe.officialFrontierModel).toBe("gpt-5.4");
    expect(probe.officialCodexDocsStatus).toBe("mixed");
    expect(probe.provisional).toBe(true);
    expect(probe.codexCliInstalled).toBe(false);
    expect(probe.openClawPrimary).toBe("openai-codex/gpt-5.3-codex");
    expect(probe.openClawProbeSource).toBe("docs-only");
    expect(probe.aliases.find((alias) => alias.alias === "openclaw.model.primary_frontier")?.status).toBe("docs-only");
    expect(probe.aliases.find((alias) => alias.alias === "model.primary_frontier")?.status).toBe("candidate");
  });
});
