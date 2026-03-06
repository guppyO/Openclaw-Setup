# Audit Fixes

## Fixed issues

1. Documentation portability and authority
   - Replaced local absolute Windows links with repo-relative Markdown links.
   - Consolidated the operator bring-up flow around [docs/deployment/live-bootstrap.md](./docs/deployment/live-bootstrap.md).

2. Runtime verification drift
   - Replaced the static write path with fresh snapshot-derived runtime verification.
   - Added real method recording for direct fetch, browser capture, search-backed fallback, and manual-unverified cases.

3. Model policy truthfulness
   - Marked default model fallback state as provisional.
   - Routed dashboard and dispatch through the latest model-capability artifact instead of a stale default when available.

4. Immediate continuation
   - Added `npm run runtime:complete-task -- --task <id>` plus wake-hook output.
   - Added explicit OpenClaw hook and heartbeat config generation.

5. Browser fabric truthfulness
   - Added gateway-token readiness checks for attached Chrome.
   - Split Steel into explicit cloud versus self-hosted modes and removed the earlier “base URL alone means ready” ambiguity.

6. VPS supervision
   - Moved the generated service model to a dedicated `revenueos` runtime user with system-level units under `/opt/revenue-os`.

7. Treasury truthfulness
   - Added rolling Wise statement windows, FX-aware recurring burn, cash-truth and ledger-status reporting, and append-only browser-mode ledger import support.

8. Live discovery
   - Added opportunity ingest from live feeds plus internal asset reuse.
   - Added real skill discovery with live source resolution, quarantine staging, and workspace skill discovery.

9. Tests
   - Added Markdown portability regression coverage.
   - Expanded runtime, dispatch, browser, treasury, and source-refresh tests.
