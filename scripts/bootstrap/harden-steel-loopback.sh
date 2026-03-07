#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${STEEL_CONTAINER_NAME:-steel}"
PORTS=(${STEEL_LOOPBACK_PORTS:-3000 9222})

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not installed; skipping Steel loopback hardening."
  exit 0
fi

if ! docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  echo "Steel container '$CONTAINER_NAME' is not present; skipping loopback hardening."
  exit 0
fi

if ! command -v iptables >/dev/null 2>&1; then
  echo "iptables is not installed; cannot harden Steel loopback access."
  exit 1
fi

for port in "${PORTS[@]}"; do
  if ! iptables -C INPUT -p tcp ! -s 127.0.0.1 --dport "$port" -j DROP >/dev/null 2>&1; then
    iptables -I INPUT 1 -p tcp ! -s 127.0.0.1 --dport "$port" -j DROP
  fi

  if command -v ip6tables >/dev/null 2>&1; then
    if ! ip6tables -C INPUT -p tcp ! -s ::1 --dport "$port" -j DROP >/dev/null 2>&1; then
      ip6tables -I INPUT 1 -p tcp ! -s ::1 --dport "$port" -j DROP
    fi
  fi
done

echo "Applied loopback-only Steel firewall rules for ports: ${PORTS[*]}"
