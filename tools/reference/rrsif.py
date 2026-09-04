# SPDX-License-Identifier: Apache-2.0
"""Independent, dependency-free reference for the official RRSIF SHA-256 vectors."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
VECTOR_FILE = ROOT / "vectors" / "rrsif-fingerprint.v1.json"


def preimage(case: dict[str, Any]) -> str:
    value = case["input"]
    previous = value["previous"]
    prior_hash = "" if previous["kind"] == "genesis" else previous["fingerprint"]
    if value["kind"] == "alta":
        pairs = (
            ("IDEmisorFactura", value["issuerNif"]),
            ("NumSerieFactura", value["invoiceNumber"]),
            ("FechaExpedicionFactura", value["issueDate"]),
            ("TipoFactura", value["invoiceType"]),
            ("CuotaTotal", value["taxAmount"]),
            ("ImporteTotal", value["totalAmount"]),
            ("Huella", prior_hash),
            ("FechaHoraHusoGenRegistro", value["generatedAt"]),
        )
    elif value["kind"] == "anulacion":
        pairs = (
            ("IDEmisorFacturaAnulada", value["issuerNif"]),
            ("NumSerieFacturaAnulada", value["invoiceNumber"]),
            ("FechaExpedicionFacturaAnulada", value["issueDate"]),
            ("Huella", prior_hash),
            ("FechaHoraHusoGenRegistro", value["generatedAt"]),
        )
    else:
        raise ValueError(f"unsupported reference vector kind: {value['kind']}")
    return "&".join(f"{name}={item.strip()}" for name, item in pairs)


def main() -> None:
    document = json.loads(VECTOR_FILE.read_text(encoding="utf-8"))
    for case in document["cases"]:
        material = preimage(case)
        if material != case["preimage"]:
            raise RuntimeError(f"preimage mismatch: {case['id']}")
        calculated = hashlib.sha256(material.encode("utf-8")).hexdigest().upper()
        if calculated != case["sha256"]:
            raise RuntimeError(f"digest mismatch: {case['id']}")
    print(f"Independent RRSIF reference passed: {len(document['cases'])} vectors.")


if __name__ == "__main__":
    main()
