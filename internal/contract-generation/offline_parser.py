#!/usr/bin/env python3
"""Hostile-safe XML dependency parser used by the P3 negative campaign.

It never opens a URI. External entities, DTDs, path traversal, duplicate
logical identities, oversized inputs and excessive nesting are rejected before
any structural declaration is accepted.
"""

from __future__ import annotations

from pathlib import Path
import json
import posixpath
import re
import sys
from xml.etree import ElementTree as ET

MAX_BYTES = 2 * 1024 * 1024
MAX_DEPTH = 64
EXTERNAL = re.compile(rb"<!\s*(?:DOCTYPE|ENTITY)", re.I)


def parse(path: Path) -> dict:
    raw = path.read_bytes()
    if len(raw) > MAX_BYTES:
        raise ValueError("INPUT_TOO_LARGE")
    if EXTERNAL.search(raw):
        raise ValueError("EXTERNAL_ENTITY_OR_NETWORK_REFERENCE")
    if b"\x00" in raw:
        raise ValueError("NUL_BYTE")
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as exc:
        raise ValueError("XML_NOT_WELL_FORMED") from exc
    seen: set[str] = set()

    def walk(node: ET.Element, depth: int) -> int:
        if depth > MAX_DEPTH:
            raise ValueError("NESTING_LIMIT")
        count = 1
        logical = node.attrib.get("name") or node.attrib.get("targetNamespace")
        if logical:
            if logical in seen:
                raise ValueError("DUPLICATE_LOGICAL_IDENTITY")
            seen.add(logical)
        for child in list(node):
            count += walk(child, depth + 1)
        return count

    declarations = walk(root, 0)
    dependencies = []
    for attribute in ("schemaLocation", "location"):
        for value in [
            element.attrib[attribute]
            for element in root.iter()
            if attribute in element.attrib
        ]:
            if value.startswith(("http:", "https:", "file:")) or value.startswith("//"):
                raise ValueError("REMOTE_DEPENDENCY")
            normalized = posixpath.normpath(value)
            if normalized == ".." or normalized.startswith("../"):
                raise ValueError("PATH_TRAVERSAL")
            dependencies.append(normalized)
    return {
        "root": root.tag,
        "declarations": declarations,
        "dependencies": sorted(dependencies),
    }


def main() -> int:
    failures = []
    for path in sorted(Path("fixtures/adversarial/regulatory").glob("*.xml")):
        expected = path.stem.split("--", 1)[-1]
        try:
            parse(path)
        except ValueError as exc:
            if str(exc) != expected:
                failures.append(f"{path}:{exc} != {expected}")
        else:
            failures.append(f"{path}:accepted")
    print(
        json.dumps(
            {
                "status": "passed" if not failures else "failed",
                "fixtures": len(
                    list(Path("fixtures/adversarial/regulatory").glob("*.xml"))
                ),
                "failures": failures,
            },
            sort_keys=True,
        )
    )
    return int(bool(failures))


if __name__ == "__main__":
    raise SystemExit(main())
