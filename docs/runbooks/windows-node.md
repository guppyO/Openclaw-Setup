# Windows Node Runbook

Use the Windows machine for:

- Codex app and CLI development,
- reviewable diffs and local testing,
- attached Chrome relay for authenticated browser sessions,
- manual inspection when a site rejects headless automation.

## Required setup

- Keep Codex signed in.
- Install the OpenClaw Chrome extension and attach it to the correct tab when needed.
- Keep this workspace in sync with the VPS repo before promotion windows.

## Remote gateway path

1. Start the SSH tunnel with `powershell -ExecutionPolicy Bypass -File scripts/bootstrap/start-gateway-ssh-tunnel.ps1 -Environment stage`.
2. Start the node host with `powershell -ExecutionPolicy Bypass -File scripts/bootstrap/bootstrap-openclaw-node-host.ps1 -Environment stage`.
3. The node-host script loads `OPENCLAW_GATEWAY_TOKEN` from `.secrets/revenue-os.local.env`.
4. It installs the node with `openclaw node install --host <host> --port <port> --node-id <id> --display-name <label>`.
5. It runs the node with `openclaw node run --host <host> --port <port> --node-id <id>`.
6. Pair the attached Chrome relay against the tunneled gateway URL once the node host is up.
