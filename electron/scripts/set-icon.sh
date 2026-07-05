#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: ./scripts/set-icon.sh /path/to/your/icon.png|.jpg"
  exit 1
fi

SOURCE="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/build/icon.png"
TMP="$(mktemp /tmp/irlday-icon.XXXXXX.png)"

if [[ ! -f "$SOURCE" ]]; then
  echo "File not found: $SOURCE"
  exit 1
fi

sips -s format png "$SOURCE" --out "$TMP" >/dev/null
# Center-crop to square, then resize for app-store style icons
H=$(sips -g pixelHeight "$TMP" | awk '/pixelHeight/{print $2}')
W=$(sips -g pixelWidth "$TMP" | awk '/pixelWidth/{print $2}')
SIDE=$(( W < H ? W : H ))
sips -c "$SIDE" "$SIDE" "$TMP" --out "$TMP" >/dev/null
sips -z 1024 1024 "$TMP" --out "$DEST" >/dev/null
rm -f "$TMP"

echo "Icon copied to $DEST"
echo "Run: npm run dist"
