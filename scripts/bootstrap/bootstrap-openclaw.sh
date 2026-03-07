#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-${REVENUE_OS_ENVIRONMENT:-stage}}"
ROOT_DIR="${REVENUE_OS_ROOT_DIR:-/opt/revenue-os}"
RUNTIME_USER="${LIVE_VPS_RUNTIME_USER:-revenueos}"

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
  sudo npm install -g openclaw@latest
fi

if [[ "${INSTALL_TAILSCALE:-false}" == "true" ]] && ! command -v tailscale >/dev/null 2>&1; then
  curl -fsSL https://tailscale.com/install.sh | sh
fi

if ! id "$RUNTIME_USER" >/dev/null 2>&1; then
  sudo useradd --system --create-home --shell /bin/bash "$RUNTIME_USER"
fi

sudo mkdir -p "$ROOT_DIR" /etc/systemd/system
sudo chown -R "$RUNTIME_USER:$RUNTIME_USER" "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.secrets/revenue-os.local.env" ]]; then
  sudo chown "$RUNTIME_USER:$RUNTIME_USER" "$ROOT_DIR/.secrets/revenue-os.local.env"
  sudo chmod 600 "$ROOT_DIR/.secrets/revenue-os.local.env"
fi

sudo -u "$RUNTIME_USER" -H bash -lc "
  set -euo pipefail
  cd '$ROOT_DIR'
  if [[ -f '$ROOT_DIR/.secrets/revenue-os.local.env' ]]; then
    set -a
    source '$ROOT_DIR/.secrets/revenue-os.local.env'
    set +a
  fi
  npm ci
  npm run bootstrap:runtime
  npm run runtime:probe-models
  npm run bootstrap:control-plane
  npm run runtime:render-openclaw-config -- --environment '$ENVIRONMENT'
  npm run bootstrap:state
  npm run bootstrap:wise
  npm run runtime:browser-broker
  npm run verify:openclaw-config -- '$ENVIRONMENT'
  openclaw doctor
"

sudo cp "openclaw/$ENVIRONMENT/systemd/"* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable "revenue-os-$ENVIRONMENT.service"
sudo systemctl enable "revenue-os-$ENVIRONMENT-scheduler.timer"
sudo systemctl enable "revenue-os-$ENVIRONMENT-source-refresh.timer"
sudo systemctl enable "revenue-os-$ENVIRONMENT-backup.timer"

echo "OpenClaw installed for $ENVIRONMENT."
echo "Next interactive step: run 'openclaw models auth login --provider openai-codex' on the VPS, then finalize the authenticated runtime and start the service:"
echo "sudo -u $RUNTIME_USER -H bash -lc 'cd $ROOT_DIR && openclaw models auth login --provider openai-codex'"
echo "sudo -u $RUNTIME_USER -H bash -lc 'cd $ROOT_DIR && bash scripts/bootstrap/finalize-openclaw-auth.sh $ENVIRONMENT'"
echo "sudo systemctl start revenue-os-$ENVIRONMENT.service"
echo "sudo systemctl start revenue-os-$ENVIRONMENT-scheduler.timer"
echo "sudo systemctl start revenue-os-$ENVIRONMENT-source-refresh.timer"
echo "sudo systemctl start revenue-os-$ENVIRONMENT-backup.timer"
echo "Windows browser host next steps:"
echo "1. Run scripts/bootstrap/start-gateway-ssh-tunnel.ps1 on Windows."
echo "2. Run scripts/bootstrap/bootstrap-openclaw-node-host.ps1 on Windows."
echo "3. Pair attached Chrome against the tunneled gateway URL and generated gateway token."
