#!/usr/bin/env node
'use strict';

const fs = require('fs');
const crypto = require('crypto');

const receiptPath = process.argv[2] || 'receipts/example-calculation.receipt.json';

const FORMULA = Object.freeze({
  formula_id: 'example.multiply',
  formula_version: '1.0.0',
  calculator_version: '1.0.0',
  operation: 'decimal_exact_multiply',
  input_fields: ['a', 'b'],
  result_type: 'decimal_string',
});

function stableStringify(value) {
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function deny(reason) {
  console.log(`DENIED: ${reason}`);
  process.exit(1);
}

function assertString(obj, key) {
  if (!Object.prototype.hasOwnProperty.call(obj, key) || typeof obj[key] !== 'string' || obj[key].length === 0) {
    deny(`missing_${key}`);
  }
}

function assertBoolean(obj, key) {
  if (!Object.prototype.hasOwnProperty.call(obj, key) || typeof obj[key] !== 'boolean') {
    deny(`missing_${key}`);
  }
}

function assertInteger(obj, key) {
  if (!Object.prototype.hasOwnProperty.call(obj, key) || !Number.isInteger(obj[key])) {
    deny(`missing_${key}`);
  }
}

function assertDecimalString(value, key) {
  if (typeof value !== 'string') deny(`invalid_${key}`);
  if (!/^-?(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(value)) deny(`invalid_decimal_${key}`);
  if (value === '-0') deny(`negative_zero_${key}`);
}

function parseDecimal(value) {
  assertDecimalString(value, 'decimal');
  const negative = value.startsWith('-');
  const raw = negative ? value.slice(1) : value;
  const [whole, frac = ''] = raw.split('.');
  return { negative, int: BigInt(whole + frac), scale: frac.length };
}

function formatDecimal(intValue, scale, negative) {
  let text = intValue.toString().padStart(scale + 1, '0');
  if (scale > 0) {
    text = text.slice(0, -scale) + '.' + text.slice(-scale);
    text = text.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  }
  if (text === '') text = '0';
  if (negative && text !== '0') text = '-' + text;
  return text;
}

function decimalMultiply(a, b) {
  const x = parseDecimal(a);
  const y = parseDecimal(b);
  return formatDecimal(x.int * y.int, x.scale + y.scale, x.negative !== y.negative);
}

function canonicalInputs(inputs) {
  if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) deny('missing_inputs');
  const keys = Object.keys(inputs).sort();
  if (keys.join(',') !== 'a,b') deny('unexpected_input_fields');
  assertDecimalString(inputs.a, 'a');
  assertDecimalString(inputs.b, 'b');
  return { a: inputs.a, b: inputs.b };
}

function buildPayload(receipt, inputs, result) {
  return {
    calculator_version: receipt.calculator_version,
    formula_hash: receipt.formula_hash,
    formula_id: receipt.formula_id,
    formula_version: receipt.formula_version,
    input_hash: receipt.input_hash,
    inputs,
    output_hash: receipt.output_hash,
    precision: receipt.precision,
    result,
    rounding_mode: receipt.rounding_mode,
    units: receipt.units,
  };
}

function verify(receipt) {
  assertString(receipt, 'receipt_type');
  assertString(receipt, 'formula_id');
  assertString(receipt, 'formula_version');
  assertString(receipt, 'calculator_version');
  assertString(receipt, 'input_hash');
  assertString(receipt, 'formula_hash');
  assertString(receipt, 'result');
  assertString(receipt, 'output_hash');
  assertString(receipt, 'units');
  assertInteger(receipt, 'precision');
  assertString(receipt, 'rounding_mode');
  assertString(receipt, 'canonical_payload_hash');
  assertBoolean(receipt, 'timestamp_excluded_from_hash');
  assertString(receipt, 'verification_status');

  if (receipt.receipt_type !== 'CALCULATION_RECEIPT') deny('invalid_receipt_type');
  if (receipt.formula_id !== FORMULA.formula_id) deny('unsupported_formula');
  if (receipt.formula_version !== FORMULA.formula_version) deny('unsupported_formula_version');
  if (receipt.calculator_version !== FORMULA.calculator_version) deny('unsupported_calculator_version');
  if (receipt.rounding_mode !== 'decimal_exact') deny('unsupported_rounding_mode');
  if (receipt.units !== 'unitless') deny('unsupported_units');
  if (receipt.precision !== 10) deny('unsupported_precision');
  if (receipt.timestamp_excluded_from_hash !== true) deny('timestamp_must_be_excluded_from_hash');
  if (receipt.verification_status !== 'PENDING_REPLAY') deny('invalid_verification_status');

  const inputs = canonicalInputs(receipt.inputs);
  const expectedFormulaHash = sha256(stableStringify(FORMULA));
  if (receipt.formula_hash !== expectedFormulaHash) deny('formula_hash_mismatch');

  const expectedInputHash = sha256(stableStringify(inputs));
  if (receipt.input_hash !== expectedInputHash) deny('input_hash_mismatch');

  assertDecimalString(receipt.result, 'result');
  const recomputed = decimalMultiply(inputs.a, inputs.b);
  if (recomputed !== receipt.result) deny('result_mismatch');

  const outputDomain = { result: receipt.result, units: receipt.units, precision: receipt.precision, rounding_mode: receipt.rounding_mode };
  const expectedOutputHash = sha256(stableStringify(outputDomain));
  if (receipt.output_hash !== expectedOutputHash) deny('output_hash_mismatch');

  const payload = buildPayload(receipt, inputs, receipt.result);
  const expectedPayloadHash = sha256(stableStringify(payload));
  if (receipt.canonical_payload_hash !== expectedPayloadHash) deny('canonical_payload_hash_mismatch');

  return { result: receipt.result, calculation_hash: expectedPayloadHash, input_hash: expectedInputHash, output_hash: expectedOutputHash, formula_hash: expectedFormulaHash };
}

if (!fs.existsSync(receiptPath)) deny('receipt_not_found');

let receipt;
try {
  receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
} catch (_error) {
  deny('invalid_json');
}

const verified = verify(receipt);
console.log('CALCULATION: VERIFIED');
console.log(`RESULT: ${verified.result}`);
console.log(`INPUT_HASH: ${verified.input_hash}`);
console.log(`OUTPUT_HASH: ${verified.output_hash}`);
console.log(`FORMULA_HASH: ${verified.formula_hash}`);
console.log(`CALCULATION_HASH: ${verified.calculation_hash}`);
console.log('AUTHORITY: UNVERIFIED');
console.log('PROPAGATION: BLOCKED');
