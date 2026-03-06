# Account Registry

| Account | Purpose | Auth | Status | Browser profile | Rotation |
| --- | --- | --- | --- | --- | --- |
| account-company-gmail | Primary company mailbox and signup identity | Email/password with passkey or browser login confirmation | active | gmail_primary | required |
| account-chatgpt-pro | Primary reasoning and Codex sign-in identity | ChatGPT Pro / Codex login | active | chrome_company | no |
| account-openclaw-prod | Always-on control plane gateway | Pending VPS bootstrap and openai-codex OAuth | bootstrap-required | n/a | no |
| account-wise | Treasury source of truth | Wise personal token, partner OAuth, or browser lane fallback | active | wise_primary | required |
| account-hetzner | Primary production VPS and infrastructure account | Hetzner account login plus VPS SSH or console access | active | hetzner_primary | required |
| account-browser-relay | Attached Chrome relay for high-trust sites | Chrome extension relay | bootstrap-required | chrome_company | no |
| account-steel | Scalable browser session pool for parallel web work | Steel API key with namespace-isolated session routing | bootstrap-required | n/a | no |
