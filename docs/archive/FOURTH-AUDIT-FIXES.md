# Fourth Audit Fixes

This pass closed the remaining repo-level gaps that were still preventing a clean stage or prod sign-off.

## Fixed

- Generated OpenClaw configs now include `gateway.mode: "local"`.
- The Windows remote path is now explicit: SSH tunnel plus Windows node host for a VPS-first gateway.
- `runtime:complete-task` resolves a real gateway hook base URL instead of assuming same-machine loopback.
- Dispatch now emits parallel `activeAssignments` instead of effectively serializing the whole team behind one task.
- Browser routing now blocks unsafe high-trust fallbacks instead of silently degrading to the managed browser.
- Steel Cloud versus self-hosted truth is explicit, and auth-sensitive Steel lanes require declared auth-ready profiles.
- Source-refresh method labels now distinguish real browser capture from weak user-agent fallback.
- OpenClaw and Steel source anchors were refreshed to current working official pages.
- Skill pinning now uses workspace refs or GitHub commit pins instead of HTML hashes.
- Opportunity discovery now includes broader deterministic public signals beyond a handful of HN RSS queries.

## Still external

- Hetzner SSH host
- VPS-side OpenClaw OAuth
- Windows SSH tunnel runtime
- Windows node host runtime
- Attached Chrome pairing
- Steel auth details
- Wise token or OAuth details
