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
    expected_type = request["targetType"]
    document_transforms = request["documentTransforms"]
    properties_transforms = request["signedPropertiesTransforms"]
    canonicalization = request["canonicalization"]
    policy_identifier = request["policyIdentifier"]
    identifiers = root.xpath('//*[@Id]')
    ids = [node.get("Id") for node in identifiers]
    if len(ids) != len(set(ids)):
        return invalid("DIAG-XADES-UNIQUE-ID")
    if etree.QName(root).localname != expected_type:
        return invalid("DIAG-XADES-TARGET")
    ns = {"ds":"http://www.w3.org/2000/09/xmldsig#", "xades":"http://uri.etsi.org/01903/v1.3.2#"}
    signatures = root.xpath('./ds:Signature', namespaces=ns)
    if len(root.xpath('.//ds:Signature', namespaces=ns)) != 1 or len(signatures) != 1:
        return invalid("DIAG-XADES-REFERENCE")
    signature = signatures[0]
    canonical = signature.xpath('./ds:SignedInfo/ds:CanonicalizationMethod/@Algorithm', namespaces=ns)
    if canonical != [canonicalization]:
        return invalid("DIAG-XADES-CANONICALIZATION")
    signature_method = signature.xpath('./ds:SignedInfo/ds:SignatureMethod/@Algorithm', namespaces=ns)
    if signature_method != ["http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"]:
        return invalid("DIAG-XADES-ALGORITHM")
    signature_values = signature.xpath('./ds:SignatureValue/text()', namespaces=ns)
    if len(signature_values) != 1 or not signature_values[0].strip():
        return invalid("DIAG-XADES-SIGNATURE")
    references = signature.xpath('./ds:SignedInfo/ds:Reference', namespaces=ns)
    if len(references) != 2:
        return invalid("DIAG-XADES-REFERENCE")
    document = references[0]
    properties = references[1]
    if document.get("URI") != "" or document.get("Type") is not None:
        return invalid("DIAG-XADES-REFERENCE")
    actual = [node.get("Algorithm") for node in document.xpath('./ds:Transforms/ds:Transform', namespaces=ns)]
    if actual != document_transforms or any(value is None for value in actual):
        return invalid("DIAG-XADES-TRANSFORM")
    uri = properties.get("URI")
    if properties.get("Type") != "http://uri.etsi.org/01903#SignedProperties" or not uri or not uri.startswith("#"):
        return invalid("DIAG-XADES-REFERENCE")
    properties_id = uri[1:]
    if properties_id not in ids:
        return invalid("DIAG-XADES-REFERENCE")
    signed_properties = next(node for node in identifiers if node.get("Id") == properties_id)
    if etree.QName(signed_properties).namespace != ns["xades"] or etree.QName(signed_properties).localname != "SignedProperties":
        return invalid("DIAG-XADES-REFERENCE")
    actual = [node.get("Algorithm") for node in properties.xpath('./ds:Transforms/ds:Transform', namespaces=ns)]
    if actual != properties_transforms or any(value is None for value in actual):
        return invalid("DIAG-XADES-TRANSFORM")
    digest_methods = signature.xpath('./ds:SignedInfo/ds:Reference/ds:DigestMethod/@Algorithm', namespaces=ns)
    digest_values = signature.xpath('./ds:SignedInfo/ds:Reference/ds:DigestValue/text()', namespaces=ns)
    if digest_methods != ["http://www.w3.org/2001/04/xmlenc#sha256"] * 2 or len(digest_values) != 2 or any(not value.strip() for value in digest_values):
        return invalid("DIAG-XADES-ALGORITHM")
    policy = signed_properties.xpath('./xades:SignedSignatureProperties/xades:SignaturePolicyIdentifier/xades:SignaturePolicyId/xades:SigPolicyId/xades:Identifier/text()', namespaces=ns)
    signing_time = signed_properties.xpath('./xades:SignedSignatureProperties/xades:SigningTime/text()', namespaces=ns)
    certificates = signed_properties.xpath('./xades:SignedSignatureProperties/xades:SigningCertificate/xades:Cert', namespaces=ns)
    if policy != [policy_identifier] or len(signing_time) != 1 or len(certificates) < 1:
        return invalid("DIAG-XADES-PROPERTIES")
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
        targetType: request.targetType,
        documentTransforms: request.documentTransforms,
        signedPropertiesTransforms: request.signedPropertiesTransforms,
        canonicalization: request.canonicalization,
        policyIdentifier: request.policyIdentifier,
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
    typeof value.targetType === "string" &&
    value.targetType.length > 0 &&
    typeof value.canonicalization === "string" &&
    typeof value.policyIdentifier === "string" &&
    Array.isArray(value.documentTransforms) &&
    Array.isArray(value.signedPropertiesTransforms) &&
    value.documentTransforms.length > 0 &&
    value.signedPropertiesTransforms.length > 0 &&
    value.documentTransforms.every((item) => typeof item === "string") &&
    value.signedPropertiesTransforms.every((item) => typeof item === "string")
  );
}

function freeze(kind, diagnostics) {
  return Object.freeze({ kind, diagnostics: Object.freeze([...diagnostics]) });
}
