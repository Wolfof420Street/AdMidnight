#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
docker compose \
  -f "$SCRIPT_DIR/compose.midnight-node.yml" \
  -f "$SCRIPT_DIR/compose.proof-server.yml" \
  -f "$SCRIPT_DIR/compose.indexer.yml" \
  -f "$SCRIPT_DIR/compose.app-services.yml" \
  down -v --remove-orphans
echo "[AdMidnight] All volumes removed. Run start-dev.sh to restart clean."
