
# ============================================================
# NEXUS + TRUTH-GATE CONTINUITY CANON
# SINGLE-WINDOW UNIFIED RUNTIME
# ============================================================

import hashlib
import json
from dataclasses import dataclass, field
from py_ecc.bls import G2ProofOfPossession as bls


def canonical(x):
    return json.dumps(x, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def H(x):
    return hashlib.sha256(canonical(x).encode()).digest()


def normalize_input(payload):
    return json.loads(canonical(payload))

def normalization_hash(payload):
    return H({"normalization": payload})


@dataclass
class ContinuityState:
    session_id: str
    entries: list = field(default_factory=list)
    normalization_hash: bytes = b""
    tuple_hash: bytes = b""
    state_hash: bytes = b""


def deterministic_transition(state, packet):
    entry_hash = H(packet)
    state.entries.append(entry_hash)

    state.tuple_hash = H({
        "session_id": state.session_id,
        "entries": [e.hex() for e in state.entries],
        "normalization_hash": state.normalization_hash.hex()
    })

    state.state_hash = H({"tuple_hash": state.tuple_hash.hex()})
    return state


def merkle_parent(a, b):
    return hashlib.sha256(a + b).digest()

def merkle_root(leaves):
    if not leaves:
        return hashlib.sha256(b"EMPTY").digest()

    level = leaves[:]
    while len(level) > 1:
        if len(level) % 2 == 1:
            level.append(level[-1])
        level = [
            merkle_parent(level[i], level[i+1])
            for i in range(0, len(level), 2)
        ]
    return level[0]


def build_proposal(domain, epoch, previous_root, merkle_root_value, validator_pubkeys, threshold):
    proposal = {
        "domain": domain,
        "epoch": epoch,
        "previous_root": previous_root.hex(),
        "merkle_root": merkle_root_value.hex(),
        "validator_set_hash": H([pk.hex() for pk in validator_pubkeys]).hex(),
        "threshold": threshold,
        "authority_scope": {
            "accept_local": True,
            "accept_shared": False,
            "propagation": "BLOCKED"
        },
        "intent": "CANON_SAFE_IRREVERSIBLE_STATE_TRANSITION"
    }
    return proposal


@dataclass
class Validator:
    sk: int
    pk: bytes

    @staticmethod
    def create(seed):
        sk = bls.KeyGen(seed)
        pk = bls.SkToPk(sk)
        return Validator(sk, pk)

    def sign(self, message):
        return bls.Sign(self.sk, message)


def distributed_consensus(proposal, validators, threshold):
    proposal_hash = H(proposal)
    signatures = [v.sign(proposal_hash) for v in validators]

    if len(signatures) < threshold:
        raise Exception("Threshold not met")

    agg_signature = bls.Aggregate(signatures)
    pubkeys = [v.pk for v in validators]

    if not bls.FastAggregateVerify(pubkeys, proposal_hash, agg_signature):
        raise Exception("Aggregated signature invalid")

    return proposal_hash, agg_signature


@dataclass
class RecursiveProof:
    head: bytes = field(default_factory=lambda: hashlib.sha256(b"GENESIS").digest())

    def update(self, new_root):
        self.head = hashlib.sha256(self.head + new_root).digest()
        return self.head


class AnchorRegistry:
    def __init__(self):
        self.registry = []

    def publish(self, anchor_hash):
        self.registry.append(anchor_hash)
        return len(self.registry) - 1

    def verify(self, anchor_hash):
        return anchor_hash in self.registry


def runtime(intent_input):

    normalized = normalize_input(intent_input)

    state = ContinuityState(session_id=normalized["session_id"])
    state.normalization_hash = normalization_hash(normalized)
    state = deterministic_transition(state, normalized["packet"])

    root = merkle_root(state.entries)

    validators = [
        Validator.create(hashlib.sha256(b"validator1").digest()),
        Validator.create(hashlib.sha256(b"validator2").digest()),
        Validator.create(hashlib.sha256(b"validator3").digest())
    ]

    proposal = build_proposal(
        domain="TRUTH_GATE_CONTINUITY",
        epoch=1,
        previous_root=hashlib.sha256(b"GENESIS").digest(),
        merkle_root_value=root,
        validator_pubkeys=[v.pk for v in validators],
        threshold=2
    )

    proposal_hash, agg_signature = distributed_consensus(proposal, validators, threshold=2)

    proof = RecursiveProof()
    recursive_root = proof.update(root)

    anchor_registry = AnchorRegistry()
    anchor_hash = hashlib.sha256(proposal_hash + root + recursive_root).digest()
    anchor_registry.publish(anchor_hash)

    artifact_payload = {
        "state_hash": state.state_hash.hex(),
        "merkle_root": root.hex(),
        "proposal_hash": proposal_hash.hex(),
        "recursive_root": recursive_root.hex(),
        "anchor_hash": anchor_hash.hex()
    }

    return {
        "artifact_hash": H(artifact_payload).hex(),
        "payload": artifact_payload
    }


if __name__ == "__main__":
    result = runtime({
        "session_id": "demo",
        "packet": {"value": 1}
    })
    print(result)
