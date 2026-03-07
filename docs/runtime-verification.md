# Runtime Verification

Generated against official OpenAI, OpenClaw, Wise, and Steel sources on 2026-03-07.

## Summary

- Verified anchors: 7
- Drifted anchors: 0
- Pending runtime checks: 11
- Unsupported anchors: 0
- Source capture methods: direct-fetch: 22, ua-fetch-fallback: 6, search-backed: 2

## Anchor status

| Anchor | Status | Checked | Notes |
| --- | --- | --- | --- |
| anchor-1 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openai-pro-plan:ua-fetch-fallback, openai-business-limits:ua-fetch-fallback. |
| anchor-2 | pending-runtime-check | 2026-03-07 | The latest GPT-5.4 Pro page loads, but a real rendered or browser-backed confirmation is still needed to restate the frontier or 1.05M wording precisely. Methods: openai-gpt-5.4-model:direct-fetch. |
| anchor-3 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openai-gpt-5.4-model:direct-fetch, openai-codex-plan:ua-fetch-fallback, openai-codex-upgrades:ua-fetch-fallback, openai-codex-app:ua-fetch-fallback. |
| anchor-4 | pending-runtime-check | 2026-03-07 | The provider docs still need a clearer rendered read before restating the exact compatibility fallback assumptions automatically. Methods: openclaw-model-providers:direct-fetch, openai-gpt-5.4-model:direct-fetch. |
| anchor-5 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openai-codex-plan:ua-fetch-fallback, openai-codex-upgrades:ua-fetch-fallback. |
| anchor-6 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openai-codex-plan:ua-fetch-fallback. |
| anchor-7 | verified | 2026-03-07 | OpenClaw provider docs still explicitly document OpenAI Codex OAuth support. Methods: openclaw-model-providers:direct-fetch. |
| anchor-8 | pending-runtime-check | 2026-03-07 | The current CLI docs could not be parsed cleanly enough to restate the Node-versus-Bun guidance automatically. Methods: openclaw-cli:direct-fetch. |
| anchor-9 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openclaw-multiple-gateways:direct-fetch, openclaw-remote-access:search-backed, openclaw-nodes:search-backed. |
| anchor-10 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openclaw-cron-vs-heartbeat:direct-fetch, openclaw-nodes:search-backed. |
| anchor-11 | verified | 2026-03-07 | The latest memory docs still show Markdown-first memory and separate embedding requirements. Methods: openclaw-memory:direct-fetch. |
| anchor-12 | verified | 2026-03-07 | The memory docs still advertise QMD and local-first search options. Methods: openclaw-memory:direct-fetch. |
| anchor-13 | verified | 2026-03-07 | OpenClaw security guidance still treats skills and plugins as trusted-code or supply-chain risk surfaces. Methods: openclaw-security:direct-fetch, openclaw-secrets:direct-fetch. |
| anchor-14 | verified | 2026-03-07 | Current OpenClaw docs still expose config requirements, broader secret coverage, and PDF tooling. Methods: openclaw-configuration:direct-fetch, openclaw-secrets:direct-fetch, openclaw-pdf:direct-fetch. |
| anchor-15 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openclaw-browser:direct-fetch, openclaw-browser-login:direct-fetch, openclaw-nodes:search-backed, openclaw-faq:direct-fetch. |
| anchor-16 | pending-runtime-check | 2026-03-07 | The latest FAQ needs a human confirmation of the self-update guidance. Methods: openclaw-faq:direct-fetch. |
| anchor-17 | verified | 2026-03-07 | Current Wise docs still separate personal-token and OAuth realities and preserve PSD2 constraints. Methods: wise-security-access:direct-fetch, wise-personal-tokens:direct-fetch, wise-getting-started:direct-fetch. |
| anchor-18 | verified | 2026-03-07 | Current Steel docs still distinguish Cloud from Local and separate credential or profile capabilities accordingly. Methods: steel-sessions-overview:direct-fetch, steel-profiles:direct-fetch, steel-credentials:direct-fetch, steel-local-vs-cloud:direct-fetch. |

## Build implications

- Keep GPT-5.4 as the strategic frontier target for substantive work, but separate that policy from Codex-surface model naming until runtime proves the live route.
- Keep OpenClaw provider identifiers behind aliases because public provider docs can lag frontier OpenAI model pages.
- Treat `ua-fetch-fallback` and `search-backed` source captures as advisory; they do not replace direct fetch or a real browser-produced artifact.
- Keep real browser-backed refresh available because some OpenAI pages still return HTTP 403 to plain fetches.
- Keep Wise and Steel modes runtime-probed; neither surface should be treated as fully live from config strings alone.
