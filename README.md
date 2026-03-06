# revenue-os

A live-upgraded autonomous revenue operating system built around OpenClaw, Codex, ChatGPT sign-in, a Hetzner control-plane host, a Windows attached-browser node, and a three-lane browser fabric.

## What is in the repo

- GPT-5.4-first runtime policy with a truthful distinction between strategic target, verified local route, verified OpenClaw route, and docs-only fallback.
- Continuous dispatch with a recovery sweep plus an immediate completion wrapper that can wake the live gateway hook instead of waiting for the next sweep.
- Browser routing across OpenClaw managed browsing, attached Chrome, and Steel with explicit cloud versus self-hosted semantics.
- Treasury state that distinguishes sample, browser-only, API, and hybrid modes, plus cash-truth and ledger-completeness status.
- Opportunity ingest that mixes live feed discovery, internal asset reuse, pinned opportunities, and seeded fallback lanes.
- Skill discovery that resolves live ClawHub or GitHub candidates when possible and keeps them in quarantine until promotion evidence exists.

## Start

- Local bootstrap: [START-HERE.md](./START-HERE.md)
- Live status: [CURRENT-STATE.md](./CURRENT-STATE.md)
- Authoritative bring-up flow: [docs/deployment/live-bootstrap.md](./docs/deployment/live-bootstrap.md)
- Browser lanes: [docs/browser-topology.md](./docs/browser-topology.md)
- Secrets and token handling: [docs/secrets-handling.md](./docs/secrets-handling.md)
- Dispatch model: [docs/continuous-dispatch.md](./docs/continuous-dispatch.md)
