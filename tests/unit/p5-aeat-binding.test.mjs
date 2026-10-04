import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createAeatEditionProfile, resolveAeatEndpoint, verifyAeatEditionProfile } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/edition-profile.js";
import { buildSoapRequest, isSafeXmlElementFragment } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/soap-wire.js";
import { planAeatBatches } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/batch-planner.js";
import { parseAeatResponse } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/response-parser.js";
import { createFiscalContext } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";
import { createIdentity } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";
import { recordP5FaultDetection } from "../support/p5-fault-evidence.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const id = (kind, value) => createIdentity(kind, value).value;
const context = createFiscalContext({ tenantId: id("tenant", "tenant-a"), taxpayerId: id("taxpayer", "ES123"), installationId: id("installation", "install-1"), editionId: id("edition", "test-edition") }).value;

function profile(overrides = {}) {
  const operation = {
    id: "voluntary-submission", purpose: "voluntary", wsdlDigest: hash("wsdl"),
    requestSchemaDigest: hash("request-xsd"), responseSchemaDigest: hash("response-xsd"),
    endpoints: [
      { id: "test-service", environment: "test", url: "https://test.example.test/soap", serviceId: "synthetic-service", portId: "test-port" },
      { id: "production-service", environment: "production", url: "https://aeat.example.test/soap", serviceId: "synthetic-service", portId: "production-port" },
    ],
    binding: {
      soapVersion: "1.1", envelopeNamespace: "http://schemas.xmlsoap.org/soap/envelope/", serviceNamespace: "https://example.test/verifactu",
      soapAction: "urn:synthetic:submit", method: "POST", contentType: "text/xml; charset=utf-8", headerQName: "vf:Header", requestQName: "vf:Submit", responseQName: "r:SubmitResponse",
      namespaceBindings: [
        { prefix: "vf", namespace: "https://example.test/verifactu" },
        { prefix: "r", namespace: "https://example.test/response" },
        { prefix: "f", namespace: "https://example.test/fiscal" },
        { prefix: "s", namespace: "http://schemas.xmlsoap.org/soap/envelope/" },
      ],
      headerFields: [
        { name: "Taxpayer", valueKind: "taxpayer" },
        { name: "Installation", valueKind: "installation" },
        { name: "Product", valueKind: "product" },
        { name: "Version", valueKind: "software-version" },
        { name: "InstallationNumber", valueKind: "installation-number" },
      ],
      maxRequestBytes: 65_536, maxResponseBytes: 1_048_576, maxBatchItems: 20, requiresMtls: true,
    },
    response: {
      responseQName: "r:SubmitResponse", soapFaultQName: "s:Fault", globalStatusQName: "r:GlobalStatus", waitTimeQName: "r:Wait",
      lineQName: "r:Line", lineIdentityPaths: ["r:RecordId"], lineStatusQName: "r:State", lineErrorCodeQName: "r:ErrorCode",
      allowedResponseChildren: ["r:GlobalStatus", "r:Wait", "r:Line"], allowedLineChildren: ["r:RecordId", "r:State", "r:ErrorCode"],
      acceptedGlobalValues: ["Correcto"], partialGlobalValues: ["ParcialmenteCorrecto"], rejectedGlobalValues: ["Incorrecto"],
      acceptedLineValues: ["Correcto"], qualifiedLineValues: ["AceptadoConErrores"], rejectedLineValues: ["Incorrecto"],
    },
  };
  const created = createAeatEditionProfile({
    editionId: "test-edition", sourceManifestSha256: hash("sources"), generatedOutputSha256: hash("generated"),
    sourceClosureVerified: true, lifecycle: "active", creationAllowed: true, activationEvidenceId: "synthetic-activation",
    operations: [operation], ...overrides,
  });
  assert.equal(created.status, "ok", JSON.stringify(created));
  return created.value;
}

test("edition profile binds service metadata, endpoint allowlist and activation state", () => {
  const valid = profile();
  assert.equal(verifyAeatEditionProfile(valid), true);
  const resolved = resolveAeatEndpoint(valid, "voluntary-submission", "test", context, context);
  assert.equal(resolved.status, "ok");
  assert.equal(resolved.value.endpointId, "test-service");
  assert.equal(resolveAeatEndpoint(valid, "voluntary-submission", "production", context, { ...context, taxpayerId: id("taxpayer", "other") }).status, "invalid");
  const tampered = { ...valid, operations: valid.operations.map((op) => ({ ...op, endpoints: op.endpoints.map((endpoint) => ({ ...endpoint, url: "https://attacker.test/" })) })) };
  assert.equal(verifyAeatEditionProfile(tampered), false);
  const candidate = profile({ lifecycle: "candidate", creationAllowed: false, activationEvidenceId: null });
  assert.equal(resolveAeatEndpoint(candidate, "voluntary-submission", "test", context, context).status, "invalid");
  const missingEndpoint = resolveAeatEndpoint(valid, "consultation", "test", context, context);
  assert.equal(missingEndpoint.status, "invalid");
  recordP5FaultDetection("P5-FAULT-028", missingEndpoint.status === "invalid" && missingEndpoint.diagnostics[0]?.code === "DIAG-AEAT-ENDPOINT-UNAVAILABLE");
  assert.equal(resolveAeatEndpoint(valid, "voluntary-submission", "test", context, { ...context, taxpayerId: id("taxpayer", "other") }).status, "invalid");
});

