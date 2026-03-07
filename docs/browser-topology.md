# Browser Topology

## Lanes

1. OpenClaw managed browser
   - Default lane for typed browser work and low-trust research.
   - Headless in prod by default.
   - Never the silent fallback for treasury, infrastructure, or root-identity work.

2. Attached Chrome on Windows
   - Use for live-auth, anti-bot-sensitive, or operator-visible flows.
   - Requires all of:
     - `OPENCLAW_GATEWAY_TOKEN`
     - `OPENCLAW_CHROME_RELAY_STATUS=paired`
     - a reachable gateway path
     - a ready Windows node host when the gateway lives on the VPS

3. Steel browser tier
   - Use for persistent, parallel, namespace-isolated browser work.
   - `STEEL_MODE=cloud` can support credentials and profiles when those are actually provisioned.
   - `STEEL_MODE=self-hosted` is treated as session infrastructure only, not as an auth-ready replacement for Cloud.

## Remote path

The repo now treats SSH tunneling as the first-class Windows-to-VPS path for a loopback-bound gateway.

1. Bring up the VPS gateway on Hetzner.
2. On Windows, run `scripts/bootstrap/start-gateway-ssh-tunnel.ps1`.
3. On Windows, run `scripts/bootstrap/bootstrap-openclaw-node-host.ps1`.
4. Pair attached Chrome against the tunneled gateway URL and generated gateway token.

The tunnel script writes:

- `OPENCLAW_REMOTE_ACCESS_MODE=ssh-tunnel`
- `OPENCLAW_GATEWAY_PORT=<local forwarded port>`
- `OPENCLAW_GATEWAY_BASE_URL=http://127.0.0.1:<local forwarded port>`

The node-host script writes:

- `OPENCLAW_NODE_HOST_ID=<node name>`
- `OPENCLAW_NODE_HOST_STATUS=configured|ready`

It also loads `OPENCLAW_GATEWAY_TOKEN` from `.secrets/revenue-os.local.env` into the process before running `openclaw node install` and `openclaw node run`.

## Routing policy

- Public and low-trust browsing defaults to OpenClaw managed browsing.
- Public parallel or persistent browsing prefers Steel when the Steel lane is ready.
- Company-auth work that needs persistent state routes only to attached Chrome or auth-ready Steel Cloud.
- Treasury and infrastructure work route only to attached Chrome or auth-ready Steel Cloud.
- If no safe high-trust lane is ready, the broker returns a blocked route instead of silently degrading to managed browsing.

## Steel truth

- Cloud mode can be auth-ready only when `STEEL_AUTH_READY_PROFILES` includes the needed profile ids.
- Self-hosted mode is tracked separately and is not treated as credentials-ready for `gmail_primary`, `wise_primary`, `hetzner_primary`, or other root lanes.
- Current profile classes are:
  - `clean_research`
  - `company_signup_identity`
  - `gmail_primary`
  - `wise_primary`
  - `hetzner_primary`
  - `marketplace_generic`

## Current commands

- Refresh broker state: `npm run runtime:browser-broker`
- Start Windows tunnel: `powershell -ExecutionPolicy Bypass -File scripts/bootstrap/start-gateway-ssh-tunnel.ps1`
- Install or run Windows node host: `powershell -ExecutionPolicy Bypass -File scripts/bootstrap/bootstrap-openclaw-node-host.ps1`
- Pair attached Chrome: use the OpenClaw extension or relay flow, supply `OPENCLAW_GATEWAY_TOKEN`, then rerun the broker snapshot.
