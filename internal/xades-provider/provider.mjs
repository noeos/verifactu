import { spawnSync } from "node:child_process";

const MAXIMUM_XML_BYTES = 4_194_304;
const FORBIDDEN = /<!\s*(?:DOCTYPE|ENTITY)\b|<\?xml-stylesheet\b/iu;

const INSPECTOR = String.raw`
import base64, json, sys
from lxml import etree

def invalid(code):
    return {"kind":"invalid","diagnostics":[code]}

def main():
    request = json.loads(sys.stdin.buffer.read())
    parser = etree.XMLParser(attribute_defaults=False, collect_ids=False,
        dtd_validation=False, huge_tree=False, load_dtd=False, no_network=True,
        recover=False, resolve_entities=False)
    root = etree.fromstring(base64.b64decode(request["xml"], validate=True), parser)
    target_id = request["targetId"]
    expected_type = request["targetType"]
    transforms = request["transforms"]
    identifiers = root.xpath('//*[@Id]')
    if sum(1 for node in identifiers if node.get("Id") == target_id) != 1:
        return invalid("DIAG-XADES-UNIQUE-ID")
    target = next(node for node in identifiers if node.get("Id") == target_id)
    if etree.QName(target).localname != expected_type:
        return invalid("DIAG-XADES-TARGET")
    ns = {"ds":"http://www.w3.org/2000/09/xmldsig#"}
    signatures = root.xpath('.//ds:Signature', namespaces=ns)
    references = root.xpath('.//ds:Signature/ds:SignedInfo/ds:Reference', namespaces=ns)
    if len(signatures) != 1 or len(references) != 1:
        return invalid("DIAG-XADES-REFERENCE")
    reference = references[0]
    if reference.get("URI") != "#" + target_id:
        return invalid("DIAG-XADES-REFERENCE")
    actual = [node.get("Algorithm") for node in reference.xpath('./ds:Transforms/ds:Transform', namespaces=ns)]
    if actual != transforms or any(value is None for value in actual):
        return invalid("DIAG-XADES-TRANSFORM")
    return {"kind":"valid","diagnostics":[]}

try:
    sys.stdout.write(json.dumps(main(), separators=(",",":"), sort_keys=True))
except etree.XMLSyntaxError:
    sys.stdout.write('{"diagnostics":["DIAG-XADES-SYNTAX"],"kind":"invalid"}')
except Exception:
    sys.stdout.write('{"diagnostics":["DIAG-XADES-PROVIDER"],"kind":"defect"}')
`;

export function inspectXadesEnvelope(request, options = {}) {
  if (options.signal?.aborted === true)
    return freeze("cancelled", ["DIAG-XADES-CANCELLED"]);
  if (!validRequest(request)) return freeze("defect", ["DIAG-XADES-REQUEST"]);
  if (request.xml.byteLength > MAXIMUM_XML_BYTES)
    return freeze("limit", ["DIAG-XADES-BYTES"]);
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(request.xml);
  } catch {
    return freeze("invalid", ["DIAG-XADES-UTF8"]);
  }
  if (FORBIDDEN.test(text)) return freeze("invalid", ["DIAG-XADES-MARKUP"]);
  const execution = spawnSync(
    options.pythonExecutable ?? process.env.VERIFACTU_PYTHON ?? "python3",
    ["-I", "-c", INSPECTOR],
    {
      encoding: "utf8",
      env: {},
      input: JSON.stringify({
        xml: Buffer.from(request.xml).toString("base64"),
        targetId: request.targetId,
        targetType: request.targetType,
        transforms: request.transforms,
      }),
      killSignal: "SIGKILL",
      timeout: options.deadlineMs ?? 5_000,
      maxBuffer: 65_536,
      windowsHide: true,
    },
  );
  if (execution.error?.code === "ETIMEDOUT")
    return freeze("limit", ["DIAG-XADES-DEADLINE"]);
  if (execution.error?.code === "ENOENT")
    return freeze("unavailable", ["DIAG-XADES-UNAVAILABLE"]);
  if (execution.error !== undefined || execution.status !== 0)
    return freeze("defect", ["DIAG-XADES-PROVIDER"]);
  try {
    const result = JSON.parse(execution.stdout);
    if (
      !["valid", "invalid", "defect"].includes(result?.kind) ||
      !Array.isArray(result.diagnostics) ||
      !result.diagnostics.every((value) => typeof value === "string")
    )
      throw new Error("invalid inspector response");
    return freeze(result.kind, result.diagnostics);
  } catch {
    return freeze("defect", ["DIAG-XADES-PROVIDER"]);
  }
}

function validRequest(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    value.xml instanceof Uint8Array &&
    typeof value.targetId === "string" &&
    value.targetId.length > 0 &&
    typeof value.targetType === "string" &&
    value.targetType.length > 0 &&
    Array.isArray(value.transforms) &&
    value.transforms.length > 0 &&
    value.transforms.every((item) => typeof item === "string")
  );
}

function freeze(kind, diagnostics) {
  return Object.freeze({ kind, diagnostics: Object.freeze([...diagnostics]) });
}
