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
while true; do
  if [[ "$POST_GRAPHQL" == true ]]; then
    if curl -fsS -X POST -H 'Content-Type: application/json' --data '{"query":"{ __typename }"}' "$URL" >/dev/null 2>&1; then
      echo "$URL is available"
      exit 0
    fi
  else
    if curl -fsS "$URL" >/dev/null 2>&1; then
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