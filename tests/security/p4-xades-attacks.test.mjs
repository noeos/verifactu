import assert from "node:assert/strict";
import test from "node:test";
const { inspectXadesEnvelope } = await import(
  process.env.VERIFACTU_XADES_PROVIDER_ENTRY ??
    new URL("../../internal/xades-provider/provider.mjs", import.meta.url).href
);
const encode = (value) => new TextEncoder().encode(value);
const transform = "http://www.w3.org/2000/09/xmldsig#enveloped-signature";
const c14n = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
const policy = "urn:oid:2.16.724.1.3.1.1.2.1.9";
const withSignatureValue = (xml) =>
  xml.includes("<ds:SignatureValue")
    ? xml
    : xml.replace(
        "</ds:SignedInfo>",
        "</ds:SignedInfo><ds:SignatureValue>test-signature</ds:SignatureValue>",
      );
const request = (xml) => ({
  xml: encode(withSignatureValue(xml)),
  targetType: "RegistroAlta",
  documentTransforms: [transform],
  signedPropertiesTransforms: [c14n],
  canonicalization: c14n,
  policyIdentifier: policy,
});
const valid = `<RegistroAlta><ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xades="http://uri.etsi.org/01903/v1.3.2#"><ds:SignedInfo><ds:CanonicalizationMethod Algorithm="${c14n}"/><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/><ds:Reference URI=""><ds:Transforms><ds:Transform Algorithm="${transform}"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>document-digest</ds:DigestValue></ds:Reference><ds:Reference Type="http://uri.etsi.org/01903#SignedProperties" URI="#signed-properties-1"><ds:Transforms><ds:Transform Algorithm="${c14n}"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>properties-digest</ds:DigestValue></ds:Reference></ds:SignedInfo><ds:Object><xades:QualifyingProperties><xades:SignedProperties Id="signed-properties-1"><xades:SignedSignatureProperties><xades:SigningTime>2026-09-22T10:00:00Z</xades:SigningTime><xades:SigningCertificate><xades:Cert/></xades:SigningCertificate><xades:SignaturePolicyIdentifier><xades:SignaturePolicyId><xades:SigPolicyId><xades:Identifier>${policy}</xades:Identifier></xades:SigPolicyId></xades:SignaturePolicyId></xades:SignaturePolicyIdentifier></xades:SignedSignatureProperties></xades:SignedProperties></xades:QualifyingProperties></ds:Object></ds:Signature></RegistroAlta>`;
const options = { pythonExecutable: process.env.VERIFACTU_PYTHON };
test("P4-D accepts AEAT-style document and SignedProperties references", () =>
  assert.deepEqual(inspectXadesEnvelope(request(valid), options), {
    kind: "valid",
    diagnostics: [],
  }));
test("P4-D rejects wrapping, external references, transform and profile drift", () => {
  for (const [xml, diagnostic] of [
    [
      valid.replace(
        "</RegistroAlta>",
        '<RegistroAlta Id="signed-properties-1"/></RegistroAlta>',
      ),
      "DIAG-XADES-UNIQUE-ID",
    ],
    [
      valid.replace(
        'URI="#signed-properties-1"',
        'URI="https://attacker.invalid/x"',
      ),
      "DIAG-XADES-REFERENCE",
    ],
    [
      valid.replace(transform, "http://www.w3.org/TR/1999/REC-xslt-19991116"),
      "DIAG-XADES-TRANSFORM",
    ],
    [
      valid
        .replace("<RegistroAlta", "<Other")
        .replace("</RegistroAlta>", "</Other>"),
      "DIAG-XADES-TARGET",
    ],
    [
      valid.replace(
        "</ds:SignedInfo>",
        '<ds:Reference URI=""/></ds:SignedInfo>',
      ),
      "DIAG-XADES-REFERENCE",
    ],
    [valid.replace(c14n, "wrong"), "DIAG-XADES-CANONICALIZATION"],
    [valid.replace("rsa-sha256", "rsa-sha1"), "DIAG-XADES-ALGORITHM"],
    [valid.replace(policy, "urn:oid:wrong"), "DIAG-XADES-PROPERTIES"],
  ])
    assert.deepEqual(inspectXadesEnvelope(request(xml), options), {
      kind: "invalid",
      diagnostics: [diagnostic],
    });
});
test("P4-D rejects a profile-shaped envelope with no SignatureValue", () => {
  const input = request(valid);
  assert.deepEqual(
    inspectXadesEnvelope({ ...input, xml: encode(valid) }, options),
    {
      kind: "invalid",
      diagnostics: ["DIAG-XADES-SIGNATURE"],
    },
  );
});
test("P4-D rejects hostile XML and absent isolated engines fail closed", () => {
  assert.deepEqual(
    inspectXadesEnvelope(request("<!DOCTYPE a><RegistroAlta/>"), options),
    { kind: "invalid", diagnostics: ["DIAG-XADES-MARKUP"] },
  );
  assert.deepEqual(
    inspectXadesEnvelope(request(valid), {
      pythonExecutable: "/absent/python",
    }),
    { kind: "unavailable", diagnostics: ["DIAG-XADES-UNAVAILABLE"] },
  );
});
