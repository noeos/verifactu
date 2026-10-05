import { createHash, randomUUID, X509Certificate } from "node:crypto";
import { createAeatEditionProfile } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/edition-profile.js";
import { context, hash, identity } from "./p5-domain-fixture.mjs";
import { createP5TestPki } from "./p5-test-pki.mjs";

export { context, hash, identity } from "./p5-domain-fixture.mjs";
export const testCredentialHandle = () => `test-${randomUUID()}`;

const namespaces = [
  { prefix: "vf", namespace: "https://example.test/verifactu" },
  { prefix: "r", namespace: "https://example.test/response" },
  { prefix: "f", namespace: "https://example.test/fiscal" },
  { prefix: "s", namespace: "http://schemas.xmlsoap.org/soap/envelope/" },
];
const response = {
  responseQName: "r:SubmitResponse",
  soapFaultQName: "s:Fault",
  globalStatusQName: "r:GlobalStatus",
  waitTimeQName: "r:Wait",
  lineQName: "r:Line",
  lineIdentityPaths: ["r:Issuer", "r:Series", "r:Number", "r:IssueDate"],
  lineStatusQName: "r:State",
  lineErrorCodeQName: "r:ErrorCode",
  allowedResponseChildren: ["r:GlobalStatus", "r:Wait", "r:Line"],
  allowedLineChildren: [
    "r:Issuer",
    "r:Series",
    "r:Number",
    "r:IssueDate",
    "r:State",
    "r:ErrorCode",
  ],
  acceptedGlobalValues: ["Correcto"],
  partialGlobalValues: ["ParcialmenteCorrecto"],
  rejectedGlobalValues: ["Incorrecto"],
  acceptedLineValues: ["Correcto"],
  qualifiedLineValues: ["AceptadoConErrores"],
  rejectedLineValues: ["Incorrecto"],
};
const endpoint = (id, environment) => ({
  id,
  environment,
  url: `https://${environment}.example.test/soap`,
  serviceId: `synthetic-${environment}`,
  portId: `port-${environment}`,
});
const operation = (id, purpose) => ({
  id,
  purpose,
  wsdlDigest: hash(`wsdl:${id}`),
  requestSchemaDigest: hash(`request:${id}`),
  responseSchemaDigest: hash(`response:${id}`),
  endpoints: [
    endpoint(`${id}-test`, "test"),
    endpoint(`${id}-production`, "production"),
  ],
  binding: {
    soapVersion: "1.1",
    envelopeNamespace: "http://schemas.xmlsoap.org/soap/envelope/",
    serviceNamespace: "https://example.test/verifactu",
    soapAction: `urn:synthetic:${id}`,
    method: "POST",
    contentType: "text/xml; charset=utf-8",
    headerQName: "vf:Header",
    requestQName: "vf:Submit",
    responseQName: "r:SubmitResponse",
    namespaceBindings: namespaces,
    headerFields: [
      { name: "Taxpayer", valueKind: "taxpayer" },
      { name: "Installation", valueKind: "installation" },
      { name: "Product", valueKind: "product" },
      { name: "Version", valueKind: "software-version" },
      { name: "InstallationNumber", valueKind: "installation-number" },
    ],
    maxRequestBytes: 65_536,
    maxResponseBytes: 1_048_576,
    maxBatchItems: 20,
    requiresMtls: true,
  },
  response,
});

export function profile(overrides = {}) {
  const result = createAeatEditionProfile({
    editionId: "test-edition",
    sourceManifestSha256: hash("source"),
    generatedOutputSha256: hash("generated"),
    sourceClosureVerified: true,
    lifecycle: "active",
    creationAllowed: true,
    activationEvidenceId: "synthetic-activation",
    operations: [
      operation("voluntary-submission", "voluntary"),
      operation("consultation", "consultation"),
      operation("authority-requested-submission", "authority-requested"),
    ],
    ...overrides,
  });
  if (result.status !== "ok") throw new Error(JSON.stringify(result));
  return result.value;
}



export const acceptedResponse = Buffer.from(
  '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:r="https://example.test/response"><s:Body><r:SubmitResponse><r:GlobalStatus>Correcto</r:GlobalStatus><r:Wait>1</r:Wait><r:Line><r:Issuer>ES123</r:Issuer><r:Series>A</r:Series><r:Number>1</r:Number><r:IssueDate>2026-10-03</r:IssueDate><r:State>Correcto</r:State></r:Line></r:SubmitResponse></s:Body></s:Envelope>',
);

export const p5TestPki = createP5TestPki();
const syntheticClientCertificate = p5TestPki.clientCertificate;
const syntheticClientCertificateFingerprint = `sha256:${createHash("sha256").update(new X509Certificate(syntheticClientCertificate).raw).digest("hex")}`;
export const certificateAuthorization = Object.freeze({
  credentialId: "credential-1",
  credentialHandle: testCredentialHandle(),
  context,
  environment: "test",
  purpose: "tls-client-authentication",
  certificateFingerprint: syntheticClientCertificateFingerprint,
  subjectDigest: `sha256:${hash("subject")}`,
  authorizationEvidenceId: "authorization-1",
  authorizedAt: "2026-10-03T12:00:00.000Z",
});
