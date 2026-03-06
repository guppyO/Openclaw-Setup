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

The repo records a real model drift: GPT-5.4 is current in OpenAI reasoning docs, but OpenClaw provider docs still center `openai-codex/gpt-5.3-codex`. Promotion decisions should treat that mismatch as a live compatibility question, not a settled assumption.