test("edition profile rejects malformed source, endpoint, binding and response contracts", () => {
  const active = profile();
  const { digest: _digest, ...base } = active;
  const clone = () => structuredClone(base);
  assert.equal(createAeatEditionProfile(null).status, "invalid");
  const duplicateOperation = clone();
  duplicateOperation.operations.push(structuredClone(duplicateOperation.operations[0]));
  assert.equal(createAeatEditionProfile(duplicateOperation).status, "invalid");
  const cases = [
    (value) => { value.editionId = ""; },
    (value) => { value.sourceManifestSha256 = "bad"; },
    (value) => { value.generatedOutputSha256 = "bad"; },
    (value) => { value.sourceClosureVerified = false; },
    (value) => { value.lifecycle = "candidate"; },
    (value) => { value.activationEvidenceId = null; },
    (value) => { value.operations = []; },
    (value) => { value.operations[0].purpose = "consultation"; },
    (value) => { value.operations[0].requestSchemaDigest = "bad"; },
    (value) => { value.operations[0].endpoints[0].url = "http://unsafe.example/"; },
    (value) => { value.operations[0].endpoints[0].url = "https://user:secret@test.example/"; },
    (value) => { value.operations[0].endpoints[1].environment = "test"; },
    (value) => { value.operations[0].binding.soapVersion = "1.3"; },
    (value) => { value.operations[0].binding.contentType = "text/html"; },
    (value) => { value.operations[0].binding.maxRequestBytes = 0; },
    (value) => { value.operations[0].binding.requiresMtls = "yes"; },
    (value) => { value.operations[0].binding.namespaceBindings[0].prefix = "xml"; },
    (value) => { value.operations[0].binding.headerFields[0].valueKind = "secret"; },
    (value) => { value.operations[0].response.allowedLineChildren = "not-an-array"; },
    (value) => { value.operations[0].response.responseQName = "unbound:Response"; },
    (value) => { value.operations[0].response.allowedResponseChildren.push("r:GlobalStatus"); },
    (value) => { value.operations[0].response.lineIdentityPaths = []; },
    (value) => { value.operations[0].response.acceptedGlobalValues.push("Correcto"); },
    (value) => { value.lifecycle = "unknown"; },
    (value) => { value.creationAllowed = "yes"; },
    (value) => { value.creationAllowed = false; },
    (value) => { value.activationEvidenceId = ""; },
    (value) => { value.operations[0].id = "unsupported"; },
    (value) => { value.operations[0].wsdlDigest = "bad"; },
    (value) => { value.operations[0].responseSchemaDigest = "bad"; },
    (value) => { value.operations[0].endpoints = [value.operations[0].endpoints[0]]; },
    (value) => { value.operations[0].endpoints[0].id = ""; },
    (value) => { value.operations[0].endpoints[0].serviceId = ""; },
    (value) => { value.operations[0].endpoints[0].portId = ""; },
    (value) => { value.operations[0].endpoints[0].environment = "sandbox"; },
    (value) => { value.operations[0].endpoints[0].url = "https://test.example.test:8443/soap"; },
    (value) => { value.operations[0].endpoints[0].url = "https://test.example.test/path?query=1"; },
    (value) => { value.operations[0].endpoints[0].url = "https://test.example.test/path#fragment"; },
    (value) => { value.operations[0].endpoints[0].url = "https://test.example.test/soap"; value.operations[0].endpoints[1].url = "https://other.example.test/soap"; value.operations[0].endpoints[1].environment = "test"; },
    (value) => { value.operations[0].binding.envelopeNamespace = "urn:unsupported"; },
    (value) => { value.operations[0].binding.serviceNamespace = "http://insecure.example.test"; },
    (value) => { value.operations[0].binding.soapAction = ""; },
    (value) => { value.operations[0].binding.method = "GET"; },
    (value) => { value.operations[0].binding.headerQName = "malformed"; },
    (value) => { value.operations[0].binding.requestQName = "malformed"; },
    (value) => { value.operations[0].binding.namespaceBindings = []; },
    (value) => { value.operations[0].binding.namespaceBindings[1].namespace = "urn:unsupported"; },
    (value) => { value.operations[0].binding.headerFields = []; },
    (value) => { value.operations[0].binding.headerFields[0].name = "bad name"; },
    (value) => { value.operations[0].binding.headerFields[0].valueKind = "secret"; },
    (value) => { value.operations[0].binding.namespaceBindings[0].prefix = "bad prefix"; },
    (value) => { value.operations[0].binding.maxResponseBytes = 1_048_577; },
    (value) => { value.operations[0].binding.maxBatchItems = 501; },
    (value) => { value.operations[0].response.lineIdentityPaths = []; },
    (value) => { value.operations[0].response.globalStatusQName = "r:Unknown"; },
    (value) => { value.operations[0].response.waitTimeQName = "r:Unknown"; },
    (value) => { value.operations[0].response.lineStatusQName = "r:Unknown"; },
    (value) => { value.operations[0].response.lineErrorCodeQName = "r:Unknown"; },
    (value) => { value.operations[0].response.lineIdentityPaths = ["unbound:RecordId"]; },
    (value) => { value.operations[0].response.partialGlobalValues = ["Correcto"]; },
    (value) => { value.operations[0].response.qualifiedLineValues = ["Correcto"]; },
  ];
  for (const [index, mutate] of cases.entries()) {
    const candidate = clone();
    mutate(candidate);
    assert.equal(createAeatEditionProfile(candidate).status, "invalid", `invalid profile case ${index + 1}`);
  }
});

