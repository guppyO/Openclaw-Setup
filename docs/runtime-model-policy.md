# Runtime Model Policy

Generated on 2026-03-07T06:56:11.640Z.

## Strategic defaults

- Company-level target: `gpt-5.4`
- Deep-thinking target: `gpt-5.4-pro`
- Official frontier model page: `gpt-5.4-pro`
- Official general model route: `gpt-5.4`
- Official Codex docs state: verified
- Provisional artifact: no
- Codex CLI installed: yes
- OpenClaw installed on this host: yes
- Probe mode: passive

## Alias map

| Alias | Resolved model | Reasoning | Status | Surface |
| --- | --- | --- | --- | --- |
| model.primary_frontier | gpt-5.4 | high | preferred | codex-cli |
| model.frontier_deep | gpt-5.4-pro | xhigh | candidate | codex-cli |
| model.frontier_browser | gpt-5.4 | high | preferred | codex-cli |
| model.frontier_research | gpt-5.4-pro | xhigh | candidate | codex-cli |
| model.frontier_build | gpt-5.4 | high | preferred | codex-cli |
| openclaw.model.primary_frontier | openai-codex/gpt-5.4 | high | candidate | source-fallback |
| openclaw.model.frontier_deep | openai-codex/gpt-5.4-pro | xhigh | candidate | source-fallback |

## OpenClaw routing

- Primary provider model: `openai-codex/gpt-5.4`
- Deep provider model: `openai-codex/gpt-5.4-pro`
- Fallback provider model: `openai-codex/gpt-5.4`
- Probe source: docs-only
- Live verified provider candidates: none yet

## Drift

- OpenClaw is installed, but only passive evidence is available on this host; run an active gateway probe after auth to confirm GPT-5.4 provider routing.

## Policy rules

- Use GPT-5.4 with high reasoning for substantive work by default.
- Prefer GPT-5.4 Pro with xhigh reasoning for the deepest available surfaces, but stay within the GPT-5.4 family instead of downshifting to older model families.
- Treat official OpenAI model docs, official Codex docs, merged OpenClaw upstream support, and live OpenClaw provider proof as separate truths.
- Keep OpenClaw configured within the GPT-5.4 family and fail fast on incompatibility instead of silently routing to weaker model families.
- Use high reasoning by default and xhigh for architecture, policy-sensitive research, major debugging, and capital allocation decisions.
