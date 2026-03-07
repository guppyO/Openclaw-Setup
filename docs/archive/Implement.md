# Revenue OS Implementation Notes

Use Markdown as the source of truth, JSON exports as the machine cache, and generated docs as the operator view.

Implementation rules:

- prefer GPT-5.4 for strategic work where the surface supports it,
- use the strongest currently documented Codex/OpenClaw coding model where GPT-5.4 is not actually exposed,
- never assume Wise capabilities; probe them,
- stage changes before production promotion,
- keep heartbeats tiny and use cron for exact recurring work.
