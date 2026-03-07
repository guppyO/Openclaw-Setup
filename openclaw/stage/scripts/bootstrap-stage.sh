#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${REVENUE_OS_ROOT_DIR:-/opt/revenue-os}"
CONFIG="${ROOT_DIR}/openclaw/stage/openclaw.json"

cd "${ROOT_DIR}"

if [ -f "${ROOT_DIR}/.secrets/revenue-os.local.env" ]; then
  set -a
  source "${ROOT_DIR}/.secrets/revenue-os.local.env"
  set +a
fi

npm ci
npm run runtime:probe-models
npm run bootstrap:control-plane
npm run runtime:render-openclaw-config -- --environment stage --output "${ROOT_DIR}/data/generated/openclaw/stage.json"
npm run verify:openclaw-config -- stage
OPENCLAW_CONFIG_PATH="${ROOT_DIR}/data/generated/openclaw/stage.json" openclaw doctor
openclaw models auth login --provider openai-codex
bash scripts/bootstrap/finalize-openclaw-auth.sh stage

echo "Prepared stage gateway config at ${ROOT_DIR}/data/generated/openclaw/stage.json"
echo "Next: install systemd units from openclaw/stage/systemd into /etc/systemd/system and start revenue-os-stage.service"
