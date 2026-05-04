#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_ROOT="${TMPDIR:-/tmp}/bell2-engine-negative-tests"

run_denial_test() {
  local name="$1"
  local mutate="$2"
  local case_dir="$TMP_ROOT/$name"

  rm -rf "$case_dir"
  mkdir -p "$case_dir"
  cp -R "$ROOT_DIR"/. "$case_dir"/

  bash -c "cd '$case_dir' && $mutate"

  if bash "$case_dir/verify/verify.sh" >/tmp/bell2-negative-output.txt 2>&1; then
    echo "NEGATIVE_TEST_FAILED: $name"
    cat /tmp/bell2-negative-output.txt
    exit 1
  fi

  if ! grep -q 'STATUS: DENIED' /tmp/bell2-negative-output.txt; then
    echo "NEGATIVE_TEST_NO_DENIAL_STATUS: $name"
    cat /tmp/bell2-negative-output.txt
    exit 1
  fi

  echo "NEGATIVE_TEST_PASS: $name"
}

rm -rf "$TMP_ROOT"
mkdir -p "$TMP_ROOT"

run_denial_test "tampered_expected" "printf '%s\n' 'TAMPERED=TRUE' >> expected/expected.txt"
run_denial_test "tampered_release" "printf '%s\n' '# tampered' >> release/bell2-engine-v0.2.0.zip.b64"

echo "FAIL_CLOSED_TESTS: PASS"
