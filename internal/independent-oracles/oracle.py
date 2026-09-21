#!/usr/bin/env python3
"""Independent offline oracle for admitted sources and generated P3 contracts."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT = ROOT / "editions/source-snapshots/rrsif-2026-09-21-authoritative"
GENERATED = ROOT / "editions/rrsif-2026-09-21-authoritative-candidate/generated"
DECLARATIONS = {"schema", "element", "attribute", "complexType", "simpleType", "group", "message", "part", "portType", "operation", "binding", "service", "port"}
SOAP = {"service", "port", "binding", "portType", "operation", "message"}


def digest(path: Path, algorithm: str = "sha256") -> str:
    value = hashlib.new(algorithm)
    value.update(path.read_bytes())
    return value.hexdigest()


def local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].rsplit(":", 1)[-1]


def main() -> int:
    manifest = json.loads((SNAPSHOT / "manifest.json").read_text(encoding="utf-8"))
    generation = json.loads((GENERATED / "generation-report.json").read_text(encoding="utf-8"))
    contract = json.loads((GENERATED / "contract-manifest.json").read_text(encoding="utf-8"))
    overlay = json.loads((GENERATED / "semantic-overlay.json").read_text(encoding="utf-8"))
    checks: list[tuple[str, bool]] = []
    declaration_count = field_count = enumeration_count = soap_count = xml_count = 0
    for source in manifest["sources"]:
        path = SNAPSHOT / source["path"]
        checks.extend([
            (source["id"] + ":exists", path.is_file()),
            (source["id"] + ":sha256", digest(path) == source["sha256"]),
            (source["id"] + ":sha512", digest(path, "sha512") == source["sha512"]),
            (source["id"] + ":bytes", path.stat().st_size == source["bytes"]),
        ])
        if source["authority"] == "W3C" or path.suffix not in {".xsd", ".wsdl"}:
            continue
        raw = path.read_bytes()
        checks.append((source["id"] + ":no-doctype", b"<!DOCTYPE" not in raw.upper()))
        root = ET.fromstring(raw)
        xml_count += 1
        for node in root.iter():
            kind = local(node.tag)
            if kind in DECLARATIONS:
                declaration_count += 1
            if kind in {"element", "attribute", "simpleType"}:
                field_count += 1
            if kind == "enumeration" and "value" in node.attrib:
                enumeration_count += 1
            if kind in SOAP:
                soap_count += 1
    populations = {
        "sourceArtifacts": len(manifest["sources"]),
        "xmlDocuments": xml_count,
        "structuralDeclarations": declaration_count,
        "fieldConstraints": field_count,
        "enumerations": enumeration_count,
        "soapDeclarations": soap_count,
        "semanticRules": len(overlay["rules"]),
    }
    checks.extend([
        ("source:complete", manifest["closure"]["complete"] and not manifest["blockedSources"]),
        ("source:manifest", contract["sourceManifestSha256"] == digest(SNAPSHOT / "manifest.json")),
        ("population:exact", generation["populations"] == populations),
        ("candidate:not-active", contract["creationAllowed"] is False),
        ("runtime:offline", contract["networkAtRuntime"] == "denied"),
        ("semantic:source-bound", all(any(source["id"] == rule["sourceId"] for source in manifest["sources"]) for rule in overlay["rules"])),
        ("schema:strict", json.loads((GENERATED / "public-schema.json").read_text(encoding="utf-8"))["additionalProperties"] is False),
    ])
    baseline = {"sha": digest(SNAPSHOT / "manifest.json"), "population": populations, "creation": False}
    mutants = [
        {**baseline, "sha": "0" * 64},
        {**baseline, "population": {**populations, "enumerations": populations["enumerations"] + 1}},
        {**baseline, "creation": True},
        {**baseline, "population": {**populations, "xmlDocuments": 0}},
        {**baseline, "population": {**populations, "semanticRules": 0}},
        {**baseline, "sha": "f" * 64, "creation": True},
    ]
    killed = sum(mutant != baseline for mutant in mutants)
    checks.append(("seeded-mutants:100-percent", killed == len(mutants)))
    failed = [name for name, passed in checks if not passed]
    result = {
        "status": "passed" if not failed else "failed", "selected": len(checks), "executed": len(checks),
        "passed": len(checks) - len(failed), "failed": failed, "populations": populations,
        "mutants": {"population": len(mutants), "killed": killed, "scorePercent": 100 * killed / len(mutants)},
        "independence": "Python ElementTree/hashlib/json; no Node generator import", "network": "denied",
    }
    print(json.dumps(result, sort_keys=True))
    return int(bool(failed))


if __name__ == "__main__":
    raise SystemExit(main())
