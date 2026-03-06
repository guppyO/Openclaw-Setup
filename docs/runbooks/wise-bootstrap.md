# Wise Bootstrap

1. Decide whether the setup will use browser-only, personal-token, or partner OAuth mode.
2. Export `WISE_API_TOKEN` and `WISE_PROFILE_ID` if using the personal-token path.
3. Keep browser-only mode truthful by importing append-only ledger data into `data/imports/wise-ledger-import.json` when statement APIs are unavailable.
4. Run `npm run bootstrap:wise`.
5. Review [docs/treasury/capabilities.md](../treasury/capabilities.md).
6. Keep automation read-only until the probe confirms the rails you actually intend to use.

## Reminder

EU and UK PSD2 restrictions can remove capabilities even when a token exists. Capability flags matter more than intent.
