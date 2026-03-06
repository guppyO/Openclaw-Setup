# Bringup

## Minimal first deployment sequence

1. Local machine
   - `npm install`
   - `npm run bootstrap:secrets`
   - `npm run bootstrap:runtime`
   - `npm run bootstrap:control-plane`
   - `npm run bootstrap:state`

2. Hetzner sync
   - export `LIVE_VPS_HOST`
   - optional `BOOTSTRAP_ENVIRONMENT=stage`
   - run `bash scripts/bootstrap/bootstrap-hetzner-live.sh`

3. VPS interactive step
   - `openclaw models auth login --provider openai-codex`

4. Start services
   - `systemctl --user start revenue-os-stage.service`
   - `systemctl --user start revenue-os-stage-scheduler.timer`
   - `systemctl --user start revenue-os-stage-source-refresh.timer`
   - `systemctl --user start revenue-os-stage-backup.timer`

5. Browser and treasury completion
   - pair attached Chrome on Windows
   - add Steel config if required
   - rerun `npm run bootstrap:wise`
   - rerun `npm run verify:smoke`
