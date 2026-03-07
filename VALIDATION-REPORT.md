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
- Tests passed with 44 passing tests.
- Secret import passed and stayed idempotent on unchanged input.
- Runtime verification refreshed with truthful method labels, corrected OpenClaw plus Steel source anchors, and the current summary now sits at 15 verified, 3 pending, 0 drifted, 0 unsupported.
- OpenClaw config generation passed and now emits `gateway.mode: "local"` plus explicit hook, heartbeat, and per-agent dispatch configuration.
- Hetzner bootstrap now defaults to `stage`; `prod` requires an explicit override.
- `bootstrap-openclaw.sh`, `finalize-openclaw-auth.sh`, and tracked-task wake defaults are now also stage-first unless `prod` is explicit.
- OpenClaw config validation is now enforced before service enable or start through `scripts/verify/validate-openclaw-config.sh` and the generated systemd `ExecStartPre` gates.
- Browser-backed source capture is now repo-native when the Windows browser lane or an auth-ready browser lane is ready; arbitrary shell commands no longer count as `browser-capture`.
- Browser broker snapshot passed and now reflects remote gateway mode, node-host readiness, Steel Cloud versus self-hosted truth, and blocked high-trust routes.
- Treasury probe passed and currently reports `browser-only` with `ledger: unavailable`.
- State generation passed and currently surfaces 9 opportunities, 4 experiments, and parallel active assignments.
- Smoke verification passed.
- Backup completed at `data/backups/revenue-os-2026-03-07T04-18-40-322Z.tar.gz`.
- Stale root planning and older audit-fix notes were archived under `docs/archive/`.

## Still external

- OpenClaw OAuth on the VPS still requires the one-time live sign-in step.
- The Hetzner SSH host path still has to be supplied.
- The Windows SSH tunnel and node host still need to be started against the live VPS gateway.
- Attached Chrome pairing still requires the operator once.
- Steel remains inactive until cloud or self-hosted auth details are provided.
- Wise API or OAuth mode remains unavailable until a token or OAuth app is provided.
