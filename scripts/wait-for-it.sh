#!/usr/bin/env bash
# Wait-for-it style health check script (lightweight)
# Usage: ./wait-for-it.sh host:port --timeout=30 -- command

set -euo pipefail

TARGET=$1
shift || true
TIMEOUT=30

while [[ "$1" == --* ]]; do
  case "$1" in
    --timeout=*) TIMEOUT=${1#--timeout=}; shift ;;
    --timeout) TIMEOUT=$2; shift 2 ;;
    --) shift; break ;;
    *) shift ;;
  esac
done

HOST=$(echo "$TARGET" | cut -d: -f1)
PORT=$(echo "$TARGET" | cut -d: -f2)

echo "Waiting for $HOST:$PORT (timeout ${TIMEOUT}s)"
START=$(date +%s)
while true; do
  if nc -z "$HOST" "$PORT" >/dev/null 2>&1; then
    echo "$HOST:$PORT is available"
    break
  fi
  NOW=$(date +%s)
  ELAPSED=$((NOW - START))
  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "Timeout waiting for $HOST:$PORT" >&2
    exit 1
  fi
  sleep 1
done

if [ "$#" -gt 0 ]; then
  exec "$@"
fi
