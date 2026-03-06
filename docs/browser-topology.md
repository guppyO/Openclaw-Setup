# Browser Topology

## Lanes

1. OpenClaw managed browser
   - Default lane for typed browser work and low-trust research.
   - Headless in prod by default.

2. Attached Chrome relay on Windows
   - Use for live-auth, anti-bot-sensitive, and operator-visible flows.
   - Pair once with `OPENCLAW_GATEWAY_TOKEN`, then mark the local env with `OPENCLAW_CHROME_RELAY_STATUS=paired`.

3. Steel browser tier
   - Use for persistent, parallel, namespace-isolated browser work.
   - Supported modes are explicit:
     - `STEEL_MODE=cloud` with `STEEL_API_KEY`
     - `STEEL_MODE=self-hosted` with `STEEL_BASE_URL` plus `STEEL_SELF_HOSTED_TOKEN` or `STEEL_API_KEY`
   - Routes include `clean_research`, `company_signup_identity`, `gmail_primary`, `wise_primary`, `hetzner_primary`, and `marketplace_generic`.

## Routing policy

- Public and low-trust browsing defaults to OpenClaw managed browsing.
- Public parallel or persistent browsing prefers Steel when the Steel lane is ready.
- Company signup flows prefer Steel for persistence and namespace hygiene, unless attached Chrome is explicitly needed for operator-visible or stubborn flows.
- Treasury and infrastructure tasks prefer dedicated Steel namespaces when available.
- Attached Chrome is reserved for explicit high-trust, live-auth, or operator-visible tasks, not as the generic fallback for every sensitive page.

## Current commands

- Refresh broker state: `npm run runtime:browser-broker`
- Bootstrap Steel env usage: `bash scripts/bootstrap/bootstrap-steel.sh`
- Pair attached Chrome: use the OpenClaw extension or relay flow, supply `OPENCLAW_GATEWAY_TOKEN`, set `OPENCLAW_CHROME_RELAY_STATUS=paired`, then rerun the broker snapshot.
