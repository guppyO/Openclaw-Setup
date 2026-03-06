# Audit Fixes

## Fixed issues

1. Broken script references
   - Added the missing runtime and bootstrap entrypoints.
   - Added a package-script consistency test.

2. Secret bootstrap gaps
   - Added idempotent import from `credentials` or `Credentials.txt`.
   - Added redacted secret inventory output and provider env files.
   - Added shared-password detection and rotation warnings.

3. Runtime model policy drift
   - Added runtime alias probing and a durable model-capability export.
   - Kept GPT-5.4 as the strategic default while keeping OpenClaw on a docs-only fallback until runtime proves more.

4. Dispatcher weakness
   - Added dispatch locks, stale-lock recovery, duplicate suppression, and blocker isolation.
   - Added a scheduler script and short recovery cadence.

5. Browser broker incompleteness
   - Added live broker state, capability detection, and routing logic across managed, attached, and Steel lanes.

6. Treasury placeholders
   - Added explicit treasury modes, runtime balance ingest path, and FX-aware summaries without hardcoded multipliers.

7. Source refresh weakness
   - Added fallback method tracking for direct fetch, browser capture, search-backed, and manual-unverified verification.

8. Thin deployment flow
   - Added Hetzner/OpenClaw/Steel bootstrap scripts and recurring systemd timer generation.

9. Shallow tests
   - Added tests for package-script integrity, secret import, runtime model policy, update fallback behavior, scheduler recovery, and richer browser routing.
