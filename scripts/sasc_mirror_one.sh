#!/usr/bin/env bash
set -euo pipefail
MD5EXT="${1:-}"
[[ -z "$MD5EXT" ]] && { echo "Usage: $0 <md5.ext>"; exit 1; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
mkdir -p "$ROOT/static/assets" "$ROOT/cdn-assets"

URLS=(
  "https://assets.scratch.mit.edu/internalapi/asset/${MD5EXT}/get/"
  "https://cdn.assets.scratch.mit.edu/internalapi/asset/${MD5EXT}/get/"
)

OK=""
for u in "${URLS[@]}"; do
  echo "GET $u"
  for t in 1 2 3 4 5; do
    if curl -fLsS -H "User-Agent: sasc-mirror/1.0" -o "$ROOT/cdn-assets/${MD5EXT}.part" "$u"; then
      OK="yes"; break
    fi
    sleep $((t*t))
  done
  [[ -n "$OK" ]] && break
done

[[ -z "$OK" ]] && { echo "✗ failed to fetch $MD5EXT"; exit 2; }

mv "$ROOT/cdn-assets/${MD5EXT}.part" "$ROOT/static/assets/${MD5EXT}"
echo "✓ published static/assets/${MD5EXT}"
