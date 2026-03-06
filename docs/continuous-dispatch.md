# Continuous Dispatch

## Layers

1. Immediate continuation
   - When a task finishes, run `npm run runtime:scheduler -- --complete <task-id>`.
   - The dispatcher promotes the next best task in the same initiative instead of waiting for the next heartbeat.

2. Recovery sweep
   - Run every 3 minutes.
   - Refreshes overdue work, refills the ready queue, and prevents idle gaps.

3. Heartbeat
   - Strategic sweep every 12 minutes.
   - Re-ranks lanes, budgets, and quiet failures.

4. Exact cron jobs
   - Portfolio reviews, backups, source refresh, and weekly recalibration stay on explicit cron cadences.

## Output

- Durable dispatch state: `data/exports/dispatch-state.json`
- Ready queue: `data/exports/autonomy-queue.json`

## Policy

- If no ready task exists, the scheduler generates the next-best fallback task immediately.
- The company should not sit idle when a productive action exists.
