#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/revenue-os"
CONFIG="${ROOT_DIR}/openclaw/lab/openclaw.json"

cd "${ROOT_DIR}"

openclaw doctor
openclaw models auth login --provider openai-codex
openclaw config get model.primary
openclaw config get agents.defaults.workspace

echo "Bootstrap lab config: ${CONFIG}"
echo "Next: install the systemd unit from openclaw/lab/systemd/"
