# Architecture

Revenue OS uses a hybrid topology:

- Linux VPS: durable OpenClaw control plane and long-lived automation surface.
- Windows Codex machine: development workspace, attached-browser node, and review surface.
- Optional stage gateway: isolated update and regression environment.

## Core layers

- `services/opportunity-engine`: lane graph, scoring, and portfolio ranking.
- `services/experiment-runner`: experiment generation and autonomy queue.
- `services/treasury`: balance, ledger, capability probe, and runway logic.
- `services/update-steward`: official-source snapshots and runtime drift tracking.
- `services/skill-intake`: seed queue and promotion discipline.
- `dashboards/app`: local web dashboard over file-backed state.

## Durable memory

- Markdown files are the source of truth.
- JSON in `data/exports/` is the machine cache and dashboard input.
- Initiative files and agent memory files are the continuity layer that outlives any single session.
