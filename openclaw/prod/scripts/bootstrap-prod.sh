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

if [[ "${OPENCLAW_INSTALL_CHANNEL:-source-pinned}" != "release" ]]; then
  OPENCLAW_SOURCE_REF="${OPENCLAW_SOURCE_REF:-84f5d7dc1d1b041382c126384c6eb28cad2f53fa}" REVENUE_OS_ROOT_DIR="${ROOT_DIR}" bash scripts/bootstrap/install-openclaw-source.sh
fi

OPENCLAW_BIN="$("${ROOT_DIR}/scripts/bootstrap/resolve-openclaw-bin.sh" "${ROOT_DIR}")"
export OPENCLAW_BIN

npm ci
npm run runtime:probe-models
npm run bootstrap:control-plane
npm run runtime:render-openclaw-config -- --environment prod --output "${ROOT_DIR}/data/generated/openclaw/prod.json"
npm run verify:openclaw-config -- prod
OPENCLAW_CONFIG_PATH="${ROOT_DIR}/data/generated/openclaw/prod.json" "${OPENCLAW_BIN}" doctor
"${OPENCLAW_BIN}" onboard --auth-choice openai-codex
bash scripts/bootstrap/finalize-openclaw-auth.sh prod

echo "Prepared prod gateway config at ${ROOT_DIR}/data/generated/openclaw/prod.json"
echo "Next: install systemd units from openclaw/prod/systemd into /etc/systemd/system and start revenue-os-prod.service"
