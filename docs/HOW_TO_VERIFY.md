# How to Verify Bell₂ Engine v0.2.0

This guide explains how to verify the public Bell₂ Verification Engine release without changing the authority claim.

## Current boundary

```text
AUTHORITY: UNVERIFIED
ACCEPT_SHARED: FALSE
PROPAGATION: BLOCKED
NETWORK_UPDATE: BLOCKED
```

Verification proves reproducibility and fail-closed behavior only. It does not upgrade authority, enable propagation, or allow network update.

## Verify from a clean environment

Use a separate machine, fresh VM, GitHub Codespace, container, or sandbox.

```bash
git clone https://github.com/DeonMaraisAI/bell2-engine.git
cd bell2-engine
npm test
```

## Expected output

The full output may include step logs. It must include:

```text
STATUS: VERIFIED_LOCAL
AUTHORITY: UNVERIFIED
ACCEPT_SHARED: FALSE
PROPAGATION: BLOCKED
NETWORK_UPDATE: BLOCKED
FAIL_CLOSED_TESTS: PASS
CALCULATION: VERIFIED
CALCULATION_FAIL_CLOSED: PASS
```

## What this proves

```text
STATE SEAL: reproducible and fail-closed
CALCULATION RECEIPT: deterministic and replayable
TAMPERING: denied
```

## What this does not prove

```text
AUTHORITY: VERIFIED
ACCEPT_SHARED: TRUE
PROPAGATION: ENABLED
NETWORK_UPDATE: ALLOWED
```

## Failure rule

If verification fails:

```text
FAIL → TRACE → FIX → VERSION++
```

Do not patch blindly. Do not upgrade authority. Do not enable propagation.
