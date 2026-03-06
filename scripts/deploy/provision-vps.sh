#!/usr/bin/env bash
set -euo pipefail

apt-get update
apt-get install -y curl git ca-certificates build-essential

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

if ! command -v openclaw >/dev/null 2>&1; then
  npm install -g @openclaw/cli
fi

echo "Clone the repo to ~/revenue-os and run openclaw/stage/scripts/bootstrap-stage.sh first."
