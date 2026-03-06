# Runtime Model Policy

Generated on 2026-03-06T20:02:34.312Z.

## Strategic defaults

- Company-level target: `gpt-5.4`
- Codex CLI installed: yes
- OpenClaw installed on this host: no
- Probe mode: passive

## Alias map

| Alias | Resolved model | Reasoning | Status | Surface |
| --- | --- | --- | --- | --- |
| model.primary_frontier | gpt-5.4 | high | preferred | codex-cli |
| model.frontier_browser | gpt-5.4 | high | preferred | codex-cli |
| model.frontier_research | gpt-5.4 | xhigh | preferred | codex-cli |
| model.frontier_build | gpt-5.4 | high | preferred | codex-cli |
| openclaw.model.primary_frontier | openai-codex/gpt-5.3-codex | high | docs-only | source-fallback |

## OpenClaw routing

- Primary provider model: `openai-codex/gpt-5.3-codex`
- Fallback provider model: `openai-codex/gpt-5-codex`

## Drift

- OpenClaw is not installed on this host, so provider-model support is inferred from official docs instead of a live gateway probe.

## Policy rules

- Use GPT-5.4 for substantive work on Codex-facing surfaces by default.
- Keep OpenClaw on the strongest verified provider string and auto-flip back to GPT-5.4-compatible provider identifiers when runtime and official sources both support them.
- Use high reasoning by default and xhigh for architecture, policy-sensitive research, major debugging, and capital allocation decisions.
