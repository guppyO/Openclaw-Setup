# Openclaw-Setup

Revenue OS is a file-backed autonomous revenue operating system built around OpenClaw, Codex, and ChatGPT sign-in workflows. The repo ships a portfolio engine, experiment runner, treasury subsystem, source-delta watcher, dashboard, internal skill pipeline, agent identity files, and staged OpenClaw configs for `lab`, `stage`, and `prod`.

## What runs now

- official-source verification and source snapshots,
- opportunity scoring and autonomy queue generation,
- experiment docs and a sample landing-page asset package,
- treasury state with Wise capability probing,
- skill intake seeding plus validated internal skills,
- dashboard server backed by generated JSON exports,
- backup, restore, and smoke verification scripts.

## Main commands

- `npm run bootstrap:runtime`
- `npm run bootstrap:state`
- `npm run bootstrap:skills`
- `npm run bootstrap:wise`
- `npm run dashboard`
- `npm run verify:smoke`
- `npm run test`

## Important constraint

GPT-5.4 is treated as the strategic default in the docs and operating model, but current official OpenClaw provider docs still expose `openai-codex/gpt-5.3-codex` and `openai-codex/gpt-5.2` examples rather than a public GPT-5.4 Codex provider string. The OpenClaw configs are therefore conservative by default and the drift is recorded in `docs/runtime-verification.md`.