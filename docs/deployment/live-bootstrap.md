# Live Bootstrap

This is the authoritative bring-up flow for the repo.

## 1. Local preparation

Run the local bootstrap in this order:

1. `npm install`
2. `npm run bootstrap:secrets`
3. `npm run bootstrap:runtime`
4. `npm run bootstrap:control-plane`
5. `npm run runtime:browser-broker`
6. `npm run bootstrap:wise`
7. `npm run bootstrap:state`
8. `npm run test`
9. `npm run verify:smoke`

The generated gateway and hook tokens are stored in `.secrets/revenue-os.local.env`. They are not committed and must remain local or copied only to the VPS secret env.

## 2. Stage-first Hetzner bring-up

Export the target host details on the Windows machine:

- `LIVE_VPS_HOST`
- optional `LIVE_VPS_USER`
- optional `LIVE_VPS_RUNTIME_USER` if you do not want the default `revenueos`
- optional `BOOTSTRAP_ENVIRONMENT=prod` only when you are intentionally promoting past the default stage path

Run:

```bash
bash scripts/bootstrap/bootstrap-hetzner-live.sh
```

This syncs the repo to `/opt/revenue-os`, installs or upgrades runtime dependencies, creates the dedicated `revenueos` service user by default, validates the generated OpenClaw config, writes system-level units, and enables the gateway plus the recovery timers.

## 3. VPS interactive step

Complete the one-time OpenClaw OAuth step on the VPS as the runtime user:

```bash
sudo -u revenueos -H bash -lc 'cd /opt/revenue-os && openclaw models auth login --provider openai-codex'
```

Then finalize the authenticated runtime so the active model probe and generated OpenClaw configs are refreshed from the live gateway surface instead of the docs-only fallback:

```bash
sudo -u revenueos -H bash -lc 'cd /opt/revenue-os && bash scripts/bootstrap/finalize-openclaw-auth.sh stage'
```

That finalize step also reruns `openclaw config validate --json` against the generated environment config before you start the service.

Then start stage:

```bash
sudo systemctl start revenue-os-stage.service
sudo systemctl start revenue-os-stage-scheduler.timer
sudo systemctl start revenue-os-stage-source-refresh.timer
sudo systemctl start revenue-os-stage-backup.timer
```

## 4. Windows remote-access path

The repo assumes a loopback-bound gateway on the VPS, so the Windows browser host reaches it through an SSH tunnel by default.

Start the tunnel:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/bootstrap/start-gateway-ssh-tunnel.ps1 -Environment stage
```

That script updates the local env with:

- `OPENCLAW_REMOTE_ACCESS_MODE=ssh-tunnel`
- `OPENCLAW_GATEWAY_PORT=<local forwarded port>`
- `OPENCLAW_GATEWAY_BASE_URL=http://127.0.0.1:<local forwarded port>`

## 5. Windows node host

When the gateway runs on the VPS, the Windows Chrome lane also needs a node host.

Install or run it with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/bootstrap/bootstrap-openclaw-node-host.ps1 -Environment stage
```

This writes:

- `OPENCLAW_NODE_HOST_ID=<node name>`
- `OPENCLAW_NODE_HOST_STATUS=configured|ready`

The script also loads `OPENCLAW_GATEWAY_TOKEN` from `.secrets/revenue-os.local.env` before running `openclaw node install` and `openclaw node run`.

## 6. Attached Chrome pairing

The attached Chrome relay depends on `OPENCLAW_GATEWAY_TOKEN`, which is generated during `npm run bootstrap:secrets` if it does not already exist.

Pairing flow:

1. Open the local Chrome relay or extension pairing UI on Windows.
2. Use the gateway token from `.secrets/revenue-os.local.env`.
3. Confirm the relay points at the tunneled gateway URL.
4. Set `OPENCLAW_CHROME_RELAY_STATUS=paired` in `.secrets/revenue-os.local.env`.
5. Re-run `npm run runtime:browser-broker` and `npm run verify:smoke`.
6. Re-run `npm run bootstrap:runtime` or `npm run refresh:updates` if you want the source verifier to upgrade any remaining OpenAI `ua-fetch-fallback` pages into repo-native `browser-capture` artifacts.

If the relay is marked paired but the gateway token, tunnel path, or node host is missing, smoke verification fails on purpose.

## 7. Steel activation

Choose one Steel mode and keep it explicit:

- Cloud:
  - `STEEL_MODE=cloud`
  - `STEEL_API_KEY=...`
  - optional `STEEL_BASE_URL=https://api.steel.dev`
  - `STEEL_AUTH_READY_PROFILES=company_signup_identity,gmail_primary,wise_primary,...` for any auth-sensitive profiles you actually provisioned
- Self-hosted:
  - `STEEL_MODE=self-hosted`
  - `STEEL_BASE_URL=https://your-steel-host`
  - `STEEL_SELF_HOSTED_TOKEN=...` or `STEEL_API_KEY=...`

Then run:

```bash
bash scripts/bootstrap/bootstrap-steel.sh
npm run runtime:browser-broker
```

Steel self-hosted remains useful for public or low-trust session pooling, but the repo will not treat it as auth-ready for root or treasury profiles.

## 8. Wise modes

The repo distinguishes four treasury realities:

- `sample`: no live browser or API lane confirmed yet
- `browser-only`: credentials exist but balances or statements still need manual or append-only reconciliation
- `live-api`: token-based balance lane is verified
- `hybrid-live`: browser and API lanes are both usable

If you stay in browser-only mode, feed append-only ledger data into `data/imports/wise-ledger-import.json` so treasury can report partial but real reconciliation instead of an empty ledger.

After any Wise change:

```bash
npm run bootstrap:wise
npm run bootstrap:state
npm run verify:smoke
```

## 9. Promotion rule

- Stage first, then prod.
- Promote only after runtime sources, browser broker, dispatch state, treasury probe, and backup status are current.
- Use `npm run runtime:run-task -- --task <id> -- <command...>` for tracked work so completion and wake-now behavior happen automatically.
- `runtime:complete-task` wakes each owner-specific dispatch hook for the current active assignments, not just a single fixed agent path.
