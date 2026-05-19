#!/usr/bin/env bash

set -euo pipefail

URL=${1:?Usage: $0 <url> [--timeout=N] [--post-graphql]}
shift || true
TIMEOUT=30
POST_GRAPHQL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --timeout=*) TIMEOUT=${1#--timeout=}; shift ;;
    --timeout) TIMEOUT=${2:?Missing value for --timeout}; shift 2 ;;
    --post-graphql) POST_GRAPHQL=true; shift ;;
    *) shift ;;
  esac
done

echo "Waiting for HTTP endpoint $URL (timeout ${TIMEOUT}s)"
START=$(date +%s)

# Validate TIMEOUT is a positive integer
if ! [[ "$TIMEOUT" =~ ^[0-9]+$ ]]; then
  echo "Invalid --timeout value: ${TIMEOUT}. Must be a positive integer." >&2
  exit 2
fi

# Per-request timeout (seconds) to avoid single curl hanging; keep small relative to overall TIMEOUT
REQUEST_TIMEOUT=5
if [[ "$TIMEOUT" -lt "$REQUEST_TIMEOUT" ]]; then
  REQUEST_TIMEOUT="$TIMEOUT"
fi
while true; do
  if [[ "$POST_GRAPHQL" == true ]]; then
    if curl -fsS -X POST -H 'Content-Type: application/json' --data '{"query":"{ __typename }"}' --max-time "$REQUEST_TIMEOUT" "$URL" >/dev/null 2>&1; then
      echo "$URL is available"
      exit 0
    fi
  else
    if curl -fsS --max-time "$REQUEST_TIMEOUT" "$URL" >/dev/null 2>&1; then
      echo "$URL is available"
      exit 0
    fi
  fi

  NOW=$(date +%s)
  ELAPSED=$((NOW - START))
  if [[ "$ELAPSED" -ge "$TIMEOUT" ]]; then
    echo "Timeout waiting for $URL" >&2
    exit 1
  fi

  sleep 1
done