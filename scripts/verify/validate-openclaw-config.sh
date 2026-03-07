#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-${REVENUE_OS_ENVIRONMENT:-stage}}"
ROOT_DIR="${REVENUE_OS_ROOT_DIR:-/opt/revenue-os}"
CONFIG_PATH="${ROOT_DIR}/openclaw/${ENVIRONMENT}/openclaw.json"
ARTIFACT_PATH="${ROOT_DIR}/data/exports/openclaw-config-validate-${ENVIRONMENT}.json"

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "Missing OpenClaw config at $CONFIG_PATH"
  exit 1
fi

mkdir -p "$(dirname "$ARTIFACT_PATH")"

echo "Validating OpenClaw config for ${ENVIRONMENT} using ${CONFIG_PATH}"

if ! OPENCLAW_CONFIG_PATH="$CONFIG_PATH" openclaw config validate --json | tee "$ARTIFACT_PATH"; then
  echo "OpenClaw config validation failed for ${ENVIRONMENT}. See ${ARTIFACT_PATH}."
  exit 1
fi

echo "OpenClaw config validation passed for ${ENVIRONMENT}."
