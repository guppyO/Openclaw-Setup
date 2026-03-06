# Live Bootstrap

This is the authoritative bring-up flow for the repo.

## 1. Local preparation

Run the local bootstrap in this order:

1. `npm install`
2. `npm run bootstrap:secrets`
3. `npm run bootstrap:runtime`
4. `npm run bootstrap:state`
5. `npm run bootstrap:control-plane`
6. `npm run runtime:browser-broker`
7. `npm run bootstrap:wise`
8. `npm run test`
9. `npm run verify:smoke`

The generated gateway and hook tokens are stored in `.secrets/revenue-os.local.env`. They are not committed and must remain local or copied only to the VPS secret env.

## 2. Stage-first Hetzner bring-up

Export the target host details on the Windows machine:

- `LIVE_VPS_HOST`
- optional `LIVE_VPS_USER`
- optional `LIVE_VPS_RUNTIME_USER` if you do not want the default `revenueos`
- optional `BOOTSTRAP_ENVIRONMENT=stage` for the first promotion

Run:

```bash
bash scripts/bootstrap/bootstrap-hetzner-live.sh
```

This syncs the repo to `/opt/revenue-os`, installs or upgrades runtime dependencies, creates the dedicated `revenueos` service user by default, writes system-level units, and enables the gateway plus the recovery timers.

## 3. VPS interactive step

Complete the one-time OpenClaw OAuth step on the VPS as the runtime user:

```bash
sudo -u revenueos -H bash -lc 'cd /opt/revenue-os && openclaw models auth login --provider openai-codex'
```

Then start stage:

```bash
sudo systemctl start revenue-os-stage.service
sudo systemctl start revenue-os-stage-scheduler.timer
sudo systemctl start revenue-os-stage-source-refresh.timer
sudo systemctl start revenue-os-stage-backup.timer
```

## 4. Attached Chrome pairing

The attached Chrome relay depends on `OPENCLAW_GATEWAY_TOKEN`, which is generated during `npm run bootstrap:secrets` if it does not already exist.

Pairing flow:

1. Open the local Chrome relay or extension pairing UI on Windows.
2. Use the gateway token from `.secrets/revenue-os.local.env`.
3. Confirm the relay points at the live gateway endpoint you intend to use.
4. Set `OPENCLAW_CHROME_RELAY_STATUS=paired` in `.secrets/revenue-os.local.env`.
5. Re-run `npm run runtime:browser-broker` and `npm run verify:smoke`.

If the relay is marked paired but the gateway token is missing, smoke verification now fails on purpose.

## 5. Steel activation

Choose one Steel mode and keep it explicit:

- Cloud:
  - `STEEL_MODE=cloud`
  - `STEEL_API_KEY=...`
  - optional `STEEL_BASE_URL=https://api.steel.dev`
- Self-hosted:
  - `STEEL_MODE=self-hosted`
  - `STEEL_BASE_URL=https://your-steel-host`
  - `STEEL_SELF_HOSTED_TOKEN=...` or `STEEL_API_KEY=...`

Then run:

```bash
bash scripts/bootstrap/bootstrap-steel.sh
npm run runtime:browser-broker
```

## 6. Wise modes

The repo distinguishes four treasury realities:

- `sample`: no live browser or API lane confirmed yet
- `browser-only`: credentials exist but balances or statements still need manual or append-only reconciliation
- `live-api`: token-based balance lane is verified
- `hybrid-live`: browser and API lanes are both usable

If you stay in browser-only mode, feed append-only ledger data into `data/imports/wise-ledger-import.json` so treasury can report partial but real reconciliation rather than an empty ledger.

After any Wise change:

```bash
npm run bootstrap:wise
npm run verify:smoke
```

## 7. Promotion rule

- Stage first, then prod.
- Promote only after runtime sources, browser broker, dispatch state, treasury probe, and backup status are current.
- Use `npm run runtime:complete-task -- --task <id>` for real immediate continuation and wake-now behavior when a tracked task finishes.
