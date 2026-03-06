# Treasury State

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

## Policy notes

- Treat Wise capability as runtime-discovered, not assumed.
- Freeze autonomous spend outside explicit envelopes or when probe confidence drops.
- Tag every outgoing spend to a category and initiative whenever possible.
