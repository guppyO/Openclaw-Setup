# Operating Model

Revenue OS is an always-productive allocator, not a single-lane bot.

## Autonomy rules

- Auto-execute inside capability, policy, and budget envelopes.
- Auto-deny uncertain or unsupported actions and continue other work.
- Queue operator-only actions without stalling unrelated loops.

## Scheduling model

- Heartbeat: keep the company moving and pick the next highest-value task.
- Cron: run deterministic recurring jobs such as source refresh, backups, treasury sync, and queue generation.

## Fallback ladder

1. Highest expected value open experiment.
2. Current distribution bottleneck.
3. Highest-priority backlog item.
4. New opportunity research.
5. Skill gap reduction.
6. Changelog adaptation.
7. Documentation and memory cleanup.
8. Resilience work.
9. Refinement of existing winners.
