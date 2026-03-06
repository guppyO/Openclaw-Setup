# Treasury Policy

## Modes

- `sample`: no live credentials or live treasury ingest available
- `browser-only`: login-level credentials exist, but balance or statement ingest is not yet live
- `live-api`: personal-token or supported API ingest is live
- `hybrid-live`: API and browser lanes are both available

## Spend envelopes

- Hosting and infrastructure: allowed inside a bounded monthly cap.
- Domains and publishing fees: allowed only when tied to an active initiative.
- Paid acquisition tests: capped, tagged, and disabled by default until live ROI data exists.
- Unknown merchants or categories: freeze immediately.

## Required controls

- daily, weekly, and monthly caps,
- initiative and category tags on every spend,
- suspicious-spend detection,
- immediate freeze on out-of-envelope or unclassified charges,
- runway and recurring-burn refresh at least daily.

## FX policy

- Use cached FX files when present.
- Mark FX as missing or stale when no rate file is available.
- Do not apply hidden hardcoded conversion factors in dashboard or treasury calculations.
