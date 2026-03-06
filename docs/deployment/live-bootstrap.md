# Live Bootstrap

## Local preparation

1. Run `npm install`.
2. Import the root bootstrap file with `npm run bootstrap:secrets`.
3. Refresh official sources and runtime model policy with `npm run bootstrap:runtime`.
4. Generate company state with `npm run bootstrap:state`.
5. Generate OpenClaw configs with `npm run bootstrap:control-plane`.
6. Snapshot the browser broker with `npm run runtime:browser-broker`.
7. Probe Wise capability lanes with `npm run bootstrap:wise`.
8. Validate with `npm run test` and `npm run verify:smoke`.

## Hetzner bring-up

1. Export the target host details on the Windows machine:
   - `LIVE_VPS_HOST`
   - optional `LIVE_VPS_USER`
   - optional `BOOTSTRAP_ENVIRONMENT=stage` for first promotion
2. Run `bash scripts/bootstrap/bootstrap-hetzner-live.sh`.
3. On the VPS, complete the one-time OpenClaw OAuth step:
   - `openclaw models auth login --provider openai-codex`
4. Start the stage or prod service:
   - `systemctl --user start revenue-os-stage`
   - `systemctl --user start revenue-os-prod`

## Post-bootstrap checks

1. Re-run `npm run runtime:probe-models` on the VPS after OAuth completes.
2. Re-run `npm run bootstrap:wise` once Wise API or browser lane details are verified.
3. Pair the Windows attached Chrome relay and set `OPENCLAW_CHROME_RELAY_STATUS=paired` in the local secret env.
4. Add Steel details to `.secrets/revenue-os.local.env` and run `bash scripts/bootstrap/bootstrap-steel.sh`.
5. Re-run `npm run verify:smoke` and `npm run backup`.

## Promotion rule

- Stage first, then prod.
- Promote only after runtime sources, browser broker, dispatch state, treasury probe, and backup status are current.
