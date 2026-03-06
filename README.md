# revenue-os

A live-upgraded autonomous revenue operating system built around OpenClaw, Codex, ChatGPT sign-in, a Hetzner control-plane host, a Windows attached-browser node, and a three-lane browser fabric.

## What is in the repo

- GPT-5.4-first runtime policy with a stable alias map and a documented OpenClaw provider fallback when the public provider surface still centers `openai-codex/gpt-5.3-codex`.
- A continuous dispatch layer that promotes immediate next work instead of waiting for slow heartbeat loops.
- A browser broker that routes across OpenClaw managed browsing, attached Chrome, and Steel namespaces.
- A treasury subsystem that distinguishes Wise API, browser, and append-only ledger lanes.
- Staged OpenClaw configs, systemd units, Hetzner bootstrap scripts, dashboard state, source watchers, skills, tests, and backups.

## Start

- [START-HERE.md](/C:/Users/beres/Desktop/openclaw%20setup/START-HERE.md)
- [CURRENT-STATE.md](/C:/Users/beres/Desktop/openclaw%20setup/CURRENT-STATE.md)
- [docs/deployment/live-bootstrap.md](/C:/Users/beres/Desktop/openclaw%20setup/docs/deployment/live-bootstrap.md)
