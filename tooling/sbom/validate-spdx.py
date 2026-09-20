#!/usr/bin/env python3
"""Offline SPDX 3.0.1 JSON-LD and SHACL/OWL validation."""

from __future__ import annotations

import argparse
import copy
import json
import sys
from pathlib import Path

from pyshacl import validate
from rdflib import Graph


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--document", type=Path, required=True)
    parser.add_argument("--context", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    args = parser.parse_args()

    document = json.loads(args.document.read_text(encoding="utf-8"))
    local_document = copy.deepcopy(document)
    local_document["@context"] = json.loads(args.context.read_text(encoding="utf-8"))["@context"]

    data_graph = Graph().parse(data=json.dumps(local_document), format="json-ld")
    model_graph = Graph().parse(args.model, format="turtle")
    conforms, results_graph, results_text = validate(
        data_graph,
        shacl_graph=model_graph,
        ont_graph=model_graph,
        inference="none",
        advanced=True,
        abort_on_first=False,
        allow_infos=False,
        allow_warnings=False,
        meta_shacl=False,
    )
    report = {
        "schemaVersion": 1,
        "status": "passed" if conforms else "failed",
        "dataTriples": len(data_graph),
        "modelTriples": len(model_graph),
        "resultTriples": len(results_graph),
    }
    print(json.dumps(report, sort_keys=True))
    if not conforms:
        print(results_text, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
