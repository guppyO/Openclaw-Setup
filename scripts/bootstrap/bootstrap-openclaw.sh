#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-${REVENUE_OS_ENVIRONMENT:-prod}}"
ROOT_DIR="${REVENUE_OS_ROOT_DIR:-$HOME/revenue-os}"

if [[ ! -d "$ROOT_DIR" ]]; then
  echo "Missing repo at $ROOT_DIR"
  exit 1
fi

sudo apt-get update
sudo apt-get install -y curl git ca-certificates build-essential rsync

if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'process.versions.node.split(`.`)[0]')" -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v openclaw >/dev/null 2>&1; then
  sudo npm install -g @openclaw/cli
fi

if [[ "${INSTALL_TAILSCALE:-false}" == "true" ]] && ! command -v tailscale >/dev/null 2>&1; then
  curl -fsSL https://tailscale.com/install.sh | sh
fi

cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.secrets/revenue-os.local.env" ]]; then
  set -a
  source "$ROOT_DIR/.secrets/revenue-os.local.env"
  set +a
fi

npm ci
npm run runtime:probe-models
npm run bootstrap:control-plane
npm run bootstrap:state
npm run bootstrap:wise
npm run runtime:browser-broker
openclaw doctor

mkdir -p "$HOME/.config/systemd/user"
cp "openclaw/$ENVIRONMENT/systemd/"* "$HOME/.config/systemd/user/"
systemctl --user daemon-reload
systemctl --user enable "revenue-os-$ENVIRONMENT.service"
systemctl --user enable "revenue-os-$ENVIRONMENT-scheduler.timer"
systemctl --user enable "revenue-os-$ENVIRONMENT-source-refresh.timer"
systemctl --user enable "revenue-os-$ENVIRONMENT-backup.timer"

echo "OpenClaw installed for $ENVIRONMENT."
echo "Next interactive step: run 'openclaw models auth login --provider openai-codex' on the VPS and then start the service:"
echo "systemctl --user start revenue-os-$ENVIRONMENT.service"
echo "systemctl --user start revenue-os-$ENVIRONMENT-scheduler.timer"
echo "systemctl --user start revenue-os-$ENVIRONMENT-source-refresh.timer"
echo "systemctl --user start revenue-os-$ENVIRONMENT-backup.timer"
