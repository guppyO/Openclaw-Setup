# Validation Report

## Commands run

- `npm run build`
- `npm run test`
- `npm run bootstrap:secrets`
- `npm run bootstrap:runtime`
- `npm run bootstrap:control-plane`
- `npm run bootstrap:state`
- `npm run bootstrap:wise`
- `npm run runtime:browser-broker`
- `npm run runtime:scheduler`
- `npm run verify:smoke`
- `npm run backup`

## Result

- Build passed.
- Tests passed.
- Secret import passed and stayed idempotent on unchanged input.
- Runtime model probe passed in passive mode.
- Browser broker snapshot passed.
- Scheduler state generation passed.
- Smoke verification passed.
- Backup completed.

## Still external

- OpenClaw OAuth on the VPS still requires a live sign-in step.
- Attached Chrome pairing still requires the operator once.
- Steel remains inactive until credentials or self-hosted base URL are provided.
- Wise API mode remains unavailable until a token or OAuth app is provided.
- Hetzner deployment still needs the actual VPS SSH host or console path.
