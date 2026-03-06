# VPS Bootstrap

Use the authoritative deployment flow in [docs/deployment/live-bootstrap.md](../deployment/live-bootstrap.md).

Short version:

1. Provision an Ubuntu 24.04 VPS with at least 2 vCPU and 4 GB RAM.
2. Sync this repo to `/opt/revenue-os`.
3. Run the stage bootstrap first with [openclaw/stage/scripts/bootstrap-stage.sh](../../openclaw/stage/scripts/bootstrap-stage.sh) or [scripts/bootstrap/bootstrap-hetzner-live.sh](../../scripts/bootstrap/bootstrap-hetzner-live.sh).
4. Complete `openclaw models auth login --provider openai-codex` on the VPS as the runtime user.
5. Start the stage service and timers, validate, then repeat for prod only after stage passes.
