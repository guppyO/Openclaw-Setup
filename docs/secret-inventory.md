# Secret Inventory

Bootstrap metadata only. Raw secret values are intentionally excluded.

## Import summary

- Imported at: 2026-03-06T20:01:10.390Z
- Source file: Credentials.txt
- Source hash: 91751805a561df6af941e01ed982dc56310870124b0491e3d143c5908f2bd48d
- Providers: wise, hetzner, gmail
- Secret files: .secrets/providers/wise.env, .secrets/providers/hetzner.env, .secrets/providers/gmail.env

## Inventory

| Provider | Purpose | Scope | Rotation needed | Storage ref |
| --- | --- | --- | --- | --- |
| wise | Treasury source account and money movement control | treasury | yes | .secrets/providers/wise.env |
| hetzner | Primary infrastructure provider for VPS control plane | infrastructure | yes | .secrets/providers/hetzner.env |
| gmail | Primary company mailbox and signup identity | company-identity | yes | .secrets/providers/gmail.env |

## Warnings

- Shared password detected across providers: gmail, hetzner, wise. Rotate to unique service passwords.

## Handling rules

- Do not commit bootstrap secret files or generated env files.
- Use the company Gmail identity for new accounts where appropriate, but generate unique per-service passwords.
- Treat Hetzner, Wise, and Gmail as root operational accounts with explicit rotation review.
