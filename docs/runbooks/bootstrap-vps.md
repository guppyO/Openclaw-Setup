# VPS Bootstrap

1. Provision an Ubuntu 24.04 VPS with at least 2 vCPU and 4 GB RAM.
2. Install Node 22.
3. Clone this repo to `~/revenue-os`.
4. Run the stage bootstrap script first from [openclaw/stage/scripts/bootstrap-stage.sh](/C:/Users/beres/Desktop/openclaw%20setup/openclaw/stage/scripts/bootstrap-stage.sh).
5. Log OpenClaw into `openai-codex` OAuth.
6. Install the stage systemd unit and run smoke checks.
7. Repeat for prod only after stage passes.
