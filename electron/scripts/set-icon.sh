#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: ./scripts/set-icon.sh /path/to/your/icon.png"
  exit 1
fi

SOURCE="$1"
DEST="$(cd "$(dirname "$0")/.." && pwd)/build/icon.png"

if [[ ! -f "$SOURCE" ]]; then
  echo "File not found: $SOURCE"
  exit 1
fi

cp "$SOURCE" "$DEST"
echo "Icon copied to $DEST"
echo "Run: npm run dist"