test("SOAP request uses exact committed bytes in deterministic order and rejects unsafe fragments", () => {
  const active = profile();
  const bytes1 = Buffer.from('<f:Record xmlns:f="https://example.test/fiscal"><f:Value>A&amp;B</f:Value></f:Record>');
  const bytes2 = Buffer.from('<f:Record xmlns:f="https://example.test/fiscal"><f:Value>second</f:Value></f:Record>');
  const artifact = (n, bytes) => ({ artifactId: `artifact-${n}`, recordId: id("record", `record-${n}`), context, editionId: context.editionId, sequence: n, sha256: `sha256:${hash(bytes)}`, bytes });
  const header = { context, taxpayerId: "ES123", installationId: "install-1", productId: "noeos", softwareVersion: "1.0", installationNumber: "install-1" };
  const built = buildSoapRequest({ profile: active, operationId: "voluntary-submission", endpointId: "test-service", header, records: [artifact(1, bytes1), artifact(2, bytes2)] });
  assert.equal(built.status, "ok");
  assert.deepEqual(built.value.orderedRecordIds, ["record-1", "record-2"]);
  assert.equal(built.value.byteLength, built.value.bytes.length);
  assert.ok(new TextDecoder().decode(built.value.bytes).includes(bytes1.toString()));
  assert.equal(buildSoapRequest({ profile: active, operationId: "voluntary-submission", endpointId: "test-service", header, records: [artifact(2, bytes2), artifact(1, bytes1)] }).status, "invalid");
  assert.equal(buildSoapRequest({ profile: active, operationId: "voluntary-submission", endpointId: "test-service", header, records: [artifact(1, Buffer.from("<f:Record>&lol;</f:Record>"))] }).status, "invalid");
  assert.equal(buildSoapRequest({ profile: profile({ lifecycle: "candidate", creationAllowed: false, activationEvidenceId: null }), operationId: "voluntary-submission", endpointId: "test-service", header, records: [artifact(1, bytes1)] }).status, "invalid");
  assert.equal(isSafeXmlElementFragment('<r:x xmlns:r="urn:r">a&amp;b</r:x>'), true);
  assert.equal(isSafeXmlElementFragment('<!DOCTYPE x><x/>'), false);
  assert.equal(isSafeXmlElementFragment('<x>&#0;</x>'), false);
  assert.equal(buildSoapRequest(null).status, "invalid");
  assert.equal(buildSoapRequest({ profile: active, operationId: "voluntary-submission", endpointId: "unknown-endpoint", header, records: [artifact(1, bytes1)] }).status, "invalid");
  assert.equal(buildSoapRequest({ profile: active, operationId: "voluntary-submission", endpointId: "test-service",
    header: { ...header, taxpayerId: "other-taxpayer" }, records: [artifact(1, bytes1)] }).status, "invalid");
  const namespaceBound = buildSoapRequest({ profile: active, operationId: "voluntary-submission", endpointId: "test-service", header,
    records: [artifact(1, bytes1)], namespaces: { vf: "https://example.test/verifactu" } });
  assert.equal(namespaceBound.status, "ok");
  assert.equal(buildSoapRequest({ profile: active, operationId: "voluntary-submission", endpointId: "test-service", header,
    records: [artifact(1, bytes1)], namespaces: { vf: "https://attacker.test/namespace" } }).status, "invalid");
  const smallLimit = profile({ operations: active.operations.map((operation) => ({ ...operation,
    binding: { ...operation.binding, maxRequestBytes: 128 } })) });
  const bounded = buildSoapRequest({ profile: smallLimit, operationId: "voluntary-submission", endpointId: "test-service", header,
    records: [artifact(1, Buffer.from("<f:Record xmlns:f=\"https://example.test/fiscal\"/>"))] });
  assert.equal(bounded.status, "invalid");
});

