# External Replay Packet RC1

## Locked Tag

TRUTH_GATE_CONTINUITY_CANON_v1.7.0.0.46_LOCKED

## Current Authority State

```text
accept_shared := false
propagation := BLOCKED
authority := LOCAL_VERIFICATION_ONLY
state := HOLD_FOR_AUTHORITY
```

## Replay Objective

Independent validators must reproduce the same canonical outputs from the locked packet.

## Required Evidence

Validators must provide:

- repository URL
- locked tag
- commit SHA
- operating system
- runtime versions
- commands run
- canonical output hash
- SYSTEM_ROOT hash
- replay result
- validator statement

## SYSTEM_ROOT Replay Command

Validators must run:

```bash
python verify_system_root.py
```

Expected successful output must include:

```json
{
  "authority": "LOCAL_VERIFICATION_ONLY",
  "accept_shared": false,
  "propagation": "BLOCKED",
  "state": "HOLD_FOR_AUTHORITY",
  "verification_passed": true,
  "root_match": true
}
```

## Interpretation Rule

A passing result means:

```text
LOCAL_REPLAY_CHECK: PASS
SYSTEM_ROOT_BINDING: REPRODUCED
ACCEPT_SHARED: false
PROPAGATION: BLOCKED
```

It does not mean:

```text
ACCEPT_SHARED: true
PROPAGATION: ALLOWED
NETWORK_UPDATE: ALLOWED
T13: ENTERED
```

## Required Validator Evidence for SYSTEM_ROOT Replay

Validators must submit:

```text
command: python verify_system_root.py
SYSTEM_ROOT_VERIFICATION_REPORT.json
terminal output
commit SHA
OS/runtime details
validator statement
```

## Boundary

Clone activity is not replay proof.  
Local verification is not shared authority.  
SYSTEM_ROOT replay is local evidence only.  
Independent validators must reproduce the same SYSTEM_ROOT result before Bell₂ comparison may begin.  
Only identical independent replay may approach ACCEPT_SHARED.
