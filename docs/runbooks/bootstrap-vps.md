# VPS Bootstrap

Use the authoritative deployment flow in [docs/deployment/live-bootstrap.md](../deployment/live-bootstrap.md).

Short version:

1. Provision an Ubuntu 24.04 VPS with at least 2 vCPU and 4 GB RAM.
2. Sync this repo to `/opt/revenue-os`.
3. Use the pinned source-built OpenClaw path on Hetzner, not the lagging package release, unless the release line has caught up and you have explicitly chosen to switch back.
4. Run the stage bootstrap first with [openclaw/stage/scripts/bootstrap-stage.sh](../../openclaw/stage/scripts/bootstrap-stage.sh) or [scripts/bootstrap/bootstrap-hetzner-live.sh](../../scripts/bootstrap/bootstrap-hetzner-live.sh).
5. Complete `openclaw onboard --auth-choice openai-codex` on the VPS as the runtime user and choose `Keep` if OpenClaw asks about the existing config.
6. Run `bash scripts/bootstrap/finalize-openclaw-auth.sh stage` on the VPS so the live OpenClaw provider probe regenerates the control plane from the authenticated runtime.
7. Start the stage service and timers, validate, then repeat for prod only after stage passes.
8. If the VPS also runs self-hosted Steel, keep it loopback-restricted; the bootstrap installs a `revenue-os-steel-loopback.service` helper for that boundary.
