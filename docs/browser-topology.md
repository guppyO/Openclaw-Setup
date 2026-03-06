# Browser Topology

## Lanes

1. OpenClaw managed browser
   - Default lane for typed browser work and low-trust research.
   - Headless in prod by default.

2. Attached Chrome relay on Windows
   - Use for live-auth, anti-bot-sensitive, and operator-visible flows.
   - Pair once and mark the local env with `OPENCLAW_CHROME_RELAY_STATUS=paired`.

3. Steel browser tier
   - Use for persistent, parallel, namespace-isolated browser work.
   - Routes include `clean_research`, `company_signup_identity`, `gmail_primary`, `wise_primary`, `hetzner_primary`, and `marketplace_generic`.

## Routing policy

- Public and low-trust work defaults to OpenClaw managed browsing.
- High-trust or visible work prefers attached Chrome when paired.
- Persistent or parallel work prefers Steel when configured.
- Treasury and infrastructure browser tasks default to dedicated Steel namespaces when available.

## Current commands

- Refresh broker state: `npm run runtime:browser-broker`
- Bootstrap Steel env usage: `bash scripts/bootstrap/bootstrap-steel.sh`
- Pair attached Chrome: use the OpenClaw extension flow, then set `OPENCLAW_CHROME_RELAY_STATUS=paired` and rerun the broker snapshot.
