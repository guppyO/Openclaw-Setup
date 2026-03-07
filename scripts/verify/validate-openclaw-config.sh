#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-${REVENUE_OS_ENVIRONMENT:-stage}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${REVENUE_OS_ROOT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

cd "$ROOT_DIR"

if [[ -x "$ROOT_DIR/node_modules/.bin/tsx" ]]; then
  "$ROOT_DIR/node_modules/.bin/tsx" scripts/verify/validate-openclaw-config.ts "$ENVIRONMENT"
else
  npx --yes tsx scripts/verify/validate-openclaw-config.ts "$ENVIRONMENT"
fi
