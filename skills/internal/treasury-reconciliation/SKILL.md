---
name: treasury-reconciliation
description: "Reconcile balances, ledger entries, and experiment tags for Revenue OS. Use when treasury state must be normalized, unexplained spend appears, or ROI and runway views need to be refreshed from current ledger data."
---

# Treasury Reconciliation

Keep the money layer clean enough for autonomous allocation.

## Workflow

1. Refresh current balances and capability flags.
2. Normalize each ledger entry with merchant, category, initiative tag, and recurring flag.
3. Flag entries that are large, uncategorized, duplicated, or outside the spend envelope.
4. Update recurring burn, runway, and initiative ROI views.

## Output

- updated ledger or reconciliation note,
- suspicious spend list,
- runway statement,
- budget release or freeze recommendation.
