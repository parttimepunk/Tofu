#!/usr/bin/env bash
set -euo pipefail
MODE="${1:-run}"
APP_NAME="Tofu"
BUNDLE_ID="app.tofu.local"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
APP_BUNDLE="$ROOT_DIR/outputs/Tofu.app"
APP_MACOS="$APP_BUNDLE/Contents/MacOS"
APP_BINARY="$APP_MACOS/$APP_NAME"
swift build -j 4
BUILD_BINARY="$(swift build --show-bin-path)/$APP_NAME"
if [[ "$MODE" != "--build-only" ]]; then pkill -x "$APP_NAME" >/dev/null 2>&1 || true; fi
mkdir -p "$APP_MACOS"
cp "$BUILD_BINARY" "$APP_BINARY.next"
mv -f "$APP_BINARY.next" "$APP_BINARY"
chmod +x "$APP_BINARY"
mkdir -p "$APP_BUNDLE/Contents/Resources"
if [[ ! -f "$ROOT_DIR/work/Tofu.icns" || "$ROOT_DIR/script/make_icon.swift" -nt "$ROOT_DIR/work/Tofu.icns" ]]; then
  xcrun swift "$ROOT_DIR/script/make_icon.swift" "$ROOT_DIR/work/Tofu.iconset"
  /usr/bin/iconutil -c icns "$ROOT_DIR/work/Tofu.iconset" -o "$ROOT_DIR/work/Tofu.icns"
fi
cp "$ROOT_DIR/work/Tofu.icns" "$APP_BUNDLE/Contents/Resources/Tofu.icns"
cat >"$APP_BUNDLE/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>$APP_NAME</string>
<key>CFBundleIdentifier</key><string>$BUNDLE_ID</string>
<key>CFBundleName</key><string>Tofu</string>
<key>CFBundleDisplayName</key><string>Tofu</string>
<key>CFBundleIconFile</key><string>Tofu</string>
<key>CFBundleDevelopmentRegion</key><string>en</string>
<key>CFBundleLocalizations</key><array><string>en</string></array>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>0.1.0</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSMinimumSystemVersion</key><string>14.0</string>
<key>NSPrincipalClass</key><string>NSApplication</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
/usr/bin/codesign --force --sign - "$APP_BUNDLE"
case "$MODE" in
  run) /usr/bin/open -n "$APP_BUNDLE" ;;
  --debug|debug) lldb -- "$APP_BINARY" ;;
  --logs|logs) /usr/bin/open -n "$APP_BUNDLE"; /usr/bin/log stream --info --style compact --predicate "process == \"$APP_NAME\"" ;;
  --telemetry|telemetry) /usr/bin/open -n "$APP_BUNDLE"; /usr/bin/log stream --info --style compact --predicate "subsystem == \"$BUNDLE_ID\"" ;;
  --verify|verify) /usr/bin/open -n "$APP_BUNDLE"; sleep 1; pgrep -x "$APP_NAME" >/dev/null; echo "Tofu is running" ;;
  --build-only) echo "$APP_BUNDLE" ;;
  *) echo "usage: $0 [run|--debug|--logs|--telemetry|--verify|--build-only]" >&2; exit 2 ;;
esac
