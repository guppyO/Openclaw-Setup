#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-${REVENUE_OS_ENVIRONMENT:-stage}}"
ROOT_DIR="${REVENUE_OS_ROOT_DIR:-/opt/revenue-os}"
RUNTIME_USER="${LIVE_VPS_RUNTIME_USER:-revenueos}"
INSTALL_CHANNEL="${OPENCLAW_INSTALL_CHANNEL:-source-pinned}"

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

case "$INSTALL_CHANNEL" in
  source-pinned|source-mainline|auto)
    SOURCE_REF="${OPENCLAW_SOURCE_REF:-84f5d7dc1d1b041382c126384c6eb28cad2f53fa}"
    if [[ "$INSTALL_CHANNEL" == "source-mainline" ]]; then
      SOURCE_REF="main"
    fi
    if ! sudo REVENUE_OS_ROOT_DIR="$ROOT_DIR" OPENCLAW_SOURCE_REF="$SOURCE_REF" bash "$ROOT_DIR/scripts/bootstrap/install-openclaw-source.sh"; then
      if [[ "$INSTALL_CHANNEL" == "auto" ]]; then
        echo "Warning: source-built OpenClaw install failed; falling back to globally installed openclaw." >&2
      else
        exit 1
      fi
    fi
    ;;
  release)
    ;;
  *)
    echo "Unsupported OPENCLAW_INSTALL_CHANNEL: $INSTALL_CHANNEL" >&2
    exit 1
    ;;
esac

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
  mkdir -p ~/.openclaw/credentials ~/.openclaw/agents/{ceo,research,builder,distribution,treasury,skillsmith,ops}/sessions
  chmod 700 ~/.openclaw
"

sudo -u "$RUNTIME_USER" -H bash -lc "
  set -euo pipefail
  cd '$ROOT_DIR'
  if [[ -f '$ROOT_DIR/.secrets/revenue-os.local.env' ]]; then
    set -a
    source '$ROOT_DIR/.secrets/revenue-os.local.env'
    set +a
  fi
  OPENCLAW_BIN=\"\$('$ROOT_DIR/scripts/bootstrap/resolve-openclaw-bin.sh' '$ROOT_DIR')\"
  export OPENCLAW_BIN
  npm ci
  npm run bootstrap:runtime
  npm run runtime:probe-models
  npm run bootstrap:control-plane
  bash scripts/bootstrap/sync-runtime-workspace.sh '$ENVIRONMENT'
  npm run runtime:render-openclaw-config -- --environment '$ENVIRONMENT'
  npm run bootstrap:state
  npm run bootstrap:wise
  npm run runtime:browser-broker
  npm run verify:openclaw-config -- '$ENVIRONMENT'
  OPENCLAW_CONFIG_PATH='$ROOT_DIR/data/generated/openclaw/$ENVIRONMENT.json' \"\$OPENCLAW_BIN\" doctor
"

sudo cp "openclaw/$ENVIRONMENT/systemd/"* /etc/systemd/system/
if command -v docker >/dev/null 2>&1; then
  sudo REVENUE_OS_ROOT_DIR="$ROOT_DIR" bash "$ROOT_DIR/scripts/bootstrap/install-steel-loopback-service.sh"
fi
sudo systemctl daemon-reload
sudo systemctl enable "revenue-os-$ENVIRONMENT.service"
sudo systemctl enable "revenue-os-$ENVIRONMENT-scheduler.timer"
sudo systemctl enable "revenue-os-$ENVIRONMENT-source-refresh.timer"
sudo systemctl enable "revenue-os-$ENVIRONMENT-backup.timer"

echo "OpenClaw installed for $ENVIRONMENT."
echo "Next interactive step: run the OpenClaw onboarding auth flow on the VPS, keep the existing config when prompted, then finalize the authenticated runtime and start the service:"
echo "sudo -u $RUNTIME_USER -H bash -lc 'cd $ROOT_DIR && openclaw onboard --auth-choice openai-codex'"
echo "sudo -u $RUNTIME_USER -H bash -lc 'cd $ROOT_DIR && bash scripts/bootstrap/finalize-openclaw-auth.sh $ENVIRONMENT'"
echo "sudo systemctl start revenue-os-$ENVIRONMENT.service"
echo "sudo systemctl start revenue-os-$ENVIRONMENT-scheduler.timer"
echo "sudo systemctl start revenue-os-$ENVIRONMENT-source-refresh.timer"
echo "sudo systemctl start revenue-os-$ENVIRONMENT-backup.timer"
echo "Windows browser host next steps:"
echo "1. Run scripts/bootstrap/start-gateway-ssh-tunnel.ps1 on Windows."
echo "2. Run scripts/bootstrap/bootstrap-openclaw-node-host.ps1 on Windows."
echo "3. Pair attached Chrome against the tunneled gateway URL and generated gateway token."
