#!/usr/bin/env python3
"""Independent P4-B oracle for fingerprint vectors."""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VECTORS = ROOT / "tests/vectors/p4b-aeat-fingerprint.json"

ALTA = (
    ("issuer", "IDEmisorFactura"),
    ("number", "NumSerieFactura"),
    ("issuedOn", "FechaExpedicionFactura"),
    ("invoiceType", "TipoFactura"),
    ("taxTotal", "CuotaTotal"),
    ("total", "ImporteTotal"),
    ("predecessor", "Huella"),
    ("generatedAt", "FechaHoraHusoGenRegistro"),
)
ANULACION = (
    ("issuer", "IDEmisorFacturaAnulada"),
    ("number", "NumSerieFacturaAnulada"),
    ("issuedOn", "FechaExpedicionFacturaAnulada"),
    ("predecessor", "Huella"),
    ("generatedAt", "FechaHoraHusoGenRegistro"),
)


def project(vector: dict[str, object]) -> str:
    values = vector["values"]
    assert isinstance(values, dict)
    fields = ALTA if vector["kind"] == "alta" else ANULACION
    parts: list[str] = []
    for source, label in fields:
        raw = str(values[source]).strip()
        if source == "issuedOn":
            year, month, day = raw.split("-")
            raw = f"{day}-{month}-{year}"
        if source in {"taxTotal", "total"} and "." in raw:
            raw = raw.rstrip("0").rstrip(".")
        parts.append(f"{label}={raw}")
    return "&".join(parts)


def main() -> int:
    document = json.loads(VECTORS.read_text(encoding="utf-8"))
    checks: list[tuple[str, bool]] = []
    for vector in document["vectors"]:
        preimage = project(vector)
        digest = hashlib.sha256(preimage.encode("utf-8")).hexdigest().upper()
        checks.extend(
            [
                (f"{vector['id']}:preimage", preimage == vector["preimage"]),
                (f"{vector['id']}:sha256", digest == vector["fingerprint"]),
                (f"{vector['id']}:utf8", preimage.encode("utf-8").decode("utf-8") == preimage),
            ]
        )
    failed = [name for name, passed in checks if not passed]
    result = {
        "status": "passed" if not failed else "failed",
        "selected": len(checks),
        "executed": len(checks),
        "passed": len(checks) - len(failed),
        "failed": failed,
        "vectors": len(document["vectors"]),
        "independence": "Python hashlib/json; no TypeScript production import",
        "network": "denied",
    }
    print(json.dumps(result, sort_keys=True))
    return int(bool(failed))


if __name__ == "__main__":
    raise SystemExit(main())
