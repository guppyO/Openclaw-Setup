# Source Anchors

Official pages used to verify runtime assumptions.

| Id | Domain | Source | Purpose | Last method | Status |
| --- | --- | --- | --- | --- | --- |
| openai-gpt-5.4-model | openai | [OpenAI GPT-5.4 model page](https://developers.openai.com/api/docs/models/gpt-5.4) | Verify GPT-5.4 status, context window, and reasoning controls. | direct-fetch | 200 |
| openai-chatgpt-gpt-5.4 | openai | [OpenAI Help: GPT-5.3 and GPT-5.4 in ChatGPT](https://help.openai.com/en/articles/11909943-gpt-52-in-chatgpt) | Verify current ChatGPT model availability and GPT-5.4 positioning. | browser-capture | 403 |
| openai-pro-plan | openai | [OpenAI Help: ChatGPT Pro](https://help.openai.com/en/articles/9793128-what-is-chatgpt-pro) | Verify Pro plan unlimited GPT-5 access guardrails. | browser-capture | 403 |
| openai-business-limits | openai | [OpenAI Help: ChatGPT Business models and limits](https://help.openai.com/en/articles/12003714-chatgpt-business-models-limits) | Verify Business plan limits and current default ChatGPT models. | browser-capture | 403 |
| openai-codex-plan | openai | [OpenAI Help: Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) | Verify Codex sign-in, client surfaces, and plan-based usage windows. | browser-capture | 403 |
| openai-codex-upgrades | openai | [OpenAI blog: Introducing upgrades to Codex](https://openai.com/index/introducing-upgrades-to-codex/) | Verify Codex availability surfaces and GPT-5-Codex rollout. | browser-capture | 403 |
| openai-codex-app | openai | [OpenAI blog: Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/) | Verify app availability, Windows support, and continuous background automation direction. | browser-capture | 403 |
| openai-gpt-5.3-codex | openai | [OpenAI blog: Introducing GPT-5.3-Codex](https://openai.com/index/introducing-gpt-5-3-codex/) | Verify the strongest currently documented Codex-native model. | browser-capture | 403 |
| openai-model-release-notes | openai | [OpenAI Help: Model release notes](https://help.openai.com/en/articles/9624314-model-release-notes) | Verify GPT-4.5 preview deprecation and Codex model notes. | browser-capture | 403 |
| openclaw-model-providers | openclaw | [OpenClaw docs: Model providers](https://docs.openclaw.ai/concepts/model-providers) | Verify OpenAI Codex OAuth support and documented provider/model refs. | direct-fetch | 200 |
| openclaw-multi-agent | openclaw | [OpenClaw docs: Multi-agent routing](https://docs.openclaw.ai/concepts/multi-agent) | Verify per-agent isolation, workspaces, and agentDir behavior. | direct-fetch | 200 |
| openclaw-multiple-gateways | openclaw | [OpenClaw docs: Multiple gateways](https://docs.openclaw.ai/gateway/multiple-gateways) | Verify single-gateway guidance and isolation requirements. | direct-fetch | 200 |
| openclaw-cron-vs-heartbeat | openclaw | [OpenClaw docs: Cron vs Heartbeat](https://docs.openclaw.ai/automation/cron-vs-heartbeat) | Verify how heartbeat and cron should be combined. | direct-fetch | 200 |
| openclaw-memory | openclaw | [OpenClaw docs: Memory](https://docs.openclaw.ai/concepts/memory) | Verify Markdown memory, QMD support, and embedding limitations under Codex OAuth. | direct-fetch | 200 |
| openclaw-browser | openclaw | [OpenClaw docs: Browser](https://docs.openclaw.ai/tools/browser) | Verify managed browser, extension relay, and headless support. | direct-fetch | 200 |
| openclaw-browser-login | openclaw | [OpenClaw docs: Browser login](https://docs.openclaw.ai/tools/browser-login) | Verify attached/manual-login guidance for authenticated sites. | direct-fetch | 200 |
| openclaw-configuration | openclaw | [OpenClaw docs: Configuration](https://docs.openclaw.ai/gateway/configuration) | Verify strict config validation behavior. | direct-fetch | 200 |
| openclaw-secrets | openclaw | [OpenClaw docs: Secrets management](https://docs.openclaw.ai/gateway/secrets) | Verify SecretRef coverage and supported secret-bearing fields. | direct-fetch | 200 |
| openclaw-pdf | openclaw | [OpenClaw docs: PDF tool](https://docs.openclaw.ai/tools/pdf) | Verify first-class PDF tool availability. | direct-fetch | 200 |
| openclaw-security | openclaw | [OpenClaw docs: Security](https://docs.openclaw.ai/gateway/security) | Verify skills, plugins, and trusted-code warnings. | direct-fetch | 200 |
| openclaw-faq | openclaw | [OpenClaw docs: FAQ](https://docs.openclaw.ai/help/faq) | Verify headless browser tradeoffs and update automation guidance. | direct-fetch | 200 |
| openclaw-cli | openclaw | [OpenClaw docs: CLI reference](https://docs.openclaw.ai/cli) | Verify Node runtime guidance and CLI commands for gateway install and status. | direct-fetch | 200 |
| wise-security-access | wise | [Wise docs: Security & Access](https://docs.wise.com/api-docs/features/authentication-access/personal-tokens) | Verify personal-token and OAuth 2.0 auth split plus PSD2 limitations. | direct-fetch | 200 |
| wise-personal-tokens | wise | [Wise docs: Personal Tokens](https://docs.wise.com/api-docs/guides/personal-tokens) | Verify personal-token restrictions for EU/UK users. | direct-fetch | 200 |
| wise-getting-started | wise | [Wise docs: Getting started](https://docs.wise.com/guides/developer) | Verify partner-credential expectations and auth guidance. | direct-fetch | 200 |
| steel-sessions-overview | steel | [Steel docs: Sessions API overview](https://docs.steel.dev/overview/sessions-api) | Verify Steel session lifecycle, persistence, and fleet-management capabilities. | search-backed | 404 |
| steel-quickstart | steel | [Steel docs: Quickstart](https://docs.steel.dev/overview/sessions-api/quickstart) | Verify Steel session create/release flow and API key requirements. | direct-fetch | 200 |
| steel-local-browser | steel | [Steel docs: Local Browser](https://docs.steel.dev/overview/local-browser) | Verify local or self-hosted browser deployment realities. | search-backed | 404 |
| steel-credentials | steel | [Steel docs: Credentials API](https://docs.steel.dev/overview/credentials-api) | Verify Steel credential storage and injection boundaries for authenticated browsing. | search-backed | 404 |
| steel-changelog | steel | [Steel docs: Changelog](https://docs.steel.dev/changelog/changelog) | Verify recent session, proxy, and playback changes that may affect browser operations. | search-backed | 404 |
