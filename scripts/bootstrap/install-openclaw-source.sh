#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${REVENUE_OS_ROOT_DIR:-/opt/revenue-os}"
SOURCE_DIR="${OPENCLAW_SOURCE_DIR:-${ROOT_DIR}/vendor/openclaw-source}"
SOURCE_REPO="${OPENCLAW_SOURCE_REPO:-https://github.com/openclaw/openclaw.git}"
SOURCE_REF="${OPENCLAW_SOURCE_REF:-84f5d7dc1d1b041382c126384c6eb28cad2f53fa}"
PNPM_VERSION="${OPENCLAW_SOURCE_PNPM_VERSION:-10.23.0}"
ENV_FILE="${ROOT_DIR}/.secrets/revenue-os.local.env"

mkdir -p "$(dirname "$SOURCE_DIR")"
git config --global --add safe.directory "$SOURCE_DIR" >/dev/null 2>&1 || true

if [[ -d "${SOURCE_DIR}/.git" ]]; then
  git -C "$SOURCE_DIR" fetch --depth 1 origin "$SOURCE_REF"
else
  git clone --depth 1 "$SOURCE_REPO" "$SOURCE_DIR"
fi

git -C "$SOURCE_DIR" checkout --force "$SOURCE_REF"

corepack enable >/dev/null 2>&1 || true
corepack prepare "pnpm@${PNPM_VERSION}" --activate >/dev/null 2>&1

cd "$SOURCE_DIR"
pnpm install --frozen-lockfile
pnpm rebuild node-llama-cpp || true
pnpm build
pnpm ui:build

mkdir -p "$SOURCE_DIR/bin"
cat > "$SOURCE_DIR/bin/openclaw-source" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
exec node "$ROOT_DIR/openclaw.mjs" "$@"
EOF
chmod +x "$SOURCE_DIR/bin/openclaw-source"

if [[ -f "$ENV_FILE" ]]; then
  python3 - "$ENV_FILE" "$SOURCE_DIR/bin/openclaw-source" "$SOURCE_REF" <<'PY'
import json
import sys
from pathlib import Path

env_path = Path(sys.argv[1])
wrapper = sys.argv[2]
source_ref = sys.argv[3]

lines = env_path.read_text(encoding="utf-8").splitlines()
replacements = {
    "OPENCLAW_BIN": wrapper,
    "OPENCLAW_INSTALL_CHANNEL": "source-pinned",
    "OPENCLAW_SOURCE_REF": source_ref,
    "OPENCLAW_MODEL_PRIMARY": "openai-codex/gpt-5.4",
    "OPENCLAW_MODEL_DEEP": "openai-codex/gpt-5.4",
    "OPENCLAW_MODEL_FALLBACK": "openai-codex/gpt-5.4",
}
seen = set()
updated = []
for line in lines:
    if "=" not in line or line.lstrip().startswith("#"):
        updated.append(line)
        continue
    key, _, _value = line.partition("=")
    if key in replacements:
        updated.append(f"{key}={json.dumps(replacements[key])}")
        seen.add(key)
    else:
        updated.append(line)
for key, value in replacements.items():
    if key not in seen:
        updated.append(f"{key}={json.dumps(value)}")
env_path.write_text("\n".join(updated).strip() + "\n", encoding="utf-8")
PY
fi

printf 'Installed source-built OpenClaw at %s (ref %s)\n' "$SOURCE_DIR" "$SOURCE_REF"
