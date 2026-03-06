# Wise Bootstrap

1. Decide whether the setup will use a personal token or partner OAuth 2.0.
2. Export `WISE_API_TOKEN` and `WISE_PROFILE_ID` if using the personal-token path.
3. Run `npm run bootstrap:wise`.
4. Review [docs/treasury/capabilities.md](/C:/Users/beres/Desktop/openclaw%20setup/docs/treasury/capabilities.md).
5. Keep automation read-only until the probe confirms the desired rails.

## Reminder

EU and UK PSD2 restrictions can remove capabilities even when a token exists. Capability flags matter more than intent.
