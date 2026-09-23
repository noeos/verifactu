#!/usr/bin/env python3
"""Independent offline XML/XSD oracle for P4-C."""
import hashlib
import json
import re
import tempfile
import warnings
from pathlib import Path
from xml.etree import ElementTree

import xmlschema

ROOT = Path(__file__).resolve().parents[2]
VECTOR = ROOT / "tests/vectors/p4c-official-positive.xml"
SCHEMAS = ROOT / "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources"
DSIG = "d102ad3df7664c307e0c2c776ba4a90513b1969974d8a940bae1a77f9f21e15d"

def main():
    dsig = (SCHEMAS / "standards/xmldsig-core-schema.xsd").read_bytes()
    assert hashlib.sha256(dsig).hexdigest() == DSIG
    normalized = re.sub(r"<!DOCTYPE schema[\s\S]*?\]>\s*", "", dsig.decode(), count=1)
    positive = VECTOR.read_text()
    mutations = [
        positive.replace("<sf:TipoFactura>F1</sf:TipoFactura>", "<sf:TipoFactura>XX</sf:TipoFactura>"),
        positive.replace("      <sf:IDVersion>1.0</sf:IDVersion>\n", ""),
        positive.replace("<sf:TipoImpositivo>21</sf:TipoImpositivo>", "<sf:TipoImpositivo>not-decimal</sf:TipoImpositivo>"),
    ]
    with tempfile.TemporaryDirectory(prefix="verifactu-p4c-oracle-") as path:
        local = Path(path)
        for relative in ("aeat/SuministroLR.xsd", "aeat/SuministroInformacion.xsd"):
            (local / Path(relative).name).write_bytes((SCHEMAS / relative).read_bytes())
        (local / "xmldsig-core-schema.xsd").write_text(normalized)
        with warnings.catch_warnings(record=True) as observed:
            schema = xmlschema.XMLSchema(
                str(local / "SuministroLR.xsd"),
                locations=[
                    ("https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd", str(local / "SuministroInformacion.xsd")),
                    ("http://www.w3.org/2000/09/xmldsig#", str(local / "xmldsig-core-schema.xsd")),
                ],
                allow="sandbox",
                defuse="always",
            )
        positive_path = local / "positive.xml"
        positive_path.write_text(positive)
        mutation_paths = []
        for index, value in enumerate(mutations):
            candidate = local / f"negative-{index}.xml"
            candidate.write_text(value)
            mutation_paths.append(candidate)
        checks = [schema.is_valid(str(positive_path)), not observed]
        checks.extend(not schema.is_valid(str(value)) for value in mutation_paths)
        parsed = ElementTree.fromstring(positive)
        checks.append(ElementTree.tostring(parsed) == ElementTree.tostring(ElementTree.fromstring(ElementTree.tostring(parsed))))
    print(json.dumps({"status": "passed" if all(checks) else "failed", "selected": len(checks), "executed": len(checks), "passed": sum(checks), "failed": len(checks) - sum(checks), "independence": "xmlschema/elementpath plus stdlib; no TypeScript/lxml import", "network": "denied"}, sort_keys=True))
    return 0 if all(checks) else 1

if __name__ == "__main__":
    raise SystemExit(main())
