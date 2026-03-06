---
name: changelog-delta-summarizer
description: "Summarize official product, API, or changelog deltas into operational impact. Use when OpenAI, OpenClaw, Wise, or adopted skills change and Revenue OS needs a short decision-ready delta with rollout implications."
---

# Changelog Delta Summarizer

Convert noisy release notes into decisions.

## Workflow

1. Compare the latest official source against the prior snapshot.
2. Extract only the changes that affect models, auth, limits, memory, browser, billing, or automation behavior.
3. Classify each change as awareness-only, stage-required, or prod-blocking.
4. Recommend the smallest safe next action: ignore, patch stage, rehearse, promote, or rollback.

## Output

- one-paragraph summary,
- bullet list of impactful deltas,
- operational classification,
- exact follow-up action and owner.
