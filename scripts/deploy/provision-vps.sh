#!/usr/bin/env bash
set -euo pipefail

apt-get update
apt-get install -y curl git ca-certificates build-essential rsync

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

if ! command -v openclaw >/dev/null 2>&1; then
  npm install -g @openclaw/cli
fi

if [[ ! -d "${HOME}/revenue-os" ]]; then
  echo "Clone or sync the repo to ${HOME}/revenue-os before continuing."
  exit 1
fi

cd "${HOME}/revenue-os"
bash scripts/bootstrap/bootstrap-openclaw.sh "${REVENUE_OS_ENVIRONMENT:-stage}"
