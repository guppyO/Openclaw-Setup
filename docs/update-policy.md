# Update Policy

## Principle

Automate the change-management process, not blind in-place mutation.

## Flow

1. Detect official-source change.
2. Summarize delta and classify impact.
3. Patch lab or stage.
4. Run smoke, browser, memory, and treasury checks.
5. Promote only with a clean backup and rollback point.

## Current note

The repo records a real model drift: GPT-5.4 is current in OpenAI reasoning docs, but OpenClaw provider docs still center `openai-codex/gpt-5.3-codex`. Promotion decisions should treat that mismatch as a live compatibility question, not a settled assumption.
