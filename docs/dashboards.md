# Dashboards

The local dashboard lives in `dashboards/app/server.ts` and reads state from `data/exports/`.

## Shown today

- treasury balance, burn, and runway,
- top opportunities,
- active experiments,
- autonomy queue,
- agent pulse,
- skill pipeline,
- runtime anchor drift.

## Usage

- Start with `npm run dashboard`.
- Open `http://localhost:4310`.
- Refresh data by rerunning the bootstrap or recurring scripts.
