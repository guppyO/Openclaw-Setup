# Runtime Verification

Generated against official OpenAI, OpenClaw, Wise, and Steel sources on 2026-03-06.

## Summary

- Verified anchors: 11
- Drifted anchors: 2
- Pending runtime checks: 5
- Unsupported anchors: 0
- Source capture methods: direct-fetch: 18, browser-capture: 8, search-backed: 4

## Anchor status

| Anchor | Status | Checked | Notes |
| --- | --- | --- | --- |
| anchor-1 | verified | 2026-03-06 | Official plan docs still frame GPT-5 access in ChatGPT as unlimited or effectively unlimited subject to abuse guardrails. Methods: openai-pro-plan:browser-capture, openai-business-limits:browser-capture. |
| anchor-2 | drifted | 2026-03-06 | The latest GPT-5.4 model page no longer exposes the earlier frontier or 1.05M context wording clearly enough to keep the old anchor unchanged. Methods: openai-gpt-5.4-model:direct-fetch. |
| anchor-3 | drifted | 2026-03-06 | Codex-facing docs still emphasize GPT-5-Codex or GPT-5.3-Codex rather than proving GPT-5.4 as the universal Codex default. Methods: openai-codex-upgrades:browser-capture, openai-gpt-5.3-codex:browser-capture, openai-gpt-5.4-model:direct-fetch. |
| anchor-4 | verified | 2026-03-06 | Current Codex-native docs still center GPT-5.3-Codex or GPT-5-Codex on the Codex surface. Methods: openai-gpt-5.3-codex:browser-capture, openai-gpt-5.4-model:direct-fetch. |
| anchor-5 | verified | 2026-03-06 | Current Codex docs still support ChatGPT sign-in and plan-based access. Methods: openai-codex-plan:browser-capture, openai-codex-upgrades:browser-capture. |
| anchor-6 | pending-runtime-check | 2026-03-06 | The current Codex plan article could not be parsed cleanly enough to restate the present local-window numbers automatically. Methods: openai-codex-plan:browser-capture. |
| anchor-7 | verified | 2026-03-06 | OpenClaw provider docs still explicitly document OpenAI Codex OAuth support. Methods: openclaw-model-providers:direct-fetch. |
| anchor-8 | pending-runtime-check | 2026-03-06 | The current CLI docs could not be parsed cleanly enough to restate the Node-versus-Bun guidance automatically. Methods: openclaw-cli:direct-fetch. |
| anchor-9 | pending-runtime-check | 2026-03-06 | The single-gateway guidance needs a human check because the latest pages did not expose the wording clearly enough. Methods: openclaw-multiple-gateways:direct-fetch, openclaw-faq:direct-fetch. |
| anchor-10 | verified | 2026-03-06 | The latest automation docs still distinguish cron from heartbeat and recommend using both together. Methods: openclaw-cron-vs-heartbeat:direct-fetch. |
| anchor-11 | verified | 2026-03-06 | The latest memory docs still show Markdown-first memory and separate embedding requirements. Methods: openclaw-memory:direct-fetch. |
| anchor-12 | verified | 2026-03-06 | The memory docs still advertise local-first memory search options such as QMD or local embeddings. Methods: openclaw-memory:direct-fetch. |
| anchor-13 | verified | 2026-03-06 | OpenClaw security guidance still treats skills and plugins as trusted-code or supply-chain risk surfaces. Methods: openclaw-security:direct-fetch, openclaw-secrets:direct-fetch. |
| anchor-14 | verified | 2026-03-06 | Current OpenClaw docs still expose config validation or doctor-style checks, broader secret coverage, and PDF tooling. Methods: openclaw-configuration:direct-fetch, openclaw-secrets:direct-fetch, openclaw-pdf:direct-fetch. |
| anchor-15 | verified | 2026-03-06 | The browser docs still cover managed browsing, attached Chrome, and headless tradeoffs. Methods: openclaw-browser:direct-fetch, openclaw-faq:direct-fetch, openclaw-browser-login:direct-fetch. |
| anchor-16 | pending-runtime-check | 2026-03-06 | The latest FAQ needs a human confirmation of the self-update guidance. Methods: openclaw-faq:direct-fetch. |
| anchor-17 | verified | 2026-03-06 | Current Wise docs still separate personal-token and OAuth realities and preserve PSD2 constraints. Methods: wise-security-access:direct-fetch, wise-personal-tokens:direct-fetch, wise-getting-started:direct-fetch. |
| anchor-18 | pending-runtime-check | 2026-03-06 | The latest release notes need a human review before restating the GPT-4.5 deprecation claim. Methods: openai-model-release-notes:browser-capture, openai-gpt-5.4-model:direct-fetch. |

## Build implications

- Keep GPT-5.4 as the strategic default for Codex-facing surfaces.
- Keep OpenClaw model identifiers behind aliases because public provider docs may still lag the frontier ChatGPT or API route.
- Treat search-backed source captures as advisory; they should not silently replace official-page verification.
- Keep browser-backed refresh available because some OpenAI pages still return 403 to plain fetches.
- Keep Wise and Steel modes runtime-probed; neither surface should be treated as fully live from config strings alone.
