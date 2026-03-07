# Secrets Handling

## Bootstrap source

- The repo reads the ignored root bootstrap file `Credentials.txt` or `credentials` through `npm run bootstrap:secrets`.
- Raw secret values are never written into docs, logs, commits, or generated markdown.

## Generated local secret storage

- Aggregated env file: `.secrets/revenue-os.local.env`
- Managed per-service password env: `.secrets/generated-service-credentials.env`
- Provider env files:
  - `.secrets/providers/gmail.env`
  - `.secrets/providers/wise.env`
  - `.secrets/providers/hetzner.env`
  - `.secrets/providers/steel.env` when present
- Inventory metadata: `docs/secret-inventory.md`
- Machine-readable inventory: `data/exports/secret-inventory.json`
- Managed credential metadata: `docs/credential-registry.md`
- Managed credential export: `data/exports/credential-registry.json`

## Generated runtime secrets

- `OPENCLAW_GATEWAY_TOKEN`
- `OPENCLAW_HOOK_TOKEN`
- `OPENCLAW_REMOTE_ACCESS_MODE` defaulting to `local`
- `OPENCLAW_CHROME_RELAY_STATUS` defaulting to `unpaired`
- `OPENCLAW_NODE_HOST_STATUS` defaulting to `missing`

These are generated during bootstrap if they are missing and stored only in `.secrets/revenue-os.local.env`. They are used for:

- attached Chrome relay pairing,
- OpenClaw gateway auth,
- immediate wake-hook requests after task completion.
- remote gateway routing and Windows node-host readiness checks.

## Current risk notes

- The current bootstrap credentials reuse one password across root accounts.
- That reuse is flagged in the inventory and now also causes generated unique replacement passwords to be stored locally for Gmail, Wise, and Hetzner rotation.
- That external rotation still has to happen on the live services before the imported bootstrap credentials become truly clean.
- Future accounts should reuse the company email identity where appropriate, but never reuse the same password.
- Use `npm run runtime:provision-credential -- --service <service> --purpose "<purpose>"` before opening a new signup flow.

## Runtime usage

- Node scripts load `.secrets/revenue-os.local.env` automatically when present.
- Node scripts also load `.secrets/generated-service-credentials.env`, so future account passwords can be generated once and reused safely without entering them into docs or prompts.
- Generated OpenClaw configs reference the gateway and hook tokens through secret refs rather than embedding the values in versioned config.
- Browser and treasury subsystems read the local env file for Wise, Steel, Chrome-relay state, SSH-tunnel base URLs, and node-host readiness.
- Steel Cloud auth-sensitive lanes become ready only when `STEEL_AUTH_READY_PROFILES` includes the exact profile ids you actually provisioned.
