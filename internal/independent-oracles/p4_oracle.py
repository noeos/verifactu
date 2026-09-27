#!/usr/bin/env python3
"""Independent P4 edition custody and literal serialization vectors."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EDITION = ROOT / "editions/rrsif-2026-09-21-authoritative-candidate/generated"
SNAPSHOT = ROOT / "editions/source-snapshots/rrsif-2026-09-21-authoritative"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    contract = json.loads((EDITION / "contract-manifest.json").read_text(encoding="utf-8"))
    generation = json.loads((EDITION / "generation-report.json").read_text(encoding="utf-8"))
    source_manifest = (SNAPSHOT / "manifest.json").read_bytes()

    # This vector is literal and intentionally implemented with Python's
    # independent UTF-8 and hashlib stack, not production serialization code.
    preimage = "FP&Café €&0&~".encode("utf-8")
    vector_digest = sha256(preimage)
    expected_vector_digest = "14a04c138da532dff4572a52ff8dfc0a2e8313742ec588db4a94a443c35ffc10"
    checks = {
        "candidate_creation_disabled": contract["creationAllowed"] is False,
        "candidate_verification_enabled": contract["verificationAllowed"] is True,
        "candidate_status": contract["status"] == "candidate",
        "manifest_digest": sha256(source_manifest) == contract["sourceManifestSha256"],
        "generation_manifest_digest": generation["sourceManifestSha256"] == contract["sourceManifestSha256"],
        "generation_output_digest": generation["outputDigest"] == "561005c36d5c3ae0b00a98215f59e24769b7b4dec9b1a6cba878f00eacb90482",
        "offline_runtime": contract["networkAtRuntime"] == "denied",
        "literal_utf8_preimage": preimage == b"FP&Caf\xc3\xa9 \xe2\x82\xac&0&~",
        "independent_sha256_vector": vector_digest == expected_vector_digest,
    }
    failed = [name for name, passed in checks.items() if not passed]
    print(json.dumps({
        "status": "passed" if not failed else "failed",
        "selected": len(checks),
        "executed": len(checks),
        "passed": len(checks) - len(failed),
        "failed": failed,
        "vector": {"id": "P4-ORACLE-UTF8-001", "preimageBytes": len(preimage), "sha256": vector_digest},
        "editionId": contract["editionId"],
        "creationAllowed": contract["creationAllowed"],
        "implementation": "Python 3 standard library hashlib/json; literal inputs; no production imports",
    }, sort_keys=True))
    return int(bool(failed))


if __name__ == "__main__":
    raise SystemExit(main())