test("response parser uses expanded QNames, bounds bytes and leaves unknown protocol fields unaccepted", () => {
  const active = profile();
  const xml = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:resp="https://example.test/response"><soap:Body><resp:SubmitResponse><resp:GlobalStatus>Correcto</resp:GlobalStatus><resp:Wait>10</resp:Wait><resp:Line><resp:RecordId>record-1</resp:RecordId><resp:State>Correcto</resp:State></resp:Line></resp:SubmitResponse></soap:Body></soap:Envelope>`;
  const parsed = parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 200, responseBytes: Buffer.from(xml) });
  assert.equal(parsed.status, "ok");
  assert.equal(parsed.value.status, "accepted");
  assert.equal(parsed.value.waitInstruction, "10");
  assert.equal(parsed.value.lines[0].identity[0], "record-1");
  const unknown = parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 200, responseBytes: Buffer.from(xml.replace("</resp:Line>", "<resp:Surprise>yes</resp:Surprise></resp:Line>")) });
  assert.equal(unknown.value.status, "unrecognized");
  const wrongNamespace = parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 200, responseBytes: Buffer.from(xml.replaceAll("https://example.test/response", "https://attacker.test/response")) });
  assert.equal(wrongNamespace.value.status, "malformed");
  const oversized = parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 200, responseBytes: Buffer.alloc(1_048_577, 32) });
  assert.equal(oversized.value.diagnostics[0], "DIAG-AEAT-RESPONSE-OVERSIZED");
  const exactLimit = parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 200, responseBytes: Buffer.alloc(1_048_576, 32) });
  assert.equal(exactLimit.value.diagnostics[0], "DIAG-AEAT-RESPONSE-XML");
  const hostile = parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 200, responseBytes: Buffer.from('<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><x>&e;</x>') });
  assert.equal(hostile.value.status, "malformed");
});

test("batch planner excludes unsafe states and splits deterministically at the request byte bound", () => {
  const active = profile();
  const header = { context, taxpayerId: "ES123", installationId: "install-1", productId: "noeos", softwareVersion: "1.0", installationNumber: "install-1" };
  const document = (number) => ({ issuer: id("taxpayer", "ES123"), series: "A", number: String(number), issueDate: "2026-10-03" });
  const candidate = (number, overrides = {}) => {
    const contentSize = overrides.oversized ? 70_000 : overrides.large ? 39_000 : 8;
    const bytes = Buffer.from(`<f:Record xmlns:f="https://example.test/fiscal"><f:Value>${"x".repeat(contentSize)}</f:Value></f:Record>`);
    return { artifact: { artifactId: `artifact-${number}`, recordId: id("record", `record-${number}`), context, editionId: context.editionId,
      sequence: number, sha256: `sha256:${hash(bytes)}`, bytes }, document: document(number), operationId: "voluntary-submission", environment: "test",
      committed: true, requiredClaimsComplete: true, submissionState: "pending", priorAttemptState: "none", eligibleAt: "2026-10-03T00:00:00Z", ...overrides };
  };
  const badCases = [
    [null, "DIAG-AEAT-BATCH-RECORD"],
    [candidate(2, { committed: false }), "DIAG-AEAT-BATCH-NOT-COMMITTED"],
    [candidate(3, { requiredClaimsComplete: false }), "DIAG-AEAT-BATCH-CLAIMS"],
    [candidate(4, { priorAttemptState: "ambiguous" }), "DIAG-RECONCILIATION-REQUIRED"],
    [candidate(5, { priorAttemptState: "terminal" }), "DIAG-AEAT-BATCH-TERMINAL"],
    [candidate(6, { eligibleAt: "2027-01-01T00:00:00Z" }), "DIAG-AEAT-BATCH-WAIT"],
    [candidate(7, { submissionState: "accepted" }), "DIAG-AEAT-BATCH-STATE"],
    [candidate(8, { environment: "production" }), "DIAG-AEAT-BATCH-OPERATION"],
  ];
  const excluded = planAeatBatches({ profile: active, operationId: "voluntary-submission", environment: "test", endpointId: "test-service",
    context, header, candidates: badCases.map(([value]) => value), now: "2026-10-03T12:00:00Z", nextBatchId: () => "batch-invalid" });
  assert.equal(excluded.status, "ok");
  for (const [, expected] of badCases) assert.ok(excluded.value.excluded.some((item) => item.reason === expected), expected);

  const pair = planAeatBatches({ profile: active, operationId: "voluntary-submission", environment: "test", endpointId: "test-service",
    context, header, candidates: [candidate(1, { large: true }), candidate(2, { large: true })], now: "2026-10-03T12:00:00Z",
    nextBatchId: (() => { let number = 0; return () => `split-${++number}`; })() });
  assert.equal(pair.status, "ok");
  assert.equal(pair.value.batches.length, 2);
  assert.deepEqual(pair.value.batches.map((batch) => batch.orderedRecords[0].sequence), [1, 2]);

  const oversizedSingle = planAeatBatches({ profile: active, operationId: "voluntary-submission", environment: "test", endpointId: "test-service",
    context, header, candidates: [candidate(10), candidate(11, { oversized: true })], now: "2026-10-03T12:00:00Z",
    nextBatchId: () => "bounded-single" });
  assert.equal(oversizedSingle.status, "ok");
  assert.equal(oversizedSingle.value.batches.length, 1);
  assert.ok(oversizedSingle.value.excluded.some((item) => item.recordId === "record-11" && item.reason === "DIAG-AEAT-RECORD-ARTIFACT"));

  const badId = planAeatBatches({ profile: active, operationId: "voluntary-submission", environment: "test", endpointId: "test-service",
    context, header, candidates: [candidate(9)], now: "2026-10-03T12:00:00Z", nextBatchId: () => "unsafe id" });
  assert.equal(badId.status, "invalid");
});

test("batch planner excludes inconsistent identity and edition candidates before constructing batches", () => {
  const active = profile();
  const header = { context, taxpayerId: "ES123", installationId: "install-1", productId: "noeos", softwareVersion: "1.0", installationNumber: "install-1" };
  const make = (number, overrides = {}) => {
    const bytes = Buffer.from(`<f:Record xmlns:f="https://example.test/fiscal"><f:Value>${number}</f:Value></f:Record>`);
    return { artifact: { artifactId: `artifact-${number}`, recordId: id("record", `record-${number}`), context,
      editionId: context.editionId, sequence: number, sha256: `sha256:${hash(bytes)}`, bytes },
      document: { issuer: id("taxpayer", "ES123"), series: "A", number: String(number), issueDate: "2026-10-03" },
      operationId: "voluntary-submission", environment: "test", committed: true, requiredClaimsComplete: true,
      submissionState: "pending", priorAttemptState: "none", eligibleAt: "2026-10-03T00:00:00Z", ...overrides };
  };
  const malformed = [
    [{ ...make(0), artifact: { ...make(0).artifact, recordId: id("tenant", "wrong-kind") } }, "DIAG-AEAT-BATCH-RECORD"],
    [{ ...make(1), artifact: { ...make(1).artifact, editionId: id("edition", "other") } }, "DIAG-AEAT-BATCH-CONTEXT"],
    [{ ...make(1), artifact: { ...make(1).artifact, editionId: id("tenant", "wrong-kind") } }, "DIAG-AEAT-BATCH-CONTEXT"],
    [{ ...make(2), artifact: { ...make(2).artifact, context: { ...context, taxpayerId: id("taxpayer", "other") } } }, "DIAG-AEAT-BATCH-CONTEXT"],
    [make(3, { operationId: "consultation" }), "DIAG-AEAT-BATCH-OPERATION"],
    [make(4, { document: { ...make(4).document, issuer: id("taxpayer", "other") } }), "DIAG-AEAT-BATCH-IDENTITY"],
    [make(5, { eligibleAt: "bad-date" }), "DIAG-AEAT-BATCH-WAIT"],
    [{ ...make(6), artifact: { ...make(6).artifact, sequence: 0 } }, "DIAG-AEAT-BATCH-SEQUENCE"],
    [make(7, { document: { issuer: id("taxpayer", "ES123"), series: "", number: "7", issueDate: "bad-date" } }), "DIAG-AEAT-BATCH-IDENTITY"],
    [make(8, { document: null }), "DIAG-AEAT-BATCH-IDENTITY"],
    [make(9, { document: { issuer: id("taxpayer", "ES123"), series: "s".repeat(61), number: "9", issueDate: "2026-10-03" } }), "DIAG-AEAT-BATCH-IDENTITY"],
    [make(10, { document: { issuer: id("taxpayer", "ES123"), series: "A", number: "", issueDate: "2026-10-03" } }), "DIAG-AEAT-BATCH-IDENTITY"],
    [{ ...make(11), artifact: { ...make(11).artifact, sequence: Number.MAX_SAFE_INTEGER + 1 } }, "DIAG-AEAT-BATCH-SEQUENCE"],
  ];
  const result = planAeatBatches({ profile: active, operationId: "voluntary-submission", environment: "test", endpointId: "test-service",
    context, header, candidates: malformed.map(([candidate]) => candidate), now: "2026-10-03T12:00:00Z", nextBatchId: () => "batch" });
  assert.equal(result.status, "ok");
  for (const [, expected] of malformed) assert.ok(result.value.excluded.some((entry) => entry.reason === expected), expected);

  const duplicateRecord = make(8);
  const duplicates = planAeatBatches({ profile: active, operationId: "voluntary-submission", environment: "test", endpointId: "test-service",
    context, header, candidates: [duplicateRecord, { ...duplicateRecord, document: { ...duplicateRecord.document, number: "different" } }],
    now: "2026-10-03T12:00:00Z", nextBatchId: () => "batch" });
  assert.equal(duplicates.status, "ok");
  assert.equal(duplicates.value.excluded[0].reason, "DIAG-AEAT-BATCH-DUPLICATE");

  const sequenceConflict = planAeatBatches({ profile: active, operationId: "voluntary-submission", environment: "test", endpointId: "test-service",
    context, header, candidates: [make(9), { ...make(10), artifact: { ...make(10).artifact, sequence: 9 } }],
    now: "2026-10-03T12:00:00Z", nextBatchId: () => "batch" });
  assert.equal(sequenceConflict.status, "ok");
  assert.equal(sequenceConflict.value.batches.length, 0);
  assert.equal(sequenceConflict.value.excluded.length, 2);
  assert.ok(sequenceConflict.value.excluded.every((entry) => entry.reason === "DIAG-AEAT-BATCH-SEQUENCE-DUPLICATE"));
});

test("XML tokenizer rejects malformed markup and entities while accepting a bounded XML declaration", () => {
  const active = profile();
  const envelope = (body) => `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:r="https://example.test/response"><s:Body>${body}</s:Body></s:Envelope>`;
  assert.equal(parseAeatResponse(null).status, "invalid");
  assert.equal(parseAeatResponse({ profile: active, operationId: "unsupported", httpStatus: 200, responseBytes: Buffer.from("x") }).status, "invalid");
  assert.equal(parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 99, responseBytes: Buffer.from("x") }).status, "invalid");
  assert.equal(parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 200, responseBytes: "not-bytes" }).status, "invalid");
  const malformed = [
    "",
    Buffer.from([0xff, 0xfe, 0xc0]),
    envelope('<r:SubmitResponse x="1" x="2"/>'),
    envelope('<r:SubmitResponse bad:attribute="x"/>'),
    envelope("<r:SubmitResponse attr=unquoted/>"),
    envelope("<r:SubmitResponse><r:Prefix:Invalid/></r:SubmitResponse>"),
    envelope("<r:SubmitResponse><r:Wait>1</r:Wait>"),
    envelope("<r:SubmitResponse><r:GlobalStatus>&unknown;</r:GlobalStatus></r:SubmitResponse>"),
    envelope("<r:SubmitResponse><r:GlobalStatus>&#0;</r:GlobalStatus></r:SubmitResponse>"),
    envelope("<r:SubmitResponse><r:GlobalStatus>\u0001</r:GlobalStatus></r:SubmitResponse>"),
    envelope("<r:SubmitResponse><r:GlobalStatus>ok</r:Wrong></r:SubmitResponse>"),
    envelope("<unbound:SubmitResponse/>"),
    `outside${envelope("<r:SubmitResponse/>")}`,
    `${envelope("<r:SubmitResponse/>")}<extra/>`,
    envelope("<r:SubmitResponse><r:GlobalStatus>one & two</r:GlobalStatus></r:SubmitResponse>"),
    envelope("<r:SubmitResponse xmlns:bad='urn:invalid'><bad:Child/></r:SubmitResponse>"),
    envelope("<r:SubmitResponse><r:Child><unbound:Nested/></r:Child></r:SubmitResponse>"),
    `\uFEFF${envelope("<r:SubmitResponse/>")}`,
    "<![CDATA[no]]>",
    "<?xml version=\"1.1\"?>" + envelope("<r:SubmitResponse/>"),
    "<?xml version=\"1.0\" encoding=\"UTF-16\"?>" + envelope("<r:SubmitResponse/>"),
    "<?xml version=\"1.0\" standalone=\"maybe\"?>" + envelope("<r:SubmitResponse/>"),
    "<?xml version=\"1.0\"" + envelope("<r:SubmitResponse/>"),
    envelope(`<r:SubmitResponse>${"<r:Node>".repeat(65)}${"</r:Node>".repeat(65)}</r:SubmitResponse>`),
    envelope(`<r:SubmitResponse>${"<r:N/>".repeat(100_001)}</r:SubmitResponse>`),
  ];
  for (const xml of malformed) {
    const parsed = parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 200,
      responseBytes: xml instanceof Uint8Array ? xml : Buffer.from(xml) });
    assert.equal(parsed.value.status, "malformed", xml.slice(0, 40));
  }
  const declared = parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 200,
    responseBytes: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>${envelope("<r:SubmitResponse><r:GlobalStatus>Correcto&#x20;</r:GlobalStatus><r:Wait>0</r:Wait></r:SubmitResponse>")}`) });
  assert.equal(declared.value.status, "accepted");
  const defaultNamespace = parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 200,
    responseBytes: Buffer.from(`<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/"><Body><SubmitResponse xmlns="https://example.test/response"><GlobalStatus>Correcto</GlobalStatus><Wait>0</Wait></SubmitResponse></Body></Envelope>`) });
  assert.equal(defaultNamespace.value.status, "accepted");
  for (const declaration of [
    "<?xml version='1.0'?>",
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
    "<?xml version='1.0' standalone='no'?>",
  ]) {
    const parsed = parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus: 200,
      responseBytes: Buffer.from(`${declaration}${envelope("<r:SubmitResponse><r:GlobalStatus>Correcto</r:GlobalStatus><r:Wait>0</r:Wait></r:SubmitResponse>")}`) });
    assert.equal(parsed.value.status, "accepted", declaration);
  }
  for (const fragment of [
    null, "", " ", "text-before-root<x/>", "<x/><y/>", "<x>", "</x>", "<x><y></x>",
    "<x attr=unquoted/>", "<x attr=\"one\" attr=\"two\"/>", "<x attr=\"&unknown;\"/>",
    "<x attr=\"raw & text\"/>", "<x attr=\"&#xD800;\"/>", "<x>&#x110000;</x>", "<x>&#x1;</x>",
    "<x>dangling & text</x>", "<x/>", "<x></x>", "<x attr='apostrophe &apos; ok'/>",
    " <x/> ", "<x>&amp;&lt;&gt;&quot;&apos;</x>",
    "<x>&#9;&#10;&#13;&#32;&#xD7FF;&#xE000;&#xFFFD;&#x10000;&#x10FFFF;</x>",
    "<x><!-- no comments --></x>", "<x><![CDATA[no]]></x>", "<x><?no?></x>", "<x>]]></x>",
    "<" + "x".repeat(1_048_577),
  ]) {
    const expected = ["<x/>", "<x></x>", "<x attr='apostrophe &apos; ok'/>", "<x> &#x20; </x>",
      " <x/> ", "<x>&amp;&lt;&gt;&quot;&apos;</x>",
      "<x>&#9;&#10;&#13;&#32;&#xD7FF;&#xE000;&#xFFFD;&#x10000;&#x10FFFF;</x>"].includes(fragment);
    assert.equal(isSafeXmlElementFragment(fragment), expected, String(fragment).slice(0, 80));
  }
});

