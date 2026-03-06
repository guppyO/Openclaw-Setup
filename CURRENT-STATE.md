# Current State

## Live in this workspace

- Node/TypeScript repo with buildable services, dashboard, tests, scripts, and docs.
- Generated JSON state in `data/exports/` for opportunities, experiments, queue, skills, treasury, runtime anchors, account registry, and dashboard state.
- Agent identity files in `agents/`.
- OpenClaw `lab`, `stage`, and `prod` config files plus bootstrap scripts and systemd units.
- Eight validated internal skills in `skills/internal/`.

## Not yet live

- No Linux VPS has been provisioned from this workspace.
- OpenClaw is not installed on this Windows host and is not running in prod or stage.
- Wise credentials are not present, so the treasury capability probe remains conservative and read-only.
- The attached Chrome relay still needs operator pairing on the Windows browser profile.
- Direct `fetch` access to some OpenAI help and blog pages hits a bot-wall `403`, so long-term source refresh for those pages should use browser-backed verification rather than plain HTTP only.

## Next autonomous steps after bootstrap

- Run stage gateway bootstrap and attach `openai-codex` OAuth.
- Configure recurring cron jobs for queue refresh, source refresh, treasury sync, and backups on stage.
- Re-run runtime verification and smoke checks on stage.
- Promote only after stage browser, memory, and source-delta checks are clean.
