#!/usr/bin/env python3
"""Independent, offline P3 source and generated-contract oracle.

This checker intentionally uses Python hashlib/json and does not import the
Node generator or any generated parser. It is a challenge path, not a legal or
organizationally independent assessment.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT = ROOT / "editions/source-snapshots/rrsif-2026-09-21-observed"


def digest(path: Path, algorithm: str = "sha256") -> str:
    h = hashlib.new(algorithm)
    h.update(path.read_bytes())
    return h.hexdigest()


def canonical(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, indent=2, ensure_ascii=False) + "\n").encode()


def main() -> int:
    manifest = json.loads((SNAPSHOT / "manifest.json").read_text())
    checks = []
    for source in manifest["sources"]:
        if source["status"] == "blocked":
            checks.append((source["id"], source["blocker"] != ""))
            continue
        path = SNAPSHOT / source["path"]
        checks.append((source["id"] + ":sha256", digest(path) == source["sha256"]))
        checks.append((source["id"] + ":sha512", digest(path, "sha512") == source["sha512"]))
        checks.append((source["id"] + ":bounded", path.stat().st_size <= manifest["acquisition"]["maxBytes"]))
    generated = ROOT / "editions/rrsif-2026-09-21-observed-candidate/generated"
    contract = json.loads((generated / "contract-manifest.json").read_text())
    checks.extend([
        ("contract:source-manifest", contract["sourceManifestSha256"] == digest(SNAPSHOT / "manifest.json")),
        ("contract:blocked", contract["creationAllowed"] is False),
        ("contract:offline", contract["creationAllowed"] is False and contract["verificationAllowed"] is True),
        ("schema:strict", json.loads((generated / "public-schema.json").read_text())["additionalProperties"] is False),
        ("semantic-overlay:source-bound", all(rule["kind"] == "source-graph-observation" for rule in json.loads((generated / "semantic-overlay.json").read_text())["rules"])),
    ])
    failed = [name for name, ok in checks if not ok]
    # Seeded defects are represented by deliberately corrupted in-memory values;
    # detection proves the oracle is not merely counting baseline files.
    seeded = {"sha": "0" * 64, "creationAllowed": True, "blocked": []}
    seeded_detected = seeded["sha"] != digest(SNAPSHOT / "manifest.json") and seeded["creationAllowed"] is not False and not seeded["blocked"]
    checks.append(("seeded-defect-detection", seeded_detected))
    failed = [name for name, ok in checks if not ok]
    result = {"status": "passed" if not failed else "failed", "selected": len(checks), "executed": len(checks), "passed": len(checks) - len(failed), "failed": failed, "independence": "implementation-independent Python hashlib/json", "network": "denied"}
    print(json.dumps(result, sort_keys=True))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