test("response parser classifies protocol faults and every sourced status field safely", () => {
  const active = profile();
  const wrap = (payload) => `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:r="https://example.test/response"><s:Body>${payload}</s:Body></s:Envelope>`;
  const parse = (xml, httpStatus = 200) => parseAeatResponse({ profile: active, operationId: "voluntary-submission", httpStatus,
    responseBytes: Buffer.from(xml) }).value;

  for (const input of [
    { profile: null, operationId: "voluntary-submission", httpStatus: 200, responseBytes: Buffer.from("x") },
    { profile: { ...active, digest: "tampered" }, operationId: "voluntary-submission", httpStatus: 200, responseBytes: Buffer.from("x") },
    { profile: active, operationId: "unknown", httpStatus: 200, responseBytes: Buffer.from("x") },
    { profile: active, operationId: "voluntary-submission", httpStatus: 200.5, responseBytes: Buffer.from("x") },
    { profile: active, operationId: "voluntary-submission", httpStatus: 99, responseBytes: Buffer.from("x") },
    { profile: active, operationId: "voluntary-submission", httpStatus: 600, responseBytes: Buffer.from("x") },
    { profile: active, operationId: "voluntary-submission", httpStatus: 200, responseBytes: "not-bytes" },
  ]) assert.equal(parseAeatResponse(input).status, "invalid");

  const envelopeCases = [
    ["<x/>", "DIAG-AEAT-SOAP-ENVELOPE"],
    ["<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\"/>", "DIAG-AEAT-SOAP-ENVELOPE"],
    ["<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\"><s:Body/></s:Envelope>", "DIAG-AEAT-SOAP-ENVELOPE"],
    ["<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\"><s:Body><r:SubmitResponse xmlns:r=\"https://example.test/response\"/><r:SubmitResponse xmlns:r=\"https://example.test/response\"/></s:Body></s:Envelope>", "DIAG-AEAT-SOAP-ENVELOPE"],
    [wrap("<r:OtherResponse/>"), "DIAG-AEAT-RESPONSE-QNAME"],
  ];
  for (const [xml, diagnostic] of envelopeCases)
    assert.equal(parse(xml).diagnostics[0], diagnostic, xml.slice(0, 80));

  assert.equal(parse(wrap("<s:Fault/>".replace("s:", "s:"))).status, "soap-fault");
  assert.equal(parse(wrap("<r:SubmitResponse><r:GlobalStatus>unknown</r:GlobalStatus><r:Wait>1</r:Wait></r:SubmitResponse>")).status, "unrecognized");
  assert.equal(parse(wrap("<r:SubmitResponse><r:GlobalStatus>Correcto</r:GlobalStatus></r:SubmitResponse>")).diagnostics[0], "DIAG-AEAT-WAIT-MISSING");
  assert.equal(parse(wrap("<r:SubmitResponse><r:Wait>1</r:Wait></r:SubmitResponse>")).status, "unrecognized");
  assert.equal(parse(wrap("<r:SubmitResponse><r:GlobalStatus>Correcto</r:GlobalStatus><r:Wait>1</r:Wait><r:Wait>2</r:Wait></r:SubmitResponse>")).diagnostics[0], "DIAG-AEAT-WAIT-MISSING");
  assert.equal(parse(wrap("<r:SubmitResponse><r:GlobalStatus>Correcto</r:GlobalStatus><r:Wait>x</r:Wait></r:SubmitResponse>")).diagnostics[0], "DIAG-AEAT-WAIT-INVALID");
  assert.equal(parse(wrap("<r:SubmitResponse><r:GlobalStatus>Correcto</r:GlobalStatus><r:GlobalStatus>Incorrecto</r:GlobalStatus><r:Wait>1</r:Wait></r:SubmitResponse>")).diagnostics[0], "DIAG-AEAT-RESPONSE-DUPLICATE-FIELD");
  assert.equal(parse(wrap("<r:SubmitResponse><r:GlobalStatus>Correcto</r:GlobalStatus><r:Wait>1</r:Wait></r:SubmitResponse>"), 503).status, "http-error");

  const line = (identityText, status = "Correcto", tail = "") => `<r:Line>${identityText}<r:State>${status}</r:State>${tail}</r:Line>`;
  const identityFields = "<r:RecordId>record-1</r:RecordId>";
  const parseLine = (value) => parse(wrap(`<r:SubmitResponse><r:GlobalStatus>Correcto</r:GlobalStatus><r:Wait>1</r:Wait>${value}</r:SubmitResponse>`));
  assert.equal(parseLine(line(identityFields, "mystery")).status, "unrecognized");
  assert.equal(parseLine(line("", "Correcto")).diagnostics[0], "DIAG-AEAT-CORRELATION-IDENTITY");
  const ambiguousProfile = profile({ operations: profile().operations.map((operation) => ({ ...operation,
    response: { ...operation.response, lineIdentityPaths: ["r:RecordId", "r:RecordId"] } })) });
  const ambiguousXml = wrap(`<r:SubmitResponse><r:GlobalStatus>Correcto</r:GlobalStatus><r:Wait>1</r:Wait>${line(identityFields)}</r:SubmitResponse>`);
  assert.equal(parseAeatResponse({ profile: ambiguousProfile, operationId: "voluntary-submission", httpStatus: 200,
    responseBytes: Buffer.from(ambiguousXml) }).value.diagnostics[0], "DIAG-AEAT-CORRELATION-AMBIGUOUS");
  assert.equal(parseLine(line(identityFields, "Correcto", "<r:State>Incorrecto</r:State>")).diagnostics[0], "DIAG-AEAT-RESPONSE-DUPLICATE-FIELD");
  assert.equal(parseLine(line(identityFields, "Correcto", "<r:ErrorCode>bad</r:ErrorCode>")).diagnostics[0], "DIAG-AEAT-ERROR-CODE");
  assert.equal(parseLine(line(identityFields, "AceptadoConErrores")).lines[0].classification, "accepted-with-errors");
  assert.equal(parseLine(line(identityFields, "Incorrecto")).lines[0].classification, "rejected");
  assert.equal(parseLine(line(identityFields, "Correcto", "<r:Unexpected>ignored</r:Unexpected>")).status, "unrecognized");
  const manyLines = Array.from({ length: 501 }, () => line(identityFields)).join("");
  assert.equal(parseLine(manyLines).diagnostics[0], "DIAG-AEAT-LINE-LIMIT");
});

