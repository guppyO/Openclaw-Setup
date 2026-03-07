#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-${REVENUE_OS_ENVIRONMENT:-stage}}"
ROOT_DIR="${REVENUE_OS_ROOT_DIR:-/opt/revenue-os}"

if [[ ! -d "$ROOT_DIR" ]]; then
  echo "Missing repo at $ROOT_DIR"
  exit 1
fi

cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.secrets/revenue-os.local.env" ]]; then
  set -a
  source "$ROOT_DIR/.secrets/revenue-os.local.env"
  set +a
fi

OPENCLAW_BIN="$("$ROOT_DIR/scripts/bootstrap/resolve-openclaw-bin.sh" "$ROOT_DIR")"
export OPENCLAW_BIN

npm run runtime:probe-models -- --active
npm run bootstrap:runtime -- --active-model-probe
npm run bootstrap:control-plane
bash scripts/bootstrap/sync-runtime-workspace.sh "$ENVIRONMENT"
npm run runtime:browser-broker
bash scripts/verify/validate-openclaw-config.sh "$ENVIRONMENT"
OPENCLAW_CONFIG_PATH="$ROOT_DIR/data/generated/openclaw/${ENVIRONMENT}.json" "$OPENCLAW_BIN" doctor

echo "Finalized OpenClaw auth for $ENVIRONMENT."
echo "Active model probe and control-plane regeneration have been refreshed from the live authenticated runtime."
