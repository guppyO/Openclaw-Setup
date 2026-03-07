# Runtime Model Policy

Generated on 2026-03-07T23:01:19.228Z.

## Strategic defaults

- Company-level target: `gpt-5.4`
- Deep-thinking target: `gpt-5.4-pro`
- Official frontier model page: `gpt-5.4-pro`
- Official general model route: `gpt-5.4`
- Official Codex docs state: verified
- Provisional artifact: no
- Codex CLI installed: yes
- OpenClaw installed on this host: yes
- Probe mode: active

## Alias map

| Alias | Resolved model | Reasoning | Status | Surface |
| --- | --- | --- | --- | --- |
| model.primary_frontier | gpt-5.4 | high | preferred | codex-cli |
| model.frontier_deep | gpt-5.4 | xhigh | fallback | codex-cli |
| model.frontier_browser | gpt-5.4 | high | preferred | codex-cli |
| model.frontier_research | gpt-5.4 | xhigh | fallback | codex-cli |
| model.frontier_build | gpt-5.4 | high | preferred | codex-cli |
| openclaw.model.primary_frontier | openai-codex/gpt-5.4 | high | preferred | openclaw |
| openclaw.model.frontier_deep | openai-codex/gpt-5.4 | xhigh | fallback | openclaw |

## OpenClaw routing

- Primary provider model: `openai-codex/gpt-5.4`
- Deep provider model: `openai-codex/gpt-5.4`
- Fallback provider model: `openai-codex/gpt-5.4`
- Probe source: live-gateway
- Live verified provider candidates: openai-codex/gpt-5.4

## Drift

- GPT-5.4 Pro is not supported when using Codex with a ChatGPT account on this host; the supportable deep Codex route remains GPT-5.4 with xhigh reasoning.

## Policy rules

- Use GPT-5.4 with high reasoning for substantive work by default.
- Prefer GPT-5.4 Pro with xhigh reasoning for the deepest available surfaces.
- Treat official OpenAI model docs, official Codex docs, merged OpenClaw upstream support, and live OpenClaw provider proof as separate truths.
- Keep GPT-5.4 as the intended OpenClaw route, but if the live authenticated provider still exposes an older Codex model, use the strongest verified provider candidate on that host until the provider catches up.
- Use high reasoning by default and xhigh for architecture, policy-sensitive research, major debugging, and capital allocation decisions.
