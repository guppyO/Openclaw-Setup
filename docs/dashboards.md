# Dashboards

The local dashboard lives in `dashboards/app/server.ts` and reads file-backed state from `data/exports/`.

## Primary panels

- treasury mode, balances, burn, runway, and suspicious spend
- top opportunities and active experiments
- dispatch next task, ready queue, and recovery actions
- browser fabric status across managed, attached Chrome, and Steel
- model-policy state and runtime anchor drift
- skill pipeline and agent pulse
- explicit blockers that still need operator action

## Data freshness

- `npm run bootstrap:state` refreshes portfolio, experiments, account registry, and dashboard state
- `npm run bootstrap:wise` refreshes treasury mode and capability state
- `npm run runtime:browser-broker` refreshes browser lane state
- `npm run runtime:scheduler` refreshes dispatch state

## Use

- Start with `npm run dashboard`
- Open `http://localhost:4310`
- Re-run the runtime scripts or timers instead of manually editing exported JSON
