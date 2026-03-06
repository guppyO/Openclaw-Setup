---
name: browser-login-runbook
description: "Handle authenticated browser workflows safely. Use when Revenue OS needs to check session health, choose managed vs attached browser mode, record login blockers, or capture evidence from authenticated pages without guessing."
---

# Browser Login Runbook

Choose the safest browser path before touching an authenticated page.

## Decision rules

1. Use managed browser for commodity research and low-trust flows.
2. Use attached Chrome relay for existing sessions, sensitive account pages, or sites that reject headless mode.
3. Record which mode was used, whether the session was fresh, and where evidence was stored.
4. If login fails, write the exact step that failed and continue other work instead of looping blindly.

## Output

- chosen browser mode,
- session-health status,
- captured evidence path,
- remaining blocker if manual action is still required.
