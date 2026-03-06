#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/revenue-os"
CONFIG="${ROOT_DIR}/openclaw/lab/openclaw.json"

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

echo "Prepared lab gateway config at ${CONFIG}"
echo "Next: install openclaw/lab/systemd/revenue-os-lab.service"
