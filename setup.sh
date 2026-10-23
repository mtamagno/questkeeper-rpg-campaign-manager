#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

if [[ -x "questkeeper-setup" ]]; then
  exec ./questkeeper-setup
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install Node.js 26 from https://nodejs.org/"
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || true)"
if [[ "$NODE_MAJOR" != "26" ]]; then
  echo "QuestKeeper requires Node.js 26; found $(node --version 2>/dev/null || echo unknown)."
  echo "Install Node.js 26 from https://nodejs.org/ or use a native QuestKeeper release."
  exit 1
fi

if [[ ! -f node_modules/.package-lock.json ]]; then
  echo "Preparing QuestKeeper for the first run..."
  npm ci
fi

exec node tools/campaign-manager/server.mjs --open
