# Bell₂ Verification Engine

Bell₂ Verification Engine v0.2.0 publishes an honest fail-closed state seal: witness valid, authority unverified, propagation blocked.

## Current state

```text
Product: Bell₂ Verification Engine
Version: v0.2.0
Primary artifact: STATE_SEAL_HOLD_FOR_AUTHORITY
Current route: HOLD_FOR_AUTHORITY
```

## Public truth claim

```text
BELL2_WITNESS_VALID: TRUE
AUTHORITY: UNVERIFIED
ACCEPT_SHARED: FALSE
PROPAGATION: BLOCKED
NETWORK_UPDATE: BLOCKED
```


## Full local CI

Run the same proof sequence used by GitHub Actions:

```bash
npm test
# or
npm run ci
```

This verifies:

```text
state seal replay
state fail-closed behavior
calculation receipt replay
calculation fail-closed behavior
```

## Verify

```bash
bash verify/verify.sh
```

Expected result:

```text
STATUS: VERIFIED_LOCAL
AUTHORITY: UNVERIFIED
ACCEPT_SHARED: FALSE
PROPAGATION: BLOCKED
NETWORK_UPDATE: BLOCKED
```

## Fail-closed tests

```bash
bash tests/fail_closed.test.sh
```

Expected result:

```text
FAIL_CLOSED_TESTS: PASS
```

## Meaning

This repo proves one narrow thing:

```text
The current state seal is deterministic, reproducible locally, and fail-closed.
```

It does not claim:

```text
AUTHORITY: VERIFIED
ACCEPT_SHARED: TRUE
PROPAGATION: ENABLED
NETWORK_UPDATE: ALLOWED
```

Truth is not interpreted. Truth is executed.

## Calculation validation

This repository also includes a deterministic calculation receipt verifier.

```bash
node scripts/verify-calculation.js receipts/example-calculation.receipt.json
```

Expected output includes:

```text
CALCULATION: VERIFIED
AUTHORITY: UNVERIFIED
PROPAGATION: BLOCKED
```

Fail-closed calculation tests:

```bash
bash tests/calculation-fail-closed.test.sh
```

Calculation validation proves deterministic replay of the receipt only. It does not upgrade Bell₂ authority, set `ACCEPT_SHARED` to true, or enable propagation.

## CI gate

Do not tag or release v0.2.0 until GitHub Actions `Verify` passes.
