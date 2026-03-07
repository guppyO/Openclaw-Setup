# Validation Report

## Commands run

- `npm install`
- `npm run build`
- `npm run test`
- `npm run bootstrap:secrets`
- `npm run bootstrap:runtime`
- `npm run bootstrap:control-plane`
- `npm run runtime:browser-broker`
- `npm run bootstrap:wise`
- `npm run bootstrap:state`
- `npm run verify:smoke`
- `npm run backup`

## Result

- Install completed with no dependency drift or vulnerabilities.
- Build passed.
- Tests passed with 51 passing tests.
- Secret import passed and stayed idempotent on unchanged input.
- Runtime verification refreshed with truthful method labels and now sits at 16 verified, 1 pending, 1 drifted, 0 unsupported.
- OpenClaw config generation passed and now emits `gateway.mode: "local"`, loopback-safe `controlUi.enabled`, local semantic memory search, explicit hook wake paths, and per-agent dispatch configuration.
- Hetzner bootstrap defaults to `stage`; `prod` requires an explicit override.
- `bootstrap-openclaw.sh`, `finalize-openclaw-auth.sh`, and tracked-task wake defaults are also stage-first unless `prod` is explicit.
- OpenClaw config validation is now enforced before service enable or start through `scripts/verify/validate-openclaw-config.sh` and the generated systemd `ExecStartPre` gates.
- Browser-backed source capture is now repo-native when the Windows browser lane or an auth-ready browser lane is ready; arbitrary shell commands no longer count as `browser-capture`.
- Browser broker snapshot passed and now reflects the live SSH tunnel, paired attached Chrome lane, node-host readiness, Steel Cloud versus self-hosted truth, and blocked high-trust routes.
- Browser broker snapshot now routes public parallel work to the loopback-scoped self-hosted Steel lane while keeping company-auth and treasury work on attached Chrome.
- The live Hetzner stage gateway now runs the pinned OpenClaw source build and actively exposes `openai-codex/gpt-5.4`.
- The loopback control UI is reachable through the SSH tunnel.
- The attached Chrome lane is now live end-to-end and currently exposes one registered Gmail tab through the local relay on `127.0.0.1:4204`.
- The existing self-hosted Steel service on the VPS is now hardened to loopback-only access; external requests to `46.225.227.168:3000` no longer succeed.
- The VPS local-memory backend is ready with `memorySearch.provider = "local"` and the default `embeddinggemma` GGUF path.
- Treasury probe passed and now reports `hybrid-live` with a live GBP balance and `ledger: unavailable`.
- State generation passed and currently surfaces 9 opportunities, 4 experiments, and parallel active assignments.
- Smoke verification passed.
- Backup completed successfully during the latest live-bootstrap cycle at `data/backups/revenue-os-2026-03-07T20-57-55-509Z.tar.gz`.
- Stale root planning and older audit-fix notes were archived under `docs/archive/`.

## Still external

- Self-hosted Steel is intentionally limited to low-trust public work. Auth-ready multi-profile Steel still requires Steel Cloud or a stronger supported credentials layer.
- Wise now has live balance access, but richer statement or transfer capabilities remain limited until the account exposes them or OAuth is added.
- Production is not promoted yet; stage is the live environment.
