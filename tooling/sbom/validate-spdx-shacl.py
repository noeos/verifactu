#!/usr/bin/env python3
"""Offline SPDX 3.0.1 semantic validation using the pinned official SHACL model."""

from __future__ import annotations

import argparse
import json
import socket
from pathlib import Path


def deny_network(*_args: object, **_kwargs: object) -> None:
    raise RuntimeError("UNDECLARED_NETWORK: Python socket access is denied")


def main() -> int:
    socket.socket.connect = deny_network  # type: ignore[method-assign]
    socket.create_connection = deny_network  # type: ignore[assignment]
    from pyshacl import validate
    from rdflib import Graph

    parser = argparse.ArgumentParser()
    parser.add_argument("--document", type=Path, required=True)
    parser.add_argument("--context", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    args = parser.parse_args()

    document = json.loads(args.document.read_text(encoding="utf-8"))
    context = json.loads(args.context.read_text(encoding="utf-8"))["@context"]
    document["@context"] = context
    data = Graph().parse(data=json.dumps(document), format="json-ld")
    model = Graph().parse(args.model, format="turtle")
    conforms, results_graph, results_text = validate(
        data_graph=data,
        shacl_graph=model,
        ont_graph=model,
        inference="none",
        advanced=True,
        abort_on_first=False,
        allow_infos=False,
        allow_warnings=False,
    )
    if not conforms:
        print(results_text)
        return 1
    print(json.dumps({
        "schemaVersion": 1,
        "control": "spdx-shacl",
        "result": "passed",
        "dataTriples": len(data),
        "modelTriples": len(model),
        "resultTriples": len(results_graph),
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
