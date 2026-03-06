#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${REVENUE_OS_ROOT_DIR:-/opt/revenue-os}"
CONFIG="${ROOT_DIR}/openclaw/prod/openclaw.json"

cd "${ROOT_DIR}"

if [ -f "${ROOT_DIR}/.secrets/revenue-os.local.env" ]; then
  set -a
  source "${ROOT_DIR}/.secrets/revenue-os.local.env"
  set +a
fi

npm ci
npm run runtime:probe-models
npm run bootstrap:control-plane
openclaw doctor
openclaw models auth login --provider openai-codex

echo "Prepared prod gateway config at ${CONFIG}"
echo "Next: install systemd units from openclaw/prod/systemd into /etc/systemd/system and start revenue-os-prod.service"
