import assert from "node:assert/strict";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    new URL(
      "../../evidence/runs/artifacts/build/verifactu/dist/index.js",
      import.meta.url,
    ).href
);
const value = (result) => {
  assert.equal(result.status, "succeeded");
  return result.value;
};
const edition = value(api.identity("edition", "rrsif-test-active"));
const fingerprint = "a".repeat(64);
const enveloped = "http://www.w3.org/2000/09/xmldsig#enveloped-signature";
const c14n = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
const profile = () => ({
  id: "AEAT-XADES-EPES",
  editionId: edition,
  form: "XAdES-EPES",
  signaturePlacement: "enveloped",
  digestAlgorithm: "SHA-256",
  signatureAlgorithm: "RSA-SHA256",
  canonicalization: c14n,
  policyIdentifier: "urn:oid:2.16.724.1.3.1.1.2.1.9",
  expectedTargetType: "RegistroAlta",
  documentTransforms: [enveloped],
  signedPropertiesTransforms: [c14n],
  minimumRsaBits: 2048,
});
const request = () => ({
  editionId: edition,
  profileId: "AEAT-XADES-EPES",
  artifactSha256: fingerprint,
  unsignedXml: new TextEncoder().encode("<RegistroAlta/>"),
  key: {
    providerId: "isolated",
    keyId: "opaque-handle",
    certificateFingerprintSha256: fingerprint,
  },
  signingInstant: value(api.parseFiscalInstant("2026-09-22T10:00:00Z")),
  deadlineMs: 1000,
});
const certificate = (overrides = {}) => ({
  status: "valid",
  certificateFingerprintSha256: fingerprint,
  chain: "valid",
  time: "valid",
  revocation: "valid",
  authorization: "valid",
  diagnostics: [],
  ...overrides,
});
const response = (overrides = {}) => ({
  signedXml: new TextEncoder().encode(
    "<RegistroAlta><Signature/></RegistroAlta>",
  ),
  certificateChainDer: [Uint8Array.of(1)],
  references: [
    {
      uri: "",
      targetId: "",
      targetType: "RegistroAlta",
      type: "",
      transforms: [enveloped],
      digestAlgorithm: "SHA-256",
    },
    {
      uri: "#signed-properties-1",
      targetId: "signed-properties-1",
      targetType: "SignedProperties",
      type: "http://uri.etsi.org/01903#SignedProperties",
      transforms: [c14n],
      digestAlgorithm: "SHA-256",
    },
  ],
  report: { providerId: "isolated", capabilityVersion: "1", diagnostics: [] },
  ...overrides,
});

test("P4-D fixes the official EPES reference topology and rejects profile downgrade drift", () => {
  assert.equal(api.defineXadesProfile(profile()).status, "succeeded");
  for (const invalid of [
    { ...profile(), form: "XAdES-BES" },
    { ...profile(), digestAlgorithm: "SHA-1" },
    { ...profile(), signatureAlgorithm: "RSA-SHA1" },
    { ...profile(), canonicalization: "wrong" },
    { ...profile(), minimumRsaBits: 1024 },
    { ...profile(), documentTransforms: [] },
    { ...profile(), signedPropertiesTransforms: [] },
  ])
    assert.equal(api.defineXadesProfile(invalid).status, "invalid");
});
test("P4-D accepts only exact document and SignedProperties references with valid certificate evidence", () => {
  assert.equal(
    api.verifyXadesProviderResponse(
      value(api.defineXadesProfile(profile())),
      request(),
      response(),
      certificate(),
    ).status,
    "succeeded",
  );
  for (const [changedResponse, changedCertificate] of [
    [response({ references: [] }), certificate()],
    [
      response({
        references: [
          { ...response().references[0], uri: "#other" },
          response().references[1],
        ],
      }),
      certificate(),
    ],
    [
      response({
        references: [
          response().references[0],
          { ...response().references[1], type: "" },
        ],
      }),
      certificate(),
    ],
    [
      response({
        references: [
          response().references[0],
          { ...response().references[1], transforms: [] },
        ],
      }),
      certificate(),
    ],
    [
      response({
        report: {
          providerId: "swapped",
          capabilityVersion: "1",
          diagnostics: [],
        },
      }),
      certificate(),
    ],
    [response(), certificate({ revocation: "invalid" })],
    [response(), certificate({ authorization: "invalid" })],
    [response(), certificate({ certificateFingerprintSha256: "b".repeat(64) })],
  ])
    assert.equal(
      api.verifyXadesProviderResponse(
        value(api.defineXadesProfile(profile())),
        request(),
        changedResponse,
        changedCertificate,
      ).status,
      "invalid",
    );
});
