#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
DIST="$ROOT/dist"
VERSION=$(python3 -c "import json; print(json.load(open('$ROOT/manifest.json'))['version'])")
GECKO_ID="ui-tools@nicepage.dev"

# Extension files to include
FILES="manifest.json devtools.html devtools.js panel.html icons src"

rm -rf "$DIST"

# Chrome: straight copy
echo "Building Chrome extension..."
mkdir -p "$DIST/chrome"
for f in $FILES; do cp -r "$ROOT/$f" "$DIST/chrome/"; done

# Firefox: copy then patch manifest
echo "Building Firefox extension..."
mkdir -p "$DIST/firefox"
for f in $FILES; do cp -r "$ROOT/$f" "$DIST/firefox/"; done

python3 -c "
import json
path = '$DIST/firefox/manifest.json'
m = json.load(open(path))
m['browser_specific_settings'] = {
    'gecko': {
        'id': '$GECKO_ID',
        'strict_min_version': '128.0'
    }
}
json.dump(m, open(path, 'w'), indent=2)
print('  Patched Firefox manifest with gecko settings')
"

# Zip for store submission
echo "Creating zip archives..."
(cd "$DIST/chrome" && zip -rq "$DIST/ui-tools-chrome-v$VERSION.zip" .)
(cd "$DIST/firefox" && zip -rq "$DIST/ui-tools-firefox-v$VERSION.zip" .)

echo ""
echo "Built v$VERSION:"
echo "  dist/chrome/                         (load unpacked in chrome://extensions)"
echo "  dist/firefox/                        (load in about:debugging)"
echo "  dist/ui-tools-chrome-v$VERSION.zip   (Chrome Web Store)"
echo "  dist/ui-tools-firefox-v$VERSION.zip  (Firefox Add-ons)"
