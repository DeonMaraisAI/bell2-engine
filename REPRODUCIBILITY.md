# Reproducibility

This system is designed to produce identical state results across independent machines.

Verification requires:

- No network access during verification
- No randomness
- No timestamps
- No external downloads
- Standard POSIX tools only: `bash`, `sha256sum`, `unzip`, and `diff`

Any deviation must deny confidence.

## Deterministic path

```text
release/bell2-engine-v0.2.0.zip
  -> sha256sum verification
  -> extraction
  -> deterministic execution
  -> exact output comparison
  -> STATUS: VERIFIED_LOCAL
  -> AUTHORITY remains UNVERIFIED
  -> PROPAGATION remains BLOCKED
```

## External authority condition

The state may not be upgraded beyond `AUTHORITY: UNVERIFIED` merely because this repository exists.

Authority upgrade requires at minimum:

```text
CI: PASS
SECOND_MACHINE: PASS
HUMAN_DECISION: ACCEPTED
```

Until then:

```text
ACCEPT_SHARED: FALSE
PROPAGATION: BLOCKED
NETWORK_UPDATE: BLOCKED
```
