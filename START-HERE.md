# START HERE

1. Run `npm install`.
2. Refresh official anchors with `npm run bootstrap:runtime`.
3. Generate the operating state with `npm run bootstrap:state`.
4. Seed the skill queue with `npm run bootstrap:skills`.
5. Probe treasury capabilities with `npm run bootstrap:wise`.
6. Run `npm run test` and `npm run verify:smoke`.
7. Launch the dashboard with `npm run dashboard`.

## Bootstrap still required

- Provision the Linux VPS and install OpenClaw there.
- Sign OpenClaw into `openai-codex` OAuth on the VPS.
- Add Wise credentials if treasury ingest beyond sample data is required.
- Attach the Chrome relay on the Windows node for authenticated browser flows.

## First production path

- Review [CURRENT-STATE.md](/C:/Users/beres/Desktop/openclaw%20setup/CURRENT-STATE.md).
- Run the relevant script in [openclaw/stage/scripts/bootstrap-stage.sh](/C:/Users/beres/Desktop/openclaw%20setup/openclaw/stage/scripts/bootstrap-stage.sh) first.
- Promote to prod only after stage smoke, runtime source refresh, and a fresh backup all pass.
