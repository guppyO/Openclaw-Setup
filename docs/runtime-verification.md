# Runtime Verification

Generated against official OpenAI, OpenClaw, Wise, and Steel sources on 2026-03-06.

## Summary

- Verified anchors: 16
- Drifted anchors: 2
- Unsupported anchors: 0

## Anchor status

| Anchor | Status | Notes |
| --- | --- | --- |
| anchor-1 | verified | Official Help Center docs confirm unlimited or virtually unlimited GPT-5 access with abuse guardrails. |
| anchor-2 | verified | The OpenAI API model page explicitly labels GPT-5.4 as the frontier model and documents the 1.05M context window. |
| anchor-3 | drifted | Current official Codex docs still center GPT-5-Codex and GPT-5.3-Codex on Codex surfaces. GPT-5.4 is documented in ChatGPT/API, but not as the universal Codex default. |
| anchor-4 | verified | The strongest current Codex-native model publicly documented by OpenAI is GPT-5.3-Codex, with GPT-5.4 documented separately for ChatGPT/API reasoning work. |
| anchor-5 | verified | OpenAI Help and blog docs explicitly describe signing in with ChatGPT and included plan access. |
| anchor-6 | drifted | The current official plan article documents roughly 300-1,500 local Pro messages per 5 hours, with task-size variance and a shared weekly limit. |
| anchor-7 | verified | OpenClaw model provider docs explicitly support `openai-codex` OAuth for external tools and workflows. |
| anchor-8 | verified | The CLI reference says gateway install defaults to Node runtime and specifically notes Bun is not recommended. |
| anchor-9 | verified | Multiple-gateway docs recommend one gateway for most setups, while FAQ/docs describe remote nodes and tailnet access for distributed control. |
| anchor-10 | verified | OpenClaw's Cron vs Heartbeat guide explicitly recommends using both together. |
| anchor-11 | verified | The memory docs explicitly say Markdown files are the source of truth and Codex OAuth does not cover embeddings. |
| anchor-12 | verified | The memory docs explicitly document the experimental QMD backend and local embedding mode. |
| anchor-13 | verified | OpenClaw security and skills docs explicitly warn that plugins are trusted code and third-party skills should be treated as untrusted code. |
| anchor-14 | verified | Current configuration, secrets, and PDF docs confirm all three. The exact command in docs is `openclaw doctor`, not a documented `openclaw config validate --json` entry. |
| anchor-15 | verified | Browser docs cover the managed browser and extension relay; FAQ documents headless mode and anti-bot risk. |
| anchor-16 | verified | The FAQ explicitly says asking OpenClaw to update itself is possible but not recommended. |
| anchor-17 | verified | Wise docs explicitly distinguish small-business personal tokens from partner OAuth 2.0 and call out EU/UK PSD2 limits. |
| anchor-18 | verified | OpenAI model docs and retirement notes show GPT-4.5 preview is deprecated while GPT-5.4 is current. |

## Build implications

- Prefer GPT-5.4 for strategic reasoning surfaces that officially expose it.
- Keep Codex/OpenClaw model identifiers configurable because the current OpenClaw docs still center GPT-5-Codex and GPT-5.3-Codex.
- Treat Codex usage ceilings as moving operational constraints and batch context aggressively.
- Use QMD or another local-first memory backend because Codex OAuth does not cover embeddings.
- Probe Wise capabilities before automating any treasury action beyond read-only ingest.
- Keep Steel routing configurable because session pool, credentials, and self-hosting posture can change independently of OpenClaw.
- Some OpenAI help and blog pages currently return a bot-wall 403 to plain HTTP fetches; keep browser-backed or search-backed verification available for those sources.
