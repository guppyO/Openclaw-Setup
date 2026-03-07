import { buildDefaultModelProbe } from "../../services/runtime-model/index.js";

describe("runtime model policy", () => {
  test("keeps GPT-5.4 and GPT-5.4 Pro as the strategic targets while preferring GPT-5.4 on OpenClaw", () => {
    const probe = buildDefaultModelProbe();

    expect(probe.strategicTarget).toBe("gpt-5.4");
    expect(probe.deepThinkingTarget).toBe("gpt-5.4-pro");
    expect(probe.officialFrontierModel).toBe("gpt-5.4-pro");
    expect(probe.officialGeneralModel).toBe("gpt-5.4");
    expect(probe.officialCodexDocsStatus).toBe("verified");
    expect(probe.provisional).toBe(true);
    expect(probe.codexCliInstalled).toBe(false);
    expect(probe.openClawPrimary).toBe("openai-codex/gpt-5.4");
    expect(probe.openClawDeep).toBe("openai-codex/gpt-5.4-pro");
    expect(probe.openClawProbeSource).toBe("docs-only");
    expect(probe.openClawFallback).toBe("openai-codex/gpt-5.4");
    expect(probe.aliases.find((alias) => alias.alias === "openclaw.model.primary_frontier")?.resolvedModel).toBe("openai-codex/gpt-5.4");
    expect(probe.aliases.find((alias) => alias.alias === "model.frontier_deep")?.resolvedModel).toBe("gpt-5.4-pro");
    expect(probe.aliases.find((alias) => alias.alias === "openclaw.model.frontier_deep")?.resolvedModel).toBe("openai-codex/gpt-5.4-pro");
    expect(probe.aliases.find((alias) => alias.alias === "model.primary_frontier")?.status).toBe("candidate");
  });
});
