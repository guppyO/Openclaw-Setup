#!/usr/bin/env bash
set -euo pipefail

apt-get update
apt-get install -y curl git ca-certificates build-essential rsync

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

if ! command -v openclaw >/dev/null 2>&1; then
  npm install -g @openclaw/cli
fi

ROOT_DIR="${REVENUE_OS_ROOT_DIR:-/opt/revenue-os}"

if [[ ! -d "${ROOT_DIR}" ]]; then
  echo "Clone or sync the repo to ${ROOT_DIR} before continuing."
  exit 1
fi

cd "${ROOT_DIR}"
bash scripts/bootstrap/bootstrap-openclaw.sh "${REVENUE_OS_ENVIRONMENT:-stage}"
