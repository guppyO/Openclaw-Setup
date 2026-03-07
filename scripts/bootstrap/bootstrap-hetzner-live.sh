#!/usr/bin/env bash
set -euo pipefail

LIVE_VPS_HOST="${LIVE_VPS_HOST:-}"
LIVE_VPS_USER="${LIVE_VPS_USER:-root}"
LIVE_VPS_SSH_KEY="${LIVE_VPS_SSH_KEY:-}"
LIVE_VPS_RUNTIME_USER="${LIVE_VPS_RUNTIME_USER:-revenueos}"
BOOTSTRAP_ENVIRONMENT="${BOOTSTRAP_ENVIRONMENT:-stage}"
OPENCLAW_INSTALL_CHANNEL="${OPENCLAW_INSTALL_CHANNEL:-source-pinned}"
OPENCLAW_SOURCE_REF="${OPENCLAW_SOURCE_REF:-84f5d7dc1d1b041382c126384c6eb28cad2f53fa}"

if [[ -z "${REMOTE_REPO_DIR:-}" ]]; then
  REMOTE_REPO_DIR="/opt/revenue-os"
fi

if [[ -z "$LIVE_VPS_HOST" ]]; then
  echo "Set LIVE_VPS_HOST to the Hetzner VPS hostname or IP before running this script."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SSH_ARGS=()

if [[ -n "$LIVE_VPS_SSH_KEY" ]]; then
  SSH_ARGS+=(-i "$LIVE_VPS_SSH_KEY")
fi

ssh "${SSH_ARGS[@]}" "$LIVE_VPS_USER@$LIVE_VPS_HOST" "mkdir -p '$REMOTE_REPO_DIR'"
tar \
  --exclude="./.git" \
  --exclude="./node_modules" \
  --exclude="./dist" \
  --exclude="./data/backups" \
  --exclude="./.secrets/providers" \
  -C "$ROOT_DIR" -cf - . \
  | ssh "${SSH_ARGS[@]}" "$LIVE_VPS_USER@$LIVE_VPS_HOST" "tar -xf - -C '$REMOTE_REPO_DIR'"

if [[ -f "$ROOT_DIR/.secrets/revenue-os.local.env" ]]; then
  ssh "${SSH_ARGS[@]}" "$LIVE_VPS_USER@$LIVE_VPS_HOST" "mkdir -p '$REMOTE_REPO_DIR/.secrets'"
  scp "${SSH_ARGS[@]}" "$ROOT_DIR/.secrets/revenue-os.local.env" "$LIVE_VPS_USER@$LIVE_VPS_HOST:$REMOTE_REPO_DIR/.secrets/revenue-os.local.env"
fi

ssh "${SSH_ARGS[@]}" "$LIVE_VPS_USER@$LIVE_VPS_HOST" "cd '$REMOTE_REPO_DIR' && LIVE_VPS_RUNTIME_USER='$LIVE_VPS_RUNTIME_USER' REVENUE_OS_ROOT_DIR='$REMOTE_REPO_DIR' REVENUE_OS_ENVIRONMENT='$BOOTSTRAP_ENVIRONMENT' OPENCLAW_INSTALL_CHANNEL='$OPENCLAW_INSTALL_CHANNEL' OPENCLAW_SOURCE_REF='$OPENCLAW_SOURCE_REF' bash scripts/bootstrap/bootstrap-openclaw.sh '$BOOTSTRAP_ENVIRONMENT'"

echo "Repo synced to $LIVE_VPS_HOST:$REMOTE_REPO_DIR for $BOOTSTRAP_ENVIRONMENT."
echo "Next on the VPS: complete OpenClaw OAuth and then run scripts/bootstrap/finalize-openclaw-auth.sh $BOOTSTRAP_ENVIRONMENT as $LIVE_VPS_RUNTIME_USER."
echo "Next on Windows: run scripts/bootstrap/start-gateway-ssh-tunnel.ps1 and scripts/bootstrap/bootstrap-openclaw-node-host.ps1."
