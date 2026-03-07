# Update Policy

## Principle

Automate the change-management process, not blind in-place mutation.

## Flow

1. Detect official-source change.
2. Attempt direct verification first.
3. If direct fetch fails, fall back to browser capture or search-backed verification and record the method used.
4. Summarize delta and classify impact as awareness-only, stage-required, or prod-blocking.
5. Patch lab or stage.
6. Run smoke, browser, memory, dispatch, and treasury checks.
7. Promote only with a clean backup and rollback point.

## Current note

The repo now treats `openai-codex/gpt-5.4` as the intended OpenClaw provider route based on current official docs and recent merged OpenClaw upstream changes. Promotion decisions should still require a live authenticated gateway probe before claiming the deployed runtime is proven on that host.
