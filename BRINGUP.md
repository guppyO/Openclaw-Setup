# Bring-up

The authoritative live bring-up flow now lives in [docs/deployment/live-bootstrap.md](./docs/deployment/live-bootstrap.md).

Use that document for:

- the local bootstrap order,
- stage-first Hetzner deployment with `stage` as the script default,
- config validation before service enable or start,
- the Windows SSH tunnel path to the loopback-bound VPS gateway,
- the Windows node-host setup for attached Chrome,
- the OpenClaw OAuth step on the VPS,
- the post-auth finalize step that re-probes the live OpenClaw model route and regenerates configs,
- attached Chrome gateway-token pairing,
- Steel activation,
- Wise browser-only versus token or OAuth follow-through,
- and the final smoke plus backup sequence.
