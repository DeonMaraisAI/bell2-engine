#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="${TMPDIR:-/tmp}/bell2-engine-verify"
RELEASE_NAME="bell2-engine-v0.2.0.zip"
RELEASE_ZIP="$ROOT_DIR/release/$RELEASE_NAME"
RELEASE_B64="$ROOT_DIR/release/$RELEASE_NAME.b64"

fail() {
  printf '%s\n' "STATUS: DENIED" "REASON: $1"
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || fail "MISSING_TOOL:$1"
}

need bash
need sha256sum
need unzip
need diff
need rm
need mkdir
need grep
need awk
need base64

rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"

LOCAL_RELEASE_ZIP="$RELEASE_ZIP"
if [ ! -f "$LOCAL_RELEASE_ZIP" ]; then
  [ -f "$RELEASE_B64" ] || fail "MISSING_RELEASE_ARCHIVE"
  LOCAL_RELEASE_ZIP="$WORK_DIR/$RELEASE_NAME"
  base64 -d "$RELEASE_B64" > "$LOCAL_RELEASE_ZIP" || fail "RELEASE_DECODE_FAILED"
fi

EXPECTED_HASH="$(awk '$2 == "release/bell2-engine-v0.2.0.zip" { print $1 }' "$ROOT_DIR/hashes/SHA256SUMS")"
[ -n "$EXPECTED_HASH" ] || fail "MISSING_RELEASE_HASH"

printf '%s\n' '[1] Verifying release hash...'
printf '%s  %s\n' "$EXPECTED_HASH" "$LOCAL_RELEASE_ZIP" | sha256sum -c >/dev/null || fail "HASH_MISMATCH"

printf '%s\n' '[2] Extracting release...'
unzip -q "$LOCAL_RELEASE_ZIP" -d "$WORK_DIR" || fail "EXTRACTION_FAILED"

[ -f "$WORK_DIR/run.sh" ] || fail "MISSING_ENGINE_RUNNER"

printf '%s\n' '[3] Running engine...'
bash "$WORK_DIR/run.sh" > "$WORK_DIR/output.txt" || fail "ENGINE_EXECUTION_FAILED"

printf '%s\n' '[4] Comparing expected output...'
diff "$WORK_DIR/output.txt" "$ROOT_DIR/expected/expected.txt" >/dev/null || fail "OUTPUT_MISMATCH"

printf '%s\n' \
  'STATUS: VERIFIED_LOCAL' \
  'AUTHORITY: UNVERIFIED' \
  'ACCEPT_SHARED: FALSE' \
  'PROPAGATION: BLOCKED' \
  'NETWORK_UPDATE: BLOCKED'
