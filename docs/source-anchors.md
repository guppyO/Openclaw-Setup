# Source Anchors

Official pages used to verify runtime assumptions.

| Id | Domain | Source | Purpose | Last method | Status |
| --- | --- | --- | --- | --- | --- |
| openai-gpt-5.4-model | openai | [OpenAI API docs: GPT-5.4 Pro](https://developers.openai.com/api/docs/models/gpt-5.4-pro) | Verify GPT-5.4 frontier positioning, model controls, and the 1.05M context window claim. | direct-fetch | 200 |
| openai-pro-plan | openai | [OpenAI Help: ChatGPT Pro](https://help.openai.com/en/articles/9793128-what-is-chatgpt-pro) | Verify Pro plan GPT access wording and guardrail language. | ua-fetch-fallback | 403 |
| openai-business-limits | openai | [OpenAI Help: ChatGPT Business models and limits](https://help.openai.com/en/articles/12003714-chatgpt-business-models-limits) | Verify Business plan limits and current ChatGPT model availability framing. | ua-fetch-fallback | 403 |
| openai-codex-plan | openai | [OpenAI Help: Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) | Verify Codex sign-in, plan-backed access, current usage windows, and currently advertised Codex defaults. | ua-fetch-fallback | 403 |
| openai-codex-upgrades | openai | [OpenAI blog: Introducing upgrades to Codex](https://openai.com/index/introducing-upgrades-to-codex/) | Verify Codex availability surfaces and the current Codex-native model naming in public OpenAI docs. | ua-fetch-fallback | 403 |
| openai-codex-app | openai | [OpenAI blog: Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/) | Verify app availability, Windows support, and continuous background automation direction. | ua-fetch-fallback | 403 |
| openai-model-release-notes | openai | [OpenAI Help: Model release notes](https://help.openai.com/en/articles/9624314-model-release-notes) | Verify current OpenAI model family positioning and stale-model assumptions. | ua-fetch-fallback | 403 |
| openclaw-model-providers | openclaw | [OpenClaw docs: Model providers](https://docs.openclaw.ai/concepts/model-providers) | Verify Codex OAuth support and the current public provider-model examples. | direct-fetch | 200 |
| openclaw-multi-agent | openclaw | [OpenClaw docs: Multi-agent routing](https://docs.openclaw.ai/concepts/multi-agent) | Verify per-agent isolation, workspaces, and agentDir behavior. | direct-fetch | 200 |
| openclaw-multiple-gateways | openclaw | [OpenClaw docs: Multiple gateways](https://docs.openclaw.ai/gateway/multiple-gateways) | Verify single-gateway guidance and isolation requirements. | direct-fetch | 200 |
| openclaw-cron-vs-heartbeat | openclaw | [OpenClaw docs: Cron vs Heartbeat](https://docs.openclaw.ai/automation/cron-vs-heartbeat) | Verify how heartbeat and cron should be combined. | direct-fetch | 200 |
| openclaw-memory | openclaw | [OpenClaw docs: Memory](https://docs.openclaw.ai/concepts/memory) | Verify Markdown memory, QMD support, and embedding limitations under Codex OAuth. | direct-fetch | 200 |
| openclaw-browser | openclaw | [OpenClaw docs: Browser](https://docs.openclaw.ai/tools/browser) | Verify managed browser, extension relay, headless support, and browser security posture. | direct-fetch | 200 |
| openclaw-browser-login | openclaw | [OpenClaw docs: Browser login](https://docs.openclaw.ai/tools/browser-login) | Verify attached/manual-login guidance for authenticated sites. | direct-fetch | 200 |
| openclaw-configuration | openclaw | [OpenClaw docs: Configuration reference](https://docs.openclaw.ai/gateway/configuration-reference) | Verify strict config requirements such as gateway.mode and other current startup fields. | direct-fetch | 200 |
| openclaw-remote-access | openclaw | [OpenClaw docs: Remote access](https://docs.openclaw.ai/guides/ssh-tunnel) | Verify loopback-bound gateways, Tailscale or SSH tunnel patterns, and remote control access. | search-backed | 404 |
| openclaw-nodes | openclaw | [OpenClaw docs: Nodes](https://docs.openclaw.ai/gateway/nodes/local-network) | Verify node-host requirements when browsers or local machines connect to a remote gateway. | search-backed | 404 |
| openclaw-secrets | openclaw | [OpenClaw docs: Secrets management](https://docs.openclaw.ai/gateway/secrets) | Verify SecretRef coverage and supported secret-bearing fields. | direct-fetch | 200 |
| openclaw-pdf | openclaw | [OpenClaw docs: PDF tool](https://docs.openclaw.ai/tools/pdf) | Verify first-class PDF tool availability. | direct-fetch | 200 |
| openclaw-security | openclaw | [OpenClaw docs: Security](https://docs.openclaw.ai/gateway/security) | Verify skills, plugins, and trusted-code warnings. | direct-fetch | 200 |
| openclaw-faq | openclaw | [OpenClaw docs: FAQ](https://docs.openclaw.ai/help/faq) | Verify headless browser tradeoffs and update automation guidance. | direct-fetch | 200 |
| openclaw-cli | openclaw | [OpenClaw docs: CLI reference](https://docs.openclaw.ai/cli) | Verify Node runtime guidance and CLI commands for gateway install and status. | direct-fetch | 200 |
| wise-security-access | wise | [Wise docs: Security & Access](https://docs.wise.com/api-docs/features/authentication-access/personal-tokens) | Verify personal-token and OAuth 2.0 auth split plus PSD2 limitations. | direct-fetch | 200 |
| wise-personal-tokens | wise | [Wise docs: Personal Tokens](https://docs.wise.com/api-docs/guides/personal-tokens) | Verify personal-token restrictions for EU or UK users. | direct-fetch | 200 |
| wise-getting-started | wise | [Wise docs: Getting started](https://docs.wise.com/guides/developer) | Verify partner-credential expectations and auth guidance. | direct-fetch | 200 |
| steel-sessions-overview | steel | [Steel docs: Sessions API overview](https://docs.steel.dev/overview/sessions-api/overview) | Verify session lifecycle, persistence, and browser fleet capabilities. | direct-fetch | 200 |
| steel-quickstart | steel | [Steel docs: Sessions API quickstart](https://docs.steel.dev/overview/sessions-api/quickstart) | Verify session create or release flow and API key requirements. | direct-fetch | 200 |
| steel-profiles | steel | [Steel docs: Profiles API overview](https://docs.steel.dev/overview/profiles-api/overview) | Verify profile-backed auth state and persistent browser profile capabilities. | direct-fetch | 200 |
| steel-credentials | steel | [Steel docs: Credentials API overview](https://docs.steel.dev/overview/credentials-api/overview) | Verify Steel Cloud credential storage and injection boundaries. | direct-fetch | 200 |
| steel-local-vs-cloud | steel | [Steel docs: Steel Local vs Steel Cloud](https://docs.steel.dev/overview/self-hosting/steel-local-vs-steel-cloud) | Verify current feature differences between Steel Cloud and Steel Local or self-hosted mode. | direct-fetch | 200 |
