# Secrets Handling

## Bootstrap source

- The repo reads the ignored root bootstrap file `Credentials.txt` or `credentials` exactly once through `npm run bootstrap:secrets`.
- Raw secret values are never written into docs, logs, commits, or generated markdown.

## Generated local secret storage

- Aggregated env file: `.secrets/revenue-os.local.env`
- Provider env files:
  - `.secrets/providers/gmail.env`
  - `.secrets/providers/wise.env`
  - `.secrets/providers/hetzner.env`
- Inventory metadata: `docs/secret-inventory.md`
- Machine-readable inventory: `data/exports/secret-inventory.json`

## Current risk notes

- The current bootstrap credentials reuse one password across root accounts.
- That reuse is now flagged in the inventory and should be rotated before further third-party account creation.
- Future accounts should reuse the company email identity where appropriate, but never reuse the same password.

## Runtime usage

- Node scripts load `.secrets/revenue-os.local.env` automatically when present.
- OpenClaw sign-in auth remains OAuth-based; the gateway configs themselves stay secretless unless a future SecretRef-backed field is required.
- Browser and treasury subsystems read the local env file for Wise, Steel, and Chrome-relay state.
