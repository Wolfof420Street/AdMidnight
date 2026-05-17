#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "[AdMidnight] Starting local dev stack..."
echo "[AdMidnight] Generating INDEXER_SECRET if not set..."

# Auto-generate INDEXER_SECRET if missing (local dev only)
if [ -z "${INDEXER_SECRET:-}" ]; then
  export INDEXER_SECRET=$(openssl rand -hex 32)
  echo "INDEXER_SECRET=$INDEXER_SECRET" >> "$ROOT_DIR/.env"
  echo "[AdMidnight] Generated INDEXER_SECRET and saved to .env"
fi

# Start all services
docker compose \
  -f "$SCRIPT_DIR/compose.midnight-node.yml" \
  -f "$SCRIPT_DIR/compose.proof-server.yml" \
  -f "$SCRIPT_DIR/compose.indexer.yml" \
  -f "$SCRIPT_DIR/compose.app-services.yml" \
  up -d

echo "[AdMidnight] Stack started. API at http://localhost:3001"
echo "[AdMidnight] Indexer GraphQL at http://localhost:8088/api/v1/graphql"
echo "[AdMidnight] Proof server at http://localhost:6300"
