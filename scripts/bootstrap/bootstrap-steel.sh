#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.secrets/revenue-os.local.env" ]]; then
  set -a
  source "$ROOT_DIR/.secrets/revenue-os.local.env"
  set +a
fi

if [[ "${STEEL_MODE:-}" == "cloud" ]]; then
  if [[ -z "${STEEL_API_KEY:-}" ]]; then
    echo "Steel cloud mode requires STEEL_API_KEY."
    exit 1
  fi
elif [[ "${STEEL_MODE:-}" == "self-hosted" ]]; then
  if [[ "${STEEL_SELF_HOSTED_PUBLIC_READY:-}" == "true" ]]; then
    if [[ -z "${STEEL_BASE_URL:-}" || ! "${STEEL_BASE_URL}" =~ ^https?://(127\.0\.0\.1|localhost)(:|/|$) ]]; then
      echo "Steel self-hosted public mode requires a loopback STEEL_BASE_URL such as http://127.0.0.1:4300."
      exit 1
    fi
  elif [[ -z "${STEEL_BASE_URL:-}" || ( -z "${STEEL_SELF_HOSTED_TOKEN:-}" && -z "${STEEL_API_KEY:-}" ) ]]; then
    echo "Steel self-hosted mode requires STEEL_BASE_URL plus STEEL_SELF_HOSTED_TOKEN or STEEL_API_KEY."
    exit 1
  fi
elif [[ -z "${STEEL_BASE_URL:-}" && -z "${STEEL_API_KEY:-}" ]]; then
  echo "Steel is not configured yet. Set STEEL_MODE plus the matching auth variables in .secrets/revenue-os.local.env first."
  exit 1
fi

npm run runtime:browser-broker
echo "Steel browser broker state refreshed."
