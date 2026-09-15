#!/usr/bin/env python3
"""Independent, stdlib-only oracle for the P3 regulatory contract edition."""
from __future__ import annotations

import copy
import hashlib
import json
import os
import pathlib
import stat
import sys
import xml.parsers.expat

XSD = "http://www.w3.org/2001/XMLSchema"
WSDL = "http://schemas.xmlsoap.org/wsdl/"
SOAP = "http://schemas.xmlsoap.org/wsdl/soap/"


class OracleFailure(Exception):
    pass


def require(condition: bool, code: str, message: str) -> None:
    if not condition:
        raise OracleFailure(f"{code}: {message}")


def stable_bytes(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode()


def sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def safe_file(base: pathlib.Path, relative: str, prefix: str) -> pathlib.Path:
    pure = pathlib.PurePosixPath(relative)
    require(
        not pure.is_absolute()
        and "\\" not in relative
        and all(part not in ("", ".", "..") for part in pure.parts),
        f"{prefix}_PATH_INVALID",
        relative,
    )
    result = base.joinpath(*pure.parts)
    mode = result.lstat().st_mode
    require(stat.S_ISREG(mode) and not result.is_symlink(), f"{prefix}_FILE_UNSAFE", relative)
    return result


def split_expanded(name: str) -> tuple[str, str]:
    return tuple(name.split(" ", 1)) if " " in name else ("", name)  # type: ignore[return-value]


def strip_exact_doctype(text: str) -> str:
    marker = text.find("<!DOCTYPE")
    require(marker >= 0, "ORACLE_DTD_EXPECTED", "allowlisted XMLDSig source has no DTD")
    quote, depth = "", 0
    for cursor in range(marker + len("<!DOCTYPE"), len(text)):
        character = text[cursor]
        if quote:
            if character == quote:
                quote = ""
        elif character in ('"', "'"):
            quote = character
        elif character == "[":
            depth += 1
        elif character == "]":
            require(depth > 0, "ORACLE_DTD_MALFORMED", "unmatched bracket")
            depth -= 1
        elif character == ">" and depth == 0:
            require("<!DOCTYPE" not in text[cursor + 1 :], "ORACLE_DTD_MULTIPLE", "multiple declarations")
            return text[:marker] + text[cursor + 1 :]
    raise OracleFailure("ORACLE_DTD_MALFORMED: unterminated DTD")


def parse_xml(source: dict, raw: bytes, allowlisted_dtd: dict) -> dict:
    text = raw.decode("utf-8", errors="strict")
    had_doctype = "<!DOCTYPE" in text
    if had_doctype:
        require(
            source["id"] == allowlisted_dtd["sourceId"] and source["sha256"] == allowlisted_dtd["sha256"],
            "ORACLE_DTD_FORBIDDEN",
            source["id"],
        )
        text = strip_exact_doctype(text)
    pending: list[tuple[str, str]] = []
    stack: list[dict] = []
    root = None
    node_count = 0
    parser = xml.parsers.expat.ParserCreate(namespace_separator=" ")
    parser.SetParamEntityParsing(xml.parsers.expat.XML_PARAM_ENTITY_PARSING_NEVER)

    def forbidden(*_args: object) -> None:
        raise OracleFailure("ORACLE_XML_ACTIVE_CONTENT: DTD or entity callback reached")

    def start_namespace(prefix: str | None, uri: str) -> None:
        pending.append((prefix or "", uri))

    def start(name: str, attrs: dict[str, str]) -> None:
        nonlocal root, node_count
        namespace, local = split_expanded(name)
        bindings = dict(stack[-1]["bindings"]) if stack else {}
        bindings.update(pending)
        pending.clear()
        node = {
            "namespace": namespace,
            "name": local,
            "attributes": {split_expanded(key)[1]: value for key, value in attrs.items()},
            "bindings": bindings,
            "children": [],
            "text": [],
        }
        if stack:
            stack[-1]["children"].append(node)
        else:
            root = node
        stack.append(node)
        node_count += 1

    def end(name: str) -> None:
        namespace, local = split_expanded(name)
        require(bool(stack) and (stack[-1]["namespace"], stack[-1]["name"]) == (namespace, local), "ORACLE_XML_STACK", source["id"])
        stack.pop()

    def characters(value: str) -> None:
        if stack:
            stack[-1]["text"].append(value)

    parser.StartNamespaceDeclHandler = start_namespace
    parser.StartElementHandler = start
    parser.EndElementHandler = end
    parser.CharacterDataHandler = characters
    parser.StartDoctypeDeclHandler = forbidden
    parser.EntityDeclHandler = forbidden
    parser.ExternalEntityRefHandler = lambda *_args: 0
    parser.Parse(text.encode(), True)
    require(root is not None and not stack, "ORACLE_XML_ROOT", source["id"])
    return {"root": root, "nodeCount": node_count, "doctypeNeutralized": had_doctype}


def attr(node: dict | None, name: str) -> str | None:
    return None if node is None else node["attributes"].get(name)


def children(node: dict, namespace: str, name: str) -> list[dict]:
    return [item for item in node["children"] if item["namespace"] == namespace and item["name"] == name]


def descendants(node: dict) -> list[dict]:
    result = []
    for child in node["children"]:
        result.append(child)
        result.extend(descendants(child))
    return result


def qname(node: dict, value: str | None) -> dict | None:
    if value is None:
        return None
    require(value.count(":") <= 1, "ORACLE_QNAME_INVALID", value)
    prefix, separator, local = value.partition(":")
    if not separator:
        prefix, local = "", prefix
    require(bool(local), "ORACLE_QNAME_INVALID", value)
    namespace = node["bindings"].get(prefix)
    require(namespace is not None, "ORACLE_QNAME_UNBOUND", value)
    return {"lexical": value, "namespace": namespace, "localName": local}


def normalized_text(node: dict) -> str:
    pieces = list(node["text"])
    for child in node["children"]:
        pieces.append(normalized_text(child))
    return " ".join("".join(pieces).split())


def documentation(node: dict) -> list[dict]:
    result = []
    for item in descendants(node):
        if item["namespace"] == XSD and item["name"] == "documentation":
            encoded = normalized_text(item).encode()
            result.append({"utf8Bytes": len(encoded), "sha256": sha256(encoded)})
    return result


def facets(restriction: dict | None) -> list[dict]:
    supported = {"enumeration", "length", "maxLength", "minLength", "pattern"}
    if restriction is None:
        return []
    return [
        {"kind": item["name"], "value": attr(item, "value")}
        for item in restriction["children"]
        if item["namespace"] == XSD and item["name"] in supported
    ]


def schema_inventory(source: dict, parsed: dict) -> dict:
    root = parsed["root"]
    target = attr(root, "targetNamespace")
    require(bool(target), "ORACLE_XSD_NAMESPACE_MISSING", source["id"])
    simple_types = []
    for node in children(root, XSD, "simpleType"):
        restrictions = children(node, XSD, "restriction")
        restriction = restrictions[0] if restrictions else None
        simple_types.append({
            "name": attr(node, "name"),
            "base": qname(restriction, attr(restriction, "base")) if restriction else None,
            "facets": facets(restriction),
            "documentation": documentation(node),
        })
    elements = []

    def visit(node: dict, context: list[str], choice_depth: int) -> None:
        next_choice = choice_depth + int(node["namespace"] == XSD and node["name"] == "choice")
        next_context = context
        if node["namespace"] == XSD and node["name"] in ("complexType", "simpleType"):
            next_context = [*context, f"{node['name']}:{attr(node, 'name') or 'inline'}"]
        if node["namespace"] == XSD and node["name"] == "element":
            inline = children(node, XSD, "simpleType")
            restrictions = children(inline[0], XSD, "restriction") if inline else []
            elements.append({
                "context": next_context,
                "name": attr(node, "name"),
                "ref": qname(node, attr(node, "ref")),
                "type": qname(node, attr(node, "type")),
                "minOccurs": attr(node, "minOccurs") or "1",
                "maxOccurs": attr(node, "maxOccurs") or "1",
                "choiceDepth": next_choice,
                "inlineFacets": facets(restrictions[0] if restrictions else None),
                "documentation": documentation(node),
            })
            next_context = [*next_context, f"element:{attr(node, 'name') or attr(node, 'ref') or 'anonymous'}"]
        for child in node["children"]:
            visit(child, next_context, next_choice)

    visit(root, [f"schema:{target}"], 0)
    return {
        "sourceId": source["id"],
        "sourceSha256": source["sha256"],
        "targetNamespace": target,
        "elementFormDefault": attr(root, "elementFormDefault") or "unqualified",
        "topLevelElements": [
            {"name": attr(node, "name"), "ref": qname(node, attr(node, "ref")), "type": qname(node, attr(node, "type"))}
            for node in children(root, XSD, "element")
        ],
        "simpleTypes": simple_types,
        "complexTypes": [
            {"name": attr(node, "name"), "mixed": attr(node, "mixed") or "false", "documentation": documentation(node)}
            for node in children(root, XSD, "complexType")
        ],
        "elements": elements,
    }


def first_descendant(node: dict | None, namespace: str, name: str) -> dict | None:
    if node is None:
        return None
    return next((item for item in descendants(node) if item["namespace"] == namespace and item["name"] == name), None)


def soap_inventory(source: dict, parsed: dict) -> dict:
    root = parsed["root"]
    messages = [{
        "name": attr(message, "name"),
        "parts": [{
            "name": attr(part, "name"),
            "element": qname(part, attr(part, "element")),
            "type": qname(part, attr(part, "type")),
        } for part in children(message, WSDL, "part")],
    } for message in children(root, WSDL, "message")]
    port_types = []
    for port_type in children(root, WSDL, "portType"):
        operations = []
        for operation in children(port_type, WSDL, "operation"):
            input_node = children(operation, WSDL, "input")[0]
            output_node = children(operation, WSDL, "output")[0]
            operations.append({
                "name": attr(operation, "name"),
                "input": qname(input_node, attr(input_node, "message")),
                "output": qname(output_node, attr(output_node, "message")),
            })
        port_types.append({"name": attr(port_type, "name"), "operations": operations})
    bindings = []
    for binding in children(root, WSDL, "binding"):
        operations = []
        for operation in children(binding, WSDL, "operation"):
            soap_operation = children(operation, SOAP, "operation")
            inputs, outputs = children(operation, WSDL, "input"), children(operation, WSDL, "output")
            input_body = first_descendant(inputs[0] if inputs else None, SOAP, "body")
            output_body = first_descendant(outputs[0] if outputs else None, SOAP, "body")
            operations.append({
                "name": attr(operation, "name"),
                "soapAction": attr(soap_operation[0], "soapAction") if soap_operation else None,
                "inputUse": attr(input_body, "use"),
                "outputUse": attr(output_body, "use"),
            })
        bindings.append({
            "name": attr(binding, "name"),
            "type": qname(binding, attr(binding, "type")),
            "soap": [{"style": attr(item, "style"), "transport": attr(item, "transport")} for item in children(binding, SOAP, "binding")],
            "operations": operations,
        })
    services = []
    for service in children(root, WSDL, "service"):
        ports = []
        for port in children(service, WSDL, "port"):
            addresses = children(port, SOAP, "address")
            ports.append({
                "name": attr(port, "name"),
                "binding": qname(port, attr(port, "binding")),
                "address": attr(addresses[0], "location") if addresses else None,
            })
        services.append({"name": attr(service, "name"), "ports": ports})
    return {
        "sourceId": source["id"],
        "sourceSha256": source["sha256"],
        "name": attr(root, "name"),
        "targetNamespace": attr(root, "targetNamespace"),
        "messages": messages,
        "portTypes": port_types,
        "bindings": bindings,
        "services": services,
    }


def authenticate_sources(repository: pathlib.Path, configuration: dict) -> dict:
    directory = repository / "editions/source-snapshots" / configuration["sourceSnapshotId"]
    snapshot_bytes = safe_file(directory, "snapshot.json", "ORACLE_SNAPSHOT").read_bytes()
    manifest_bytes = safe_file(directory, "source-manifest.json", "ORACLE_MANIFEST").read_bytes()
    snapshot, manifest = json.loads(snapshot_bytes), json.loads(manifest_bytes)
    require(stable_bytes(snapshot) == snapshot_bytes, "ORACLE_SNAPSHOT_NONCANONICAL", "snapshot.json")
    require(stable_bytes(manifest) == manifest_bytes, "ORACLE_MANIFEST_NONCANONICAL", "source-manifest.json")
    require(snapshot["snapshotId"] == configuration["sourceSnapshotId"], "ORACLE_SNAPSHOT_BINDING", "snapshot ID")
    require(snapshot["immutable"] is True and snapshot["creationAllowed"] is False, "ORACLE_SNAPSHOT_STATE", "unsafe")
    require(snapshot["sourceManifest"]["sha256"] == sha256(manifest_bytes), "ORACLE_MANIFEST_DRIFT", "digest")
    closure = [{"id": item["id"], "sha256": item["sha256"], "dependencies": item["dependencies"]} for item in manifest["sources"]]
    require(snapshot["sourceClosureSha256"] == sha256(stable_bytes(closure)), "ORACLE_SOURCE_CLOSURE", "digest")
    ids, paths, raw_by_id = set(), set(), {}
    for source in manifest["sources"]:
        require(source["id"] not in ids and source["path"] not in paths, "ORACLE_SOURCE_DUPLICATE", source["id"])
        ids.add(source["id"])
        paths.add(source["path"])
        raw = safe_file(directory, source["path"], "ORACLE_SOURCE").read_bytes()
        require(
            len(raw) == source["bytes"] and sha256(raw) == source["sha256"] and hashlib.sha512(raw).hexdigest() == source["sha512"],
            "ORACLE_SOURCE_DRIFT",
            source["id"],
        )
        raw_by_id[source["id"]] = raw
    return {"snapshot": snapshot, "snapshotBytes": snapshot_bytes, "manifest": manifest, "manifestBytes": manifest_bytes, "rawById": raw_by_id}


def build_expected(repository: pathlib.Path, configuration: dict) -> dict:
    custody = authenticate_sources(repository, configuration)
    technical = [item for item in custody["manifest"]["sources"] if item["kind"] in ("xsd", "wsdl")]
    parsed = {item["id"]: parse_xml(item, custody["rawById"][item["id"]], configuration["doctypeNeutralization"]) for item in technical}
    schemas = [schema_inventory(item, parsed[item["id"]]) for item in technical if item["kind"] == "xsd"]
    wsdl_source = next(item for item in technical if item["kind"] == "wsdl")
    path_to_id = {item["path"]: item["id"] for item in technical}
    aliases = {item["location"]: item for item in configuration["importAliases"]}
    imports = []
    for source in technical:
        for node in descendants(parsed[source["id"]]["root"]):
            if node["namespace"] != XSD or node["name"] != "import":
                continue
            location, namespace = attr(node, "schemaLocation") or "", attr(node, "namespace") or ""
            dependency = aliases.get(location, {}).get("sourceId") if "://" in location else path_to_id.get(str(pathlib.PurePosixPath(source["path"]).parent / location))
            require(bool(dependency), "ORACLE_IMPORT_UNRESOLVED", f"{source['id']}:{location}")
            imports.append({"from": source["id"], "location": location, "namespace": namespace, "sourceId": dependency})
    documents = [{
        "sourceId": source["id"],
        "kind": source["kind"],
        "sha256": source["sha256"],
        "targetNamespace": attr(parsed[source["id"]]["root"], "targetNamespace"),
        "nodeCount": parsed[source["id"]]["nodeCount"],
        "doctypeNeutralized": parsed[source["id"]]["doctypeNeutralized"],
    } for source in technical]
    catalogues = [{
        "sourceId": schema["sourceId"],
        "targetNamespace": schema["targetNamespace"],
        "name": simple_type["name"],
        "values": [facet["value"] for facet in simple_type["facets"] if facet["kind"] == "enumeration"],
    } for schema in schemas for simple_type in schema["simpleTypes"] if any(facet["kind"] == "enumeration" for facet in simple_type["facets"])]
    return {
        "custody": custody,
        "documents": documents,
        "imports": imports,
        "schemas": schemas,
        "catalogues": catalogues,
        "soap": soap_inventory(wsdl_source, parsed[wsdl_source["id"]]),
    }


def load_generated(repository: pathlib.Path, edition_id: str) -> dict:
    directory = repository / "editions" / edition_id
    edition = json.loads(safe_file(directory, "edition.json", "ORACLE_EDITION").read_bytes())
    contracts, artifact_bytes = {}, []
    for entry in edition["contracts"]:
        raw = safe_file(directory, entry["path"], "ORACLE_ARTIFACT").read_bytes()
        contracts[entry["path"]] = json.loads(raw)
        artifact_bytes.append({"path": entry["path"], "bytes": len(raw), "sha256": sha256(raw)})
    public_bytes = []
    for entry in edition["publicSchemas"]:
        require(entry["path"].startswith("../../schemas/"), "ORACLE_PUBLIC_PATH_INVALID", entry["path"])
        raw = safe_file(repository, entry["path"].removeprefix("../../"), "ORACLE_PUBLIC").read_bytes()
        public_bytes.append({"path": entry["path"], "bytes": len(raw), "sha256": sha256(raw)})
    return {
        "edition": edition,
        "runtime": contracts["contracts/runtime-contracts.json"],
        "graph": contracts["contracts/schema-graph.json"],
        "fields": contracts["contracts/field-constraints.json"],
        "catalogues": contracts["contracts/catalogues.json"],
        "soap": contracts["contracts/soap-bindings.json"],
        "artifactBytes": artifact_bytes,
        "publicBytes": public_bytes,
    }


def differences(expected: dict, generated: dict, configuration: dict) -> list[str]:
    result = []
    snapshot = expected["custody"]["snapshot"]
    binding = {
        "id": snapshot["snapshotId"],
        "snapshotSha256": sha256(expected["custody"]["snapshotBytes"]),
        "sourceManifestSha256": sha256(expected["custody"]["manifestBytes"]),
        "sourceClosureSha256": snapshot["sourceClosureSha256"],
    }
    edition_binding = {key: generated["edition"]["sourceSnapshot"][key] for key in binding}
    ids = [generated["runtime"]["sourceSnapshot"]["id"], generated["graph"]["sourceSnapshotId"], generated["fields"]["sourceSnapshotId"], generated["catalogues"]["sourceSnapshotId"], generated["soap"]["sourceSnapshotId"]]
    if edition_binding != binding or any(item != configuration["sourceSnapshotId"] for item in ids):
        result.append("source-snapshot-binding")
    if generated["runtime"]["documents"] != expected["documents"]:
        result.append("document-identity")
    if generated["graph"]["imports"] != expected["imports"]:
        result.append("import-closure")
    expected_fields = [{key: value for key, value in item.items() if key != "simpleTypes"} for item in expected["schemas"]]
    actual_fields = [{key: value for key, value in item.items() if key != "simpleTypes"} for item in generated["fields"]["schemas"]]
    if actual_fields != expected_fields:
        result.append("field-cardinality")
    if [item["simpleTypes"] for item in generated["fields"]["schemas"]] != [item["simpleTypes"] for item in expected["schemas"]]:
        result.append("simple-type-facet")
    if generated["catalogues"]["catalogues"] != expected["catalogues"]:
        result.append("catalogue-value")
    actual_soap, expected_soap = generated["soap"]["wsdl"], expected["soap"]
    if {key: value for key, value in actual_soap.items() if key != "services"} != {key: value for key, value in expected_soap.items() if key != "services"}:
        result.append("soap-action")
    if actual_soap["services"] != expected_soap["services"]:
        result.append("soap-address")
    identities = [*generated["artifactBytes"], *generated["publicBytes"]]
    listed = [*generated["edition"]["contracts"], *generated["edition"]["publicSchemas"]]
    if identities != listed or sha256(stable_bytes(listed)) != generated["edition"]["outputClosureSha256"]:
        result.append("artifact-digest")
    if not (generated["edition"]["status"] == "candidate" and generated["edition"]["immutable"] is True and generated["edition"]["creationAllowed"] is False and generated["runtime"]["coverage"]["creationAllowed"] is False and snapshot["creationAllowed"] is False):
        result.append("creation-state")
    return result


def seed_mutations() -> dict:
    return {
        "source-snapshot-binding": ("source-snapshot-binding", lambda value: value["runtime"]["sourceSnapshot"].__setitem__("id", "drift")),
        "document-identity": ("document-identity", lambda value: value["runtime"]["documents"][0].__setitem__("sha256", "0" * 64)),
        "import-closure": ("import-closure", lambda value: value["graph"]["imports"].pop()),
        "field-cardinality": ("field-cardinality", lambda value: value["fields"]["schemas"][0]["elements"][0].__setitem__("minOccurs", "0")),
        "simple-type-facet": ("simple-type-facet", lambda value: value["fields"]["schemas"][0]["simpleTypes"][0]["facets"][0].__setitem__("value", "seeded")),
        "catalogue-value": ("catalogue-value", lambda value: value["catalogues"]["catalogues"][0]["values"].append("seeded")),
        "soap-action": ("soap-action", lambda value: value["soap"]["wsdl"]["bindings"][0]["operations"][0].__setitem__("soapAction", "seeded")),
        "soap-address": ("soap-address", lambda value: value["soap"]["wsdl"]["services"][0]["ports"][0].__setitem__("address", "https://invalid.example/")),
        "artifact-digest": ("artifact-digest", lambda value: value["edition"]["contracts"][0].__setitem__("sha256", "0" * 64)),
        "creation-state": ("creation-state", lambda value: value["edition"].__setitem__("creationAllowed", True)),
    }


def main() -> None:
    repository = pathlib.Path(os.environ.get("VERIFACTU_REPOSITORY_ROOT", pathlib.Path(__file__).resolve().parents[2]))
    required = (3, 13, 15)
    require(sys.version_info[:3] == required, "ORACLE_PYTHON_VERSION", f"expected {required}; observed {sys.version_info[:3]}")
    configuration = json.loads((repository / "config/regulatory/contract-generation.json").read_bytes())
    seed_path = repository / "fixtures/adversarial/p3-oracle-seeded-defects.json"
    seed_manifest = json.loads(seed_path.read_bytes())
    expected = build_expected(repository, configuration)
    generated = load_generated(repository, configuration["candidateEditionId"])
    baseline = differences(expected, generated, configuration)
    require(not baseline, "ORACLE_BASELINE_MISMATCH", ",".join(baseline))
    mutations = seed_mutations()
    require([item["id"] for item in seed_manifest["defects"]] == list(mutations), "ORACLE_SEED_MANIFEST_DRIFT", "IDs/order")
    caught = []
    for item in seed_manifest["defects"]:
        seeded = copy.deepcopy(generated)
        discrepancy, mutate = mutations[item["id"]]
        mutate(seeded)
        require(discrepancy in differences(expected, seeded, configuration) and item["expectedDiscrepancy"] == discrepancy, "ORACLE_SEEDED_DEFECT_MISSED", item["id"])
        caught.append({"id": item["id"], "discrepancy": discrepancy})
    evidence = {
        "schemaVersion": 1,
        "control": "p3-independent-regulatory-oracle",
        "result": "passed",
        "evidence": {
            "implementation": "python-stdlib-expat-independent-from-production-parser",
            "implementationSha256": sha256(pathlib.Path(__file__).read_bytes()),
            "python": ".".join(str(part) for part in required),
            "expat": xml.parsers.expat.EXPAT_VERSION,
            "sourceSnapshotId": configuration["sourceSnapshotId"],
            "sourceClosureSha256": expected["custody"]["snapshot"]["sourceClosureSha256"],
            "candidateEditionId": configuration["candidateEditionId"],
            "outputClosureSha256": generated["edition"]["outputClosureSha256"],
            "sourceObjectCount": len(expected["custody"]["manifest"]["sources"]),
            "technicalDocumentCount": len(expected["documents"]),
            "fieldDeclarationCount": sum(len(item["elements"]) for item in expected["schemas"]),
            "catalogueCount": len(expected["catalogues"]),
            "soapServiceCount": len(expected["soap"]["services"]),
            "baselineDifferences": 0,
            "seedManifestSha256": sha256(seed_path.read_bytes()),
            "seededDefectsCaught": caught,
            "networkUsed": False,
        },
    }
    print(json.dumps(evidence, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"schemaVersion": 1, "control": "p3-independent-regulatory-oracle", "result": "failed", "code": type(error).__name__, "message": str(error)}, ensure_ascii=False, indent=2), file=sys.stderr)
        raise SystemExit(1) from error
