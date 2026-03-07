# OpenClaw GPT-5.4 Runtime Delta

Checked on 2026-03-07 against the official OpenClaw repo and docs.

## Relevant merged changes

- PR `36590`: merged GPT-5.4 Codex OAuth support and default-model routing updates.
- PR `36905`: merged reasoning-model defaults moving toward GPT-5.4.
- PR `36929`: merged xhigh or service-tier support relevant to high-thinking runs.
- PR `36966`: merged related provider or model-routing updates in the same support window.

## Operating implication

- The repo should treat `openai-codex/gpt-5.4` as the intended OpenClaw runtime route today.
- The repo should stop silently pinning the gateway to `openai-codex/gpt-5.3-codex` as a standing default.
- GPT-5.4 Pro remains the deep-thinking target where a surface exposes it directly.
- OpenClaw still needs a live authenticated probe on the target gateway before claiming the deployed provider string is proven on that host.

## Repo action

- Prefer `GPT-5.4` with `high` as the routine company default.
- Prefer `GPT-5.4 Pro` with `xhigh` on the deepest available Codex-facing surfaces.
- Keep the control plane on `openai-codex/gpt-5.4` and fail fast on incompatibility instead of silently downshifting to older families.
