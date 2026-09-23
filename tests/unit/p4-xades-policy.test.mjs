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
const profile = () => ({
  id: "AEAT-XADES-EPES",
  editionId: edition,
  form: "XAdES-EPES",
  signaturePlacement: "enveloped",
  digestAlgorithm: "SHA-256",
  signatureAlgorithm: "RSA-SHA256",
  canonicalization: "http://www.w3.org/2001/10/xml-exc-c14n#",
  policyIdentifier: "urn:oid:2.16.724.1.3.1.1.2.1.9",
  expectedTargetType: "RegistroAlta",
  requiredTransforms: ["http://www.w3.org/2000/09/xmldsig#enveloped-signature"],
  minimumRsaBits: 2048,
});
const request = () => ({
  editionId: edition,
  profileId: "AEAT-XADES-EPES",
  artifactSha256: fingerprint,
  unsignedXml: new TextEncoder().encode('<RegistroAlta Id="r1"/>'),
  expectedTargetId: "r1",
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
    '<RegistroAlta Id="r1"><Signature/></RegistroAlta>',
  ),
  certificateChainDer: [Uint8Array.of(1)],
  references: [
    {
      uri: "#r1",
      targetId: "r1",
      targetType: "RegistroAlta",
      transforms: ["http://www.w3.org/2000/09/xmldsig#enveloped-signature"],
      digestAlgorithm: "SHA-256",
    },
  ],
  report: { providerId: "isolated", capabilityVersion: "1", diagnostics: [] },
  ...overrides,
});

test("P4-D fixes EPES/SHA-256/enveloped profile and rejects downgrade drift", () => {
  assert.equal(api.defineXadesProfile(profile()).status, "succeeded");
  for (const invalid of [
    { ...profile(), form: "XAdES-BES" },
    { ...profile(), digestAlgorithm: "SHA-1" },
    { ...profile(), signatureAlgorithm: "RSA-SHA1" },
    { ...profile(), minimumRsaBits: 1024 },
    { ...profile(), requiredTransforms: [] },
    { ...profile(), requiredTransforms: ["wrong"] },
  ])
    assert.equal(api.defineXadesProfile(invalid).status, "invalid");
});

test("P4-D accepts only one exact expected local reference and valid certificate evidence", () => {
  const result = api.verifyXadesProviderResponse(
    value(api.defineXadesProfile(profile())),
    request(),
    response(),
    certificate(),
  );
  assert.equal(result.status, "succeeded");
  for (const [changedResponse, changedCertificate] of [
    [response({ references: [] }), certificate()],
    [
      response({
        references: [{ ...response().references[0], uri: "#other" }],
      }),
      certificate(),
    ],
    [
      response({
        references: [{ ...response().references[0], transforms: [] }],
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
