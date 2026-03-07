#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${REVENUE_OS_ROOT_DIR:-/opt/revenue-os}"
SERVICE_PATH="/etc/systemd/system/revenue-os-steel-loopback.service"

cat >"$SERVICE_PATH" <<EOF
[Unit]
Description=Revenue OS self-hosted Steel loopback hardening
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/env bash ${ROOT_DIR}/scripts/bootstrap/harden-steel-loopback.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now revenue-os-steel-loopback.service

echo "Installed revenue-os-steel-loopback.service"
