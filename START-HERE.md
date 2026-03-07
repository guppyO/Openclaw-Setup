# START HERE

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
10. `npm run dashboard`

Use [docs/deployment/live-bootstrap.md](./docs/deployment/live-bootstrap.md) for the authoritative live bring-up flow after the local bootstrap passes.

Key follow-through docs:

- Secrets and generated gateway tokens: [docs/secrets-handling.md](./docs/secrets-handling.md)
- Browser routing, SSH tunnel, and node host: [docs/browser-topology.md](./docs/browser-topology.md)
- Dispatch, recovery, and default tracked-task runner: [docs/continuous-dispatch.md](./docs/continuous-dispatch.md)
- Current runtime truth: [CURRENT-STATE.md](./CURRENT-STATE.md)

The minimum unavoidable interactive steps are:

- complete `openclaw models auth login --provider openai-codex` on the VPS as the runtime user,
- run `bash scripts/bootstrap/finalize-openclaw-auth.sh <stage|prod>` on the VPS after that OAuth step so the active model probe and generated OpenClaw configs are refreshed from the authenticated runtime,
- start the Windows SSH tunnel and node host once the VPS gateway exists,
- pair the attached Chrome relay once on Windows using the generated gateway token,
- add Steel cloud auth details and auth-ready profile refs if you want the Steel high-trust lane live,
- verify the Wise lane you want to use beyond browser-only reconciliation.
