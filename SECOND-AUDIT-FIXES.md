# Second Audit Fixes

This file records the hardening pass that followed the second and third audit rounds.

## Fixed in this pass

- Replaced local absolute Windows links with repo-relative Markdown links in operator docs and runbooks.
- Made `docs/runtime-verification.md` and `data/exports/runtime-verification.json` derive from fresh source snapshots instead of static defaults.
- Marked model fallback state as provisional instead of pretending Codex CLI is always installed.
- Routed dashboard and dispatch usage policy through the latest runtime model artifact when available.
- Added `npm run runtime:complete-task -- --task <id>` so task completion can update dispatch state and attempt an immediate OpenClaw wake hook.
- Generated gateway and hook tokens during secret bootstrap when they are missing.
- Added explicit gateway auth, hook, and heartbeat sections to generated OpenClaw configs.
- Moved VPS supervision to a dedicated `revenueos` runtime user with system-level units instead of `systemctl --user`.
- Made Steel readiness truthful across cloud and self-hosted modes.
- Added cash-truth and ledger-status reporting for treasury plus rolling Wise statement intervals and append-only ledger import support.
- Replaced seed-only opportunity and skill discovery with live ingest plus seed fallback.

## Validation

Use [VALIDATION-REPORT.md](./VALIDATION-REPORT.md), [CURRENT-STATE.md](./CURRENT-STATE.md), and [docs/deployment/live-bootstrap.md](./docs/deployment/live-bootstrap.md) for the current live bootstrap and verification state.
