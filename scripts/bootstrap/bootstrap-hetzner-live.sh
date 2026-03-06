#!/usr/bin/env bash
set -euo pipefail

LIVE_VPS_HOST="${LIVE_VPS_HOST:-}"
LIVE_VPS_USER="${LIVE_VPS_USER:-root}"
LIVE_VPS_RUNTIME_USER="${LIVE_VPS_RUNTIME_USER:-revenueos}"
BOOTSTRAP_ENVIRONMENT="${BOOTSTRAP_ENVIRONMENT:-prod}"

if [[ -z "${REMOTE_REPO_DIR:-}" ]]; then
  REMOTE_REPO_DIR="/opt/revenue-os"
fi

if [[ -z "$LIVE_VPS_HOST" ]]; then
  echo "Set LIVE_VPS_HOST to the Hetzner VPS hostname or IP before running this script."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ssh "$LIVE_VPS_USER@$LIVE_VPS_HOST" "mkdir -p '$REMOTE_REPO_DIR'"
tar \
  --exclude="./.git" \
  --exclude="./node_modules" \
  --exclude="./dist" \
  --exclude="./data/backups" \
  --exclude="./.secrets/providers" \
  -C "$ROOT_DIR" -cf - . \
  | ssh "$LIVE_VPS_USER@$LIVE_VPS_HOST" "tar -xf - -C '$REMOTE_REPO_DIR'"

if [[ -f "$ROOT_DIR/.secrets/revenue-os.local.env" ]]; then
  ssh "$LIVE_VPS_USER@$LIVE_VPS_HOST" "mkdir -p '$REMOTE_REPO_DIR/.secrets'"
  scp "$ROOT_DIR/.secrets/revenue-os.local.env" "$LIVE_VPS_USER@$LIVE_VPS_HOST:$REMOTE_REPO_DIR/.secrets/revenue-os.local.env"
fi

ssh "$LIVE_VPS_USER@$LIVE_VPS_HOST" "cd '$REMOTE_REPO_DIR' && LIVE_VPS_RUNTIME_USER='$LIVE_VPS_RUNTIME_USER' REVENUE_OS_ROOT_DIR='$REMOTE_REPO_DIR' REVENUE_OS_ENVIRONMENT='$BOOTSTRAP_ENVIRONMENT' bash scripts/bootstrap/bootstrap-openclaw.sh '$BOOTSTRAP_ENVIRONMENT'"
