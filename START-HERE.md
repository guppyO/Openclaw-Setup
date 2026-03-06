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

Use [docs/deployment/live-bootstrap.md](/C:/Users/beres/Desktop/openclaw%20setup/docs/deployment/live-bootstrap.md) for the Hetzner bring-up path. The local secret flow is documented in [docs/secrets-handling.md](/C:/Users/beres/Desktop/openclaw%20setup/docs/secrets-handling.md), the browser fabric in [docs/browser-topology.md](/C:/Users/beres/Desktop/openclaw%20setup/docs/browser-topology.md), and the scheduler model in [docs/continuous-dispatch.md](/C:/Users/beres/Desktop/openclaw%20setup/docs/continuous-dispatch.md).

The minimum unavoidable interactive steps are:

- complete `openclaw models auth login --provider openai-codex` on the VPS,
- pair the attached Chrome relay once on Windows,
- add Steel API or self-hosted details if you want the Steel lane active,
- verify the Wise lane you want to use beyond browser-only reconciliation.
