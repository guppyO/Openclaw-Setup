# Current State

## Live in this workspace

- Secret bootstrap is active. The ignored root credentials file is imported into `.secrets/revenue-os.local.env` and provider env files, with safe metadata in [docs/secret-inventory.md](/C:/Users/beres/Desktop/openclaw%20setup/docs/secret-inventory.md).
- Runtime source refresh, model-policy probing, dispatch state, browser-broker state, treasury state, account registry, and dashboard state are generated in `data/exports/`.
- OpenClaw `lab`, `stage`, and `prod` configs now derive from the runtime model policy instead of a hard-coded provider string in the generator.
- Continuous dispatch is live locally through `data/exports/dispatch-state.json` and `npm run runtime:scheduler`.
- Browser routing policy is live locally through `data/exports/browser-broker.json` and the `services/browser-broker` layer.
- The repo builds, tests, smoke-checks, and the dashboard health endpoint responds locally.

## Blocked by real-world runtime boundaries

- OpenClaw is still not installed on this Windows host, so provider-model support is inferred from current official docs here rather than a live local gateway probe.
- The Hetzner VPS still needs its concrete SSH host path and the one-time `openclaw models auth login --provider openai-codex` step before stage or prod can run.
- The attached Chrome relay is not yet paired, so high-trust local browser routing still shows as unavailable.
- Steel is not yet configured in the local secret env, so the Steel session lane is modeled and routable in code but inactive in runtime.
- Wise is currently browser-capable from imported credentials, but API capability remains unverified because no Wise token or OAuth app details were provided.
- Some OpenAI help/blog pages still return HTTP `403` to plain fetches, so long-term source verification should use browser-backed checks for those pages.

## Next autonomous steps

- Run [scripts/bootstrap/bootstrap-hetzner-live.sh](/C:/Users/beres/Desktop/openclaw%20setup/scripts/bootstrap/bootstrap-hetzner-live.sh) after exporting `LIVE_VPS_HOST` and optional `BOOTSTRAP_ENVIRONMENT=stage`.
- Complete `openclaw models auth login --provider openai-codex` on the VPS, then start the stage service.
- Pair the Windows attached Chrome relay and set `OPENCLAW_CHROME_RELAY_STATUS=paired` in `.secrets/revenue-os.local.env`.
- Add Steel details and run [scripts/bootstrap/bootstrap-steel.sh](/C:/Users/beres/Desktop/openclaw%20setup/scripts/bootstrap/bootstrap-steel.sh).
- Re-run `npm run bootstrap:wise`, `npm run verify:smoke`, and `npm run backup` after each real-world auth/bootstrap step.
