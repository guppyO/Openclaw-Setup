# Runtime Verification

Generated against official OpenAI, OpenClaw, Wise, and Steel sources on 2026-03-07.

## Summary

- Verified anchors: 15
- Drifted anchors: 0
- Pending runtime checks: 3
- Unsupported anchors: 0
- Source capture methods: direct-fetch: 26, ua-fetch-fallback: 4

## Anchor status

| Anchor | Status | Checked | Notes |
| --- | --- | --- | --- |
| anchor-1 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openai-pro-plan:ua-fetch-fallback, openai-business-limits:ua-fetch-fallback. |
| anchor-2 | verified | 2026-03-07 | The latest frontier model page still documents GPT-5.4 Pro and the 1.05M context window. Methods: openai-gpt-5.4-model:direct-fetch. |
| anchor-3 | verified | 2026-03-07 | Official frontier-model and Codex docs can be represented separately: GPT-5.4 stays the strategic frontier target while OpenClaw provider-model promotion remains a separate runtime-probed fact. Methods: openai-gpt-5.4-model:direct-fetch, openai-codex-upgrades:direct-fetch. |
| anchor-4 | verified | 2026-03-07 | OpenClaw provider docs still expose Codex-provider example models that can lag the frontier OpenAI model page. Methods: openclaw-model-providers:direct-fetch, openai-gpt-5.4-model:direct-fetch. |
| anchor-5 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openai-codex-plan:ua-fetch-fallback, openai-codex-upgrades:direct-fetch. |
| anchor-6 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openai-codex-plan:ua-fetch-fallback. |
| anchor-7 | verified | 2026-03-07 | OpenClaw provider docs still explicitly document OpenAI Codex OAuth support. Methods: openclaw-model-providers:direct-fetch. |
| anchor-8 | verified | 2026-03-07 | The current OpenClaw CLI docs still prefer Node and warn against Bun for stable gateways. Methods: openclaw-cli:direct-fetch. |
| anchor-9 | verified | 2026-03-07 | OpenClaw docs still recommend one primary gateway with secure remote access and remote nodes where needed. Methods: openclaw-multiple-gateways:direct-fetch, openclaw-remote-access:direct-fetch, openclaw-nodes:direct-fetch. |
| anchor-10 | verified | 2026-03-07 | The latest automation docs still distinguish cron from heartbeat and support wake-style continuation flows. Methods: openclaw-cron-vs-heartbeat:direct-fetch, openclaw-nodes:direct-fetch. |
| anchor-11 | verified | 2026-03-07 | The latest memory docs still show Markdown-first memory and separate embedding requirements. Methods: openclaw-memory:direct-fetch. |
| anchor-12 | verified | 2026-03-07 | The memory docs still advertise QMD and local-first search options. Methods: openclaw-memory:direct-fetch. |
| anchor-13 | verified | 2026-03-07 | OpenClaw security guidance still treats skills and plugins as trusted-code or supply-chain risk surfaces. Methods: openclaw-security:direct-fetch, openclaw-secrets:direct-fetch. |
| anchor-14 | verified | 2026-03-07 | Current OpenClaw docs still expose config requirements, broader secret coverage, and PDF tooling. Methods: openclaw-configuration:direct-fetch, openclaw-secrets:direct-fetch, openclaw-pdf:direct-fetch. |
| anchor-15 | verified | 2026-03-07 | The browser docs still cover managed browsing, attached Chrome, remote nodes, and headless tradeoffs. Methods: openclaw-browser:direct-fetch, openclaw-browser-login:direct-fetch, openclaw-nodes:direct-fetch, openclaw-faq:direct-fetch. |
| anchor-16 | verified | 2026-03-07 | The current FAQ still treats self-update as possible but not the preferred operating pattern. Methods: openclaw-faq:direct-fetch. |
| anchor-17 | verified | 2026-03-07 | Current Wise docs still separate personal-token and OAuth realities and preserve PSD2 constraints. Methods: wise-security-access:direct-fetch, wise-personal-tokens:direct-fetch, wise-getting-started:direct-fetch. |
| anchor-18 | verified | 2026-03-07 | Current Steel docs still distinguish Cloud from Local and separate credential or profile capabilities accordingly. Methods: steel-sessions-overview:direct-fetch, steel-profiles:direct-fetch, steel-credentials:direct-fetch, steel-local-vs-cloud:direct-fetch. |

## Build implications

- Keep GPT-5.4 as the strategic frontier target for substantive work; official OpenAI Codex docs already support that policy even when OpenClaw provider-model promotion still waits on live gateway proof.
- Keep OpenClaw provider identifiers behind aliases because public provider docs can lag frontier OpenAI model pages.
- Treat `ua-fetch-fallback` and `search-backed` source captures as advisory; they do not replace direct fetch or a real browser-produced artifact.
- Keep real browser-backed refresh available because some OpenAI pages still return HTTP 403 to plain fetches.
- Keep Wise and Steel modes runtime-probed; neither surface should be treated as fully live from config strings alone.
