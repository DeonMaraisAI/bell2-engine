# Nexus Protocol Runtime — Download Packet

## Purpose

This packet packages the single-window Nexus + Truth-Gate continuity runtime.

The runtime is intended for deterministic local replay and external validation preparation.

## Current Authority Boundary

```text
AUTHORITY: LOCAL_VERIFICATION_ONLY
ACCEPT_SHARED: false
PROPAGATION: BLOCKED
STATE: HOLD_FOR_AUTHORITY
```

## Included Files

```text
nexus_unified_runtime.py
Nexus_Protocol_Runtime_Recap.md
Nexus_Protocol_Runtime_Recap.docx.sha256
requirements.txt
RUN_INSTRUCTIONS.md
REPLAY_REPORT_TEMPLATE.md
STATUS.md
MANIFEST.json
SHA256SUMS.txt
```

## Core Runtime Sequence

```text
Intent
→ Ω Constraint Gate
→ Deterministic Collapse
→ DMOJO Artifact Proof
→ Replay Witness
→ Seal / Artifact Output
```

## Non-Promotion Rule

A local successful run does not create ACCEPT_SHARED.

A local successful run does not allow propagation.

Only independent replay convergence may approach shared acceptance.
