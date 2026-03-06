# Treasury State

## Auth mode

- Active treasury auth mode: browser-only
- Pending reconciliations: 0

## Balances

| Currency | Amount |
| --- | --- |
| USD | 2500.00 |
| GBP | 400.00 |

## Capability probe

| Capability | Enabled |
| --- | --- |
| balanceRead | no |
| statementRead | no |
| cardTransactionRead | no |
| recipientManagement | no |
| transferCreation | no |
| spendControls | no |
| spendLimits | no |
| webhooks | no |
| psd2LimitedActions | yes |
| browserLaneAvailable | yes |
| personalTokenConfigured | no |
| oauthAppConfigured | no |
| emailReceiptIngest | yes |

## Budget envelopes

| Category | Daily | Weekly | Monthly | Requires tag |
| --- | --- | --- | --- | --- |
| hosting | $10 | $40 | $120 | no |
| domains | $20 | $60 | $120 | yes |
| marketplace-fees | $20 | $100 | $250 | yes |
| paid-acquisition | $25 | $125 | $300 | yes |
| tools-and-data | $15 | $75 | $200 | yes |

## Policy notes

- Treat Wise capability as runtime-discovered, not assumed.
- Freeze autonomous spend outside explicit envelopes or when probe confidence drops.
- Use the Wise API where the current auth mode supports it, but route unsupported actions through a browser lane with evidence capture.
- Tag every outgoing spend to a category and initiative whenever possible.
