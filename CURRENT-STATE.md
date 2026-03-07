# Current State

## Live in this workspace

- Secret bootstrap is active. The ignored root credentials file is imported into `.secrets/revenue-os.local.env` and provider env files, with safe metadata in [docs/secret-inventory.md](./docs/secret-inventory.md).
- Runtime source refresh, runtime verification, model-policy probing, dispatch state, browser-broker state, treasury state, account registry, and dashboard state are generated in `data/exports/`.
- OpenClaw `lab`, `stage`, and `prod` configs now include `gateway.mode: "local"`, explicit hook auth, and explicit heartbeat settings.
- Continuous dispatch is live locally through `data/exports/dispatch-state.json`, `data/exports/dispatch-wake.json`, `npm run runtime:scheduler`, `npm run runtime:complete-task`, and `npm run runtime:run-task`.
- Dispatch now carries parallel specialist assignments instead of only one serialized head-of-line task.
- Browser routing is live locally through `data/exports/browser-broker.json` and the `services/browser-broker` layer, with explicit remote-gateway mode, node-host state, Steel Cloud versus self-hosted truth, and blocked high-trust routes.
- Opportunity ingest now mixes live feed discovery, GitHub demand signals, internal asset reuse, pinned imports, and seeded fallback lanes.
- Skill intake now uses real workspace refs or GitHub commit pins when discovery succeeds, and leaves unresolved third-party candidates unresolved instead of inventing HTML-hash pins.
- The repo builds, tests, smoke-checks, and the dashboard health endpoint responds locally.

## Current local truth

- Codex CLI is installed on this Windows host and the runtime model policy keeps `gpt-5.4` as the strategic target.
- OpenClaw is not installed on this Windows host, so the OpenClaw side still stays on the strongest docs-backed provider fallback until a live VPS gateway probe runs.
- Browser broker status currently shows:
  - attached Chrome: not ready
  - remote gateway path: modeled but not yet aimed at a real VPS tunnel
  - node host: not ready
  - Steel: not configured
- Treasury is currently `browser-only` and the ledger is still `unavailable`.
- Runtime verification now uses truthful source methods:
  - `direct-fetch`
  - `browser-capture`
  - `ua-fetch-fallback`
  - `search-backed`
  - `manual-unverified`

## Blocked by real-world runtime boundaries

- The Hetzner VPS still needs its concrete SSH host path and the one-time `openclaw models auth login --provider openai-codex` step before stage or prod can run.
- The Windows SSH tunnel is not running yet, so remote wake and remote browser control are not live.
- The Windows node host is not running yet, so the attached Chrome lane is still incomplete for a VPS-first gateway.
- The attached Chrome relay is not yet paired.
- Steel is not yet configured in the local secret env, so the Steel lane remains modeled but not ready.
- Wise is currently browser-capable from imported credentials, but API capability remains unverified because no Wise token or OAuth app details were provided.
- Some OpenAI help and blog pages still return HTTP `403` to plain fetches, so final verification of some anchors still needs a real browser-backed capture path.

## Next autonomous steps

- Run [scripts/bootstrap/bootstrap-hetzner-live.sh](./scripts/bootstrap/bootstrap-hetzner-live.sh) after exporting `LIVE_VPS_HOST` and optional `BOOTSTRAP_ENVIRONMENT=stage`.
- Follow the authoritative deployment guide in [docs/deployment/live-bootstrap.md](./docs/deployment/live-bootstrap.md).
- Complete `openclaw models auth login --provider openai-codex` on the VPS as `revenueos`, then start the stage service and timers.
- On Windows, run `powershell -ExecutionPolicy Bypass -File scripts/bootstrap/start-gateway-ssh-tunnel.ps1 -Environment stage`.
- On Windows, run `powershell -ExecutionPolicy Bypass -File scripts/bootstrap/bootstrap-openclaw-node-host.ps1 -Environment stage`.
- Pair the Windows attached Chrome relay using `OPENCLAW_GATEWAY_TOKEN` from `.secrets/revenue-os.local.env`, then rerun `npm run runtime:browser-broker`.
- Add Steel details and rerun `npm run runtime:browser-broker`.
- Feed append-only Wise ledger data into `data/imports/wise-ledger-import.json` or add Wise API credentials, then rerun `npm run bootstrap:wise`, `npm run bootstrap:state`, and `npm run verify:smoke`.
