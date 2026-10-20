#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$PROJECT_DIR"
if [[ -d "QuestKeeper Setup.app" ]]; then
  exec open "QuestKeeper Setup.app"
fi
if [[ -x "questkeeper-setup" ]]; then
  exec ./questkeeper-setup
fi
exec ./setup.sh
