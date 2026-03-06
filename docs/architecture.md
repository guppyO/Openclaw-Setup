# Architecture

## Chosen topology

- Hetzner host: primary stage or prod control plane, OpenClaw gateway, scheduler timers, source refresh, backups, and optional Steel browser capacity.
- Windows Codex workstation: build surface, attached-Chrome node, and high-trust browser continuity lane.
- Staged environments: `lab`, `stage`, and `prod` configs generated from the runtime model policy.

## Why this shape

- GPT-5.4 remains the strategic default across Codex-facing surfaces.
- OpenClaw stays on the strongest verified provider string and promotes automatically when runtime probes can prove a stronger route.
- A single Hetzner host is still the recommended first live deployment for low-to-moderate browser concurrency.
- If Steel concurrency or memory pressure grows beyond the host comfortably, split the browser pool onto a separate node.

## Runtime layers

- `services/opportunity-engine`: lane graph, scoring, and ranked backlog.
- `services/experiment-runner`: experiment generation and launch state.
- `services/dispatch`: ready queue, locks, stale-lock recovery, and immediate continuation.
- `services/browser-broker`: managed browser, attached Chrome, and Steel routing.
- `services/treasury`: capability probing, runtime-vs-sample mode, FX-aware snapshotting, and spend envelopes.
- `services/update-steward`: source verification with direct, browser, and search fallback modes.
- `services/skill-intake`: public-skill intake and internal-skill promotion discipline.

## Durable state

- Markdown is the source of truth for operating memory.
- `data/exports/` is the machine cache consumed by the dashboard and schedulers.
- Agent identity files and initiative docs preserve continuity across sessions and host restarts.
