# Runtime Verification

Generated against official OpenAI, OpenClaw, Wise, and Steel sources on 2026-03-07.

## Summary

- Verified anchors: 0
- Drifted anchors: 1
- Pending runtime checks: 17
- Unsupported anchors: 0
- Source capture methods: direct-fetch: 1, browser-capture: 4, manual-unverified: 30

## Anchor status

| Anchor | Status | Checked | Notes |
| --- | --- | --- | --- |
| anchor-1 | drifted | 2026-03-07 | The latest plan pages no longer clearly support the earlier unlimited-with-guardrails phrasing. Methods: openai-pro-plan:browser-capture, openai-business-limits:browser-capture. |
| anchor-2 | pending-runtime-check | 2026-03-07 | The latest GPT-5.4 Pro page loads, but a real rendered or browser-backed confirmation is still needed to restate the frontier or 1.05M wording precisely. Methods: openai-gpt-5.4-model:direct-fetch. |
| anchor-3 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openai-gpt-5.4-model:direct-fetch, openai-codex-upgrades:manual-unverified, openclaw-changelog:manual-unverified, openclaw-pr-36905:manual-unverified. |
| anchor-4 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openclaw-model-providers:manual-unverified, openclaw-changelog:manual-unverified, openclaw-pr-36590:manual-unverified, openclaw-pr-36929:manual-unverified. |
| anchor-5 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openai-codex-plan:browser-capture, openai-codex-upgrades:manual-unverified. |
| anchor-6 | pending-runtime-check | 2026-03-07 | The current Codex plan article could not be parsed cleanly enough to restate the present usage-window numbers automatically. Methods: openai-codex-plan:browser-capture. |
| anchor-7 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openclaw-model-providers:manual-unverified. |
| anchor-8 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openclaw-cli:manual-unverified. |
| anchor-9 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openclaw-multiple-gateways:manual-unverified, openclaw-remote-access:manual-unverified, openclaw-nodes:manual-unverified. |
| anchor-10 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openclaw-cron-vs-heartbeat:manual-unverified, openclaw-nodes:manual-unverified. |
| anchor-11 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openclaw-memory:manual-unverified. |
| anchor-12 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openclaw-memory:manual-unverified. |
| anchor-13 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openclaw-security:manual-unverified, openclaw-secrets:manual-unverified. |
| anchor-14 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openclaw-configuration:manual-unverified, openclaw-secrets:manual-unverified, openclaw-pdf:manual-unverified. |
| anchor-15 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openclaw-browser:manual-unverified, openclaw-browser-login:manual-unverified, openclaw-nodes:manual-unverified, openclaw-faq:manual-unverified. |
| anchor-16 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: openclaw-faq:manual-unverified. |
| anchor-17 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: wise-security-access:manual-unverified, wise-personal-tokens:manual-unverified, wise-getting-started:manual-unverified. |
| anchor-18 | pending-runtime-check | 2026-03-07 | One or more official sources still require a real browser-backed or manual confirmation path before this anchor can be treated as fully current. Methods: steel-sessions-overview:manual-unverified, steel-profiles:manual-unverified, steel-credentials:manual-unverified, steel-local-vs-cloud:manual-unverified. |

## Build implications

- Keep GPT-5.4 as the routine frontier target and reserve GPT-5.4 Pro for the deepest surfaces that actually expose it.
- Keep OpenClaw configured for GPT-5.4 and use live gateway proof to confirm the deployed provider route instead of silently downshifting to older families.
- Treat `ua-fetch-fallback` and `search-backed` source captures as advisory; they do not replace direct fetch or a real browser-produced artifact.
- Keep real browser-backed refresh available because some OpenAI pages still return HTTP 403 to plain fetches.
- Keep Wise and Steel modes runtime-probed; neither surface should be treated as fully live from config strings alone.
