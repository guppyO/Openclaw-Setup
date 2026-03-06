# Continuous Dispatch

## Layers

1. Immediate continuation
   - When a tracked task finishes, run `npm run runtime:complete-task -- --task <task-id>`.
   - This releases the lock, promotes the next task, writes `data/exports/dispatch-wake.json`, and attempts an immediate OpenClaw wake hook instead of waiting for the next sweep.

2. Recovery sweep
   - Run every 3 minutes.
   - Refreshes overdue work, refills the ready queue, and prevents idle gaps if the completion wrapper was skipped or the wake request failed.

3. Heartbeat
   - Strategic sweep every 12 minutes by default.
   - Re-ranks lanes, budgets, and quiet failures.
   - Heartbeat is explicit in generated OpenClaw configs and is not the primary continuation path.

4. Exact timers
   - Portfolio reviews, backups, source refresh, and weekly recalibration stay on explicit timers or cron-style schedules.

## Output

- Durable dispatch state: `data/exports/dispatch-state.json`
- Ready queue: `data/exports/autonomy-queue.json`
- Last wake attempt: `data/exports/dispatch-wake.json`

## Policy

- If no ready task exists, the scheduler generates the next-best fallback task immediately.
- Blocked initiatives stay isolated; they do not stall unrelated work.
- Recovery timers exist as a safety net, not as the main way the company keeps moving.
