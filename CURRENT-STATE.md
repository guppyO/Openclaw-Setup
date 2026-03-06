# Current State

## Live in this workspace

- Secret bootstrap is active. The ignored root credentials file is imported into `.secrets/revenue-os.local.env` and provider env files, with safe metadata in [docs/secret-inventory.md](./docs/secret-inventory.md).
- Runtime source refresh, dynamic runtime verification, model-policy probing, dispatch state, browser-broker state, treasury state, account registry, and dashboard state are generated in `data/exports/`.
- OpenClaw `lab`, `stage`, and `prod` configs now derive from the runtime model policy and include explicit heartbeat plus wake-hook settings.
- Continuous dispatch is live locally through `data/exports/dispatch-state.json`, `data/exports/dispatch-wake.json`, `npm run runtime:scheduler`, and `npm run runtime:complete-task -- --task <id>`.
- Browser routing is live locally through `data/exports/browser-broker.json` and the `services/browser-broker` layer, with explicit gateway-token and Steel readiness checks.
- Opportunity ingest now mixes live feed discovery, internal asset reuse, pinned imports, and seeded fallback lanes.
- Skill intake now resolves live candidates where it can, retains quarantine state, and keeps workspace skills visible as reusable assets.
- The repo builds, tests, smoke-checks, and the dashboard health endpoint responds locally.

## Blocked by real-world runtime boundaries

- OpenClaw is still not installed on this Windows host, so provider-model support is inferred from current official docs here rather than a live local gateway probe.
- The Hetzner VPS still needs its concrete SSH host path and the one-time `openclaw models auth login --provider openai-codex` step before stage or prod can run.
- The attached Chrome relay is not yet paired, so the local high-trust browser lane is still unavailable even though the gateway token is now generated.
- Steel is not yet configured in the local secret env, so the Steel lane remains modeled but not ready.
- Wise is currently browser-capable from imported credentials, but API capability remains unverified because no Wise token or OAuth app details were provided.
- Some OpenAI help and blog pages still return HTTP `403` to plain fetches, so long-term source verification should keep browser-backed capture available.

## Next autonomous steps

- Run [scripts/bootstrap/bootstrap-hetzner-live.sh](./scripts/bootstrap/bootstrap-hetzner-live.sh) after exporting `LIVE_VPS_HOST` and optional `BOOTSTRAP_ENVIRONMENT=stage`.
- Follow the authoritative deployment guide in [docs/deployment/live-bootstrap.md](./docs/deployment/live-bootstrap.md).
- Complete `openclaw models auth login --provider openai-codex` on the VPS as `revenueos`, then start the stage service and timers.
- Pair the Windows attached Chrome relay using `OPENCLAW_GATEWAY_TOKEN` from `.secrets/revenue-os.local.env`, then set `OPENCLAW_CHROME_RELAY_STATUS=paired` and rerun `npm run runtime:browser-broker`.
- Add Steel details and run [scripts/bootstrap/bootstrap-steel.sh](./scripts/bootstrap/bootstrap-steel.sh).
- Re-run `npm run bootstrap:wise`, `npm run verify:smoke`, and `npm run backup` after each real-world auth or bootstrap step.
