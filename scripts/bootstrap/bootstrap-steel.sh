#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.secrets/revenue-os.local.env" ]]; then
  set -a
  source "$ROOT_DIR/.secrets/revenue-os.local.env"
  set +a
fi

if [[ -z "${STEEL_BASE_URL:-}" && -z "${STEEL_API_KEY:-}" ]]; then
  echo "Steel is not configured yet. Add STEEL_BASE_URL and STEEL_API_KEY (or your self-hosted base URL) to .secrets/revenue-os.local.env first."
  exit 1
fi

npm run runtime:browser-broker
echo "Steel browser broker state refreshed."
