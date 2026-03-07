# Continuous Dispatch

## Layers

1. Immediate continuation
   - When tracked work finishes, use `npm run runtime:run-task -- --task <task-id> -- <command...>` as the default wrapper.
   - If you already completed the work outside the wrapper, use `npm run runtime:complete-task -- --task <task-id>`.
   - Both paths update `dispatch-state.json`, release the lock, and attempt an immediate hook call to the live gateway.

2. Recovery sweep
   - Run every 3 minutes.
   - Recovers stale locks, rebuilds assignments, and keeps the queue moving if the completion wrapper or wake request was skipped.

3. Heartbeat
   - Strategic sweep every 12 minutes by default.
   - Re-ranks lanes, budgets, and quiet failures.
   - Heartbeat is explicit in generated OpenClaw configs and is not the main continuation path.

4. Exact timers
   - Portfolio reviews, backups, source refresh, and weekly recalibration stay on explicit timers.

## Behavior

- The dispatcher can assign multiple specialist agents in parallel up to the configured concurrency limits.
- `nextTask` still names the highest-priority assignment, but `activeAssignments` is now the real work surface.
- Blocked initiatives stay isolated; they do not stall unrelated work.
- If no immediately ready task exists, the scheduler generates the next-best fallback task instead of idling.

## Output

- Durable dispatch state: `data/exports/dispatch-state.json`
- Ready queue: `data/exports/autonomy-queue.json`
- Last wake attempt: `data/exports/dispatch-wake.json`

## Remote wake path

- `runtime:complete-task` no longer assumes the gateway is on the same machine.
- Local mode resolves to loopback.
- SSH-tunnel mode resolves to the forwarded local port.
- Tailscale or HTTPS modes require an explicit `OPENCLAW_GATEWAY_BASE_URL` or `OPENCLAW_HOOK_BASE_URL`.
