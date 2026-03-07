#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-${REVENUE_OS_ENVIRONMENT:-stage}}"
ROOT_DIR="${REVENUE_OS_ROOT_DIR:-/opt/revenue-os}"

for agent in ceo research builder distribution treasury skillsmith ops; do
  agent_dir="${ROOT_DIR}/agents/${agent}"
  workspace_dir="${ROOT_DIR}/runtime/${ENVIRONMENT}/workspace/${agent}"

  mkdir -p "${workspace_dir}" "${workspace_dir}/memory" "${workspace_dir}/initiatives"

  for file in SOUL.md AGENTS.md USER.md MEMORY.md HEARTBEAT.md; do
    if [[ -f "${agent_dir}/${file}" ]]; then
      install -m 0644 "${agent_dir}/${file}" "${workspace_dir}/${file}"
    fi
  done

  if [[ -d "${agent_dir}/initiatives" ]]; then
    rsync -a --delete "${agent_dir}/initiatives/" "${workspace_dir}/initiatives/"
  fi

  ln -sfn "${ROOT_DIR}/data" "${workspace_dir}/data"
done

printf 'Synced runtime workspace files for %s\n' "${ENVIRONMENT}"
