# Run Instructions

## 1. Create a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate
```

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

## 2. Install requirements

```bash
python -m pip install -r requirements.txt
```

## 3. Run the unified runtime

```bash
python nexus_unified_runtime.py
```

## Expected Output Shape

The runtime should print a dictionary containing:

```text
artifact_hash
payload.state_hash
payload.merkle_root
payload.proposal_hash
payload.recursive_root
payload.anchor_hash
```

## Boundary

This is a local replay/runtime packet.

It is not ACCEPT_SHARED.
It is not production approval.
It is not propagation authority.