test("batch planner covers identity, sequence, construction and duplicate-plan boundaries", () => {
  const active = profile();
  const header = { context, taxpayerId: "ES123", installationId: "install-1", productId: "noeos", softwareVersion: "1.0", installationNumber: "install-1" };
  const planningInput = { profile: active, operationId: "voluntary-submission", environment: "test", endpointId: "test-service",
    context, header, candidates: [], now: "2026-10-03T12:00:00Z", nextBatchId: () => "batch" };
  for (const invalid of [
    null,
    { ...planningInput, profile: null },
    { ...planningInput, operationId: "unknown" },
    { ...planningInput, candidates: null },
    { ...planningInput, candidates: Array(10_001).fill(null) },
    { ...planningInput, context: null },
    { ...planningInput, now: "invalid" },
    { ...planningInput, header: { ...header, context: { ...context, tenantId: id("tenant", "other") } } },
    { ...planningInput, nextBatchId: null },
  ]) assert.equal(planAeatBatches(invalid).status, "invalid");
  const makeCandidate = (number, overrides = {}) => {
    const bytes = Buffer.from(`<f:Record xmlns:f="https://example.test/fiscal"><f:Value>${"x".repeat(overrides.large ? 39_000 : 1)}</f:Value></f:Record>`);
    return { artifact: { artifactId: `artifact-${number}`, recordId: id("record", `record-${number}`), context, editionId: context.editionId,
      sequence: number, sha256: `sha256:${hash(bytes)}`, bytes }, document: { issuer: id("taxpayer", "ES123"), series: "A", number: String(number), issueDate: "2026-10-03" },
      operationId: "voluntary-submission", environment: "test", committed: true, requiredClaimsComplete: true,
      submissionState: "pending", priorAttemptState: "none", eligibleAt: "2026-10-03T00:00:00Z", ...overrides };
  };
  const cases = [
    [makeCandidate(1, { artifact: { ...makeCandidate(1).artifact, context: { ...context, tenantId: id("tenant", "other") } } }), "DIAG-AEAT-BATCH-CONTEXT"],
    [makeCandidate(2, { document: { ...makeCandidate(2).document, issuer: id("taxpayer", "ES999") } }), "DIAG-AEAT-BATCH-IDENTITY"],
    [makeCandidate(3, { document: { ...makeCandidate(3).document, issueDate: "not-a-date" } }), "DIAG-AEAT-BATCH-IDENTITY"],
    [makeCandidate(4, { artifact: { ...makeCandidate(4).artifact, sequence: 0 } }), "DIAG-AEAT-BATCH-SEQUENCE"],
    [makeCandidate(5, { eligibleAt: "invalid" }), "DIAG-AEAT-BATCH-WAIT"],
  ];
  const result = planAeatBatches({ profile: active, operationId: "voluntary-submission", environment: "test", endpointId: "test-service",
    context, header, candidates: cases.map(([candidate]) => candidate), now: "2026-10-03T12:00:00Z", nextBatchId: () => "batch-1" });
  assert.equal(result.status, "ok");
  for (const [, expected] of cases) assert.ok(result.value.excluded.some((entry) => entry.reason === expected), expected);

  const duplicate = makeCandidate(1);
  const duplicateResult = planAeatBatches({ profile: active, operationId: "voluntary-submission", environment: "test", endpointId: "test-service",
    context, header, candidates: [duplicate, duplicate], now: "2026-10-03T12:00:00Z", nextBatchId: () => "duplicate" });
  assert.ok(duplicateResult.value.excluded.some((entry) => entry.reason === "DIAG-AEAT-BATCH-DUPLICATE"));
  const sequenceDuplicate = planAeatBatches({ profile: active, operationId: "voluntary-submission", environment: "test", endpointId: "test-service",
    context, header, candidates: [makeCandidate(1), makeCandidate(2, { artifact: { ...makeCandidate(2).artifact, sequence: 1 } })],
    now: "2026-10-03T12:00:00Z", nextBatchId: () => "sequence" });
  assert.ok(sequenceDuplicate.value.excluded.every((entry) => entry.reason === "DIAG-AEAT-BATCH-SEQUENCE-DUPLICATE"));

  const buildFailure = planAeatBatches({ profile: active, operationId: "voluntary-submission", environment: "test", endpointId: "missing-endpoint",
    context, header, candidates: [makeCandidate(1)], now: "2026-10-03T12:00:00Z", nextBatchId: () => "build" });
  assert.equal(buildFailure.status, "ok");
  assert.equal(buildFailure.value.excluded[0].reason, "DIAG-AEAT-ENDPOINT-UNAVAILABLE");
  const repeatedId = planAeatBatches({ profile: active, operationId: "voluntary-submission", environment: "test", endpointId: "test-service",
    context, header, candidates: [makeCandidate(1, { large: true }), makeCandidate(2, { large: true })], now: "2026-10-03T12:00:00Z", nextBatchId: () => "same" });
  assert.equal(repeatedId.status, "invalid");
  const idProviderFailure = planAeatBatches({ ...planningInput, candidates: [makeCandidate(1)], nextBatchId() { throw new Error("private id provider error"); } });
  assert.equal(idProviderFailure.status, "invalid");
});
