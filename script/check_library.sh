#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
mkdir -p work/verification
xcrun swiftc -swift-version 5 -parse-as-library \
  Sources/Tofu/Models/LibraryItem.swift \
  Sources/Tofu/Services/LibraryDisk.swift \
  Sources/Tofu/Stores/LibraryStore.swift \
  Tests/RuntimeChecks.swift \
  -o work/verification/TofuLibraryChecks
work/verification/TofuLibraryChecks
