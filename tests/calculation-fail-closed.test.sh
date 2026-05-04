#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cp "$ROOT_DIR/receipts/example-calculation.receipt.json" "$TMP_DIR/receipt.json"
node "$ROOT_DIR/scripts/verify-calculation.js" "$TMP_DIR/receipt.json" | grep -q 'CALCULATION: VERIFIED'

run_denied_case() {
  local name="$1"
  local expected="$2"
  local mutate="$3"
  cp "$ROOT_DIR/receipts/example-calculation.receipt.json" "$TMP_DIR/$name.json"
  node -e "$mutate" "$TMP_DIR/$name.json"
  if node "$ROOT_DIR/scripts/verify-calculation.js" "$TMP_DIR/$name.json" >"$TMP_DIR/$name.out" 2>&1; then
    echo "FAIL_CLOSED_ERROR: $name verified"
    exit 1
  fi
  grep -q "DENIED: $expected" "$TMP_DIR/$name.out"
  echo "NEGATIVE_TEST_PASS: $name"
}

run_denied_case 'tampered_result' 'result_mismatch' 'const fs=require("fs"); const p=process.argv[1]; const j=JSON.parse(fs.readFileSync(p,"utf8")); j.result="51"; fs.writeFileSync(p, JSON.stringify(j,null,2));'
run_denied_case 'tampered_input' 'input_hash_mismatch' 'const fs=require("fs"); const p=process.argv[1]; const j=JSON.parse(fs.readFileSync(p,"utf8")); j.inputs.a="12.6"; fs.writeFileSync(p, JSON.stringify(j,null,2));'
run_denied_case 'tampered_formula' 'unsupported_formula' 'const fs=require("fs"); const p=process.argv[1]; const j=JSON.parse(fs.readFileSync(p,"utf8")); j.formula_id="example.add"; fs.writeFileSync(p, JSON.stringify(j,null,2));'
run_denied_case 'missing_field' 'missing_output_hash' 'const fs=require("fs"); const p=process.argv[1]; const j=JSON.parse(fs.readFileSync(p,"utf8")); delete j.output_hash; fs.writeFileSync(p, JSON.stringify(j,null,2));'

printf '%s\n' 'CALCULATION_FAIL_CLOSED: PASS'
