#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-${REVENUE_OS_ROOT_DIR:-/opt/revenue-os}}"

if [[ -n "${OPENCLAW_BIN:-}" ]]; then
  printf '%s\n' "$OPENCLAW_BIN"
  exit 0
fi

SOURCE_WRAPPER="${ROOT_DIR}/vendor/openclaw-source/bin/openclaw-source"
if [[ -x "$SOURCE_WRAPPER" ]]; then
  printf '%s\n' "$SOURCE_WRAPPER"
  exit 0
fi

if command -v openclaw >/dev/null 2>&1; then
  command -v openclaw
  exit 0
fi

printf '%s\n' "openclaw"
