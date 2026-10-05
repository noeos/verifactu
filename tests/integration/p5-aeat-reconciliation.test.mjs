import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { bindReconciliationContext, decideAeatReconciliation } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/reconciliation.js";
import { collectAeatConsultation } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/consultation.js";
import { correlateAeatResponse } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/correlation.js";
import { parseAeatResponse } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/response-parser.js";
import { batchPlan, context, hash, profile } from "../support/p5-aeat-fixture.mjs";
import { recordP5FaultDetection } from "../support/p5-fault-evidence.mjs";

const validResponse = { status: "accepted", responseArtifact: Buffer.from("response"), responseDigest: `sha256:${hash("response")}` };
const correlation = { status: "complete", outcomes: [{ recordId: "record-1", sequence: 1, state: "accepted", responseLineDigest: `sha256:${hash("response")}` }],
  extraResponseLines: 0, duplicateResponseLines: 0, missingResponseLines: 0, responseDigest: validResponse.responseDigest,
  requestDigest: `sha256:${hash("request")}`, diagnostics: [] };
const completeConsultation = { status: "complete", queryDigest: `sha256:${hash("query")}`, snapshotId: "snapshot-1", pageCount: 1,
  records: [{ identity: ["ES123", "A", "1"], payloadDigest: `sha256:${hash("record")}` }],
  pageDigests: [`sha256:${hash("page")}`], diagnostic: null };

test("consultation retains every bounded page under one stable snapshot", async () => {
  const active = profile();
  const query = { period: "2026-10", taxpayer: "ES123" };
  const queryDigest = `sha256:${hash(JSON.stringify(query))}`;
  let retained = 0;
  const result = await collectAeatConsultation({ profile: active, operationId: "consultation", context, query,
    maximumPages: 3, maximumRecords: 20, maximumPageBytes: 4096,
    pagePort: { async fetch({ cursor, snapshotId }) { const pageNumber = cursor === null ? 1 : 2;
      return { context, editionDigest: active.digest, queryDigest, snapshotId: "snapshot-1", cursor, nextCursor: pageNumber === 1 ? "cursor-1" : null,
        complete: pageNumber === 2, responseBytes: Buffer.from(`page-${pageNumber}`),
        records: [{ identity: ["ES123", "A", String(pageNumber)], payloadDigest: `sha256:${hash(`payload-${pageNumber}`)}` }] };
    } },
    retention: { async retain({ pageNumber, pageDigest }) { retained += 1; return pageNumber === retained && /^sha256:/u.test(pageDigest); } },
  });
  assert.equal(result.status, "complete");
  assert.equal(result.pageCount, 2);
  assert.equal(retained, 2);
  assert.equal(result.records.length, 2);
});

test("consultation fails closed on snapshot drift or repeated continuation cursor", async () => {
  const active = profile();
  const query = { taxpayer: "ES123" };
  const queryDigest = `sha256:${hash(JSON.stringify(query))}`;
  let index = 0;
  const drift = await collectAeatConsultation({ profile: active, operationId: "consultation", context, query,
    maximumPages: 3, maximumRecords: 20, maximumPageBytes: 4096,
    pagePort: { async fetch({ cursor }) { index += 1; return { context, editionDigest: active.digest, queryDigest,
      snapshotId: index === 1 ? "snapshot-1" : "snapshot-2", cursor, nextCursor: index === 1 ? "c1" : null,
      complete: index > 1, responseBytes: Buffer.from("page"), records: [] }; } },
    retention: { async retain() { return true; } },
  });
  assert.equal(drift.status, "indeterminate");
  assert.equal(drift.diagnostic, "DIAG-AEAT-CONSULTATION-PAGE");

  const repeated = await collectAeatConsultation({ profile: active, operationId: "consultation", context, query,
    maximumPages: 3, maximumRecords: 20, maximumPageBytes: 4096,
    pagePort: { async fetch({ cursor }) { return { context, editionDigest: active.digest, queryDigest, snapshotId: "snapshot-1", cursor,
      nextCursor: "same", complete: false, responseBytes: Buffer.from("page"), records: [] }; } },
    retention: { async retain() { return true; } },
  });
  assert.equal(repeated.status, "indeterminate");
  assert.equal(repeated.diagnostic, "DIAG-AEAT-CONSULTATION-PAGE");
  recordP5FaultDetection("P5-FAULT-048", repeated.status === "indeterminate" && repeated.diagnostic === "DIAG-AEAT-CONSULTATION-PAGE");
  recordP5FaultDetection("P5-FAULT-049", drift.status === "indeterminate" && drift.diagnostic === "DIAG-AEAT-CONSULTATION-PAGE");
});

test("absence permits replay only after the bound proof verifier confirms complete evidence", async () => {
  const common = { profile: profile(), operationId: "voluntary-submission", context, originalRecordIds: ["record-1"],
    response: validResponse, correlation: { ...correlation, status: "indeterminate", outcomes: [{ ...correlation.outcomes[0], state: "indeterminate" }], missingResponseLines: 1 },
    consultation: completeConsultation, evidenceDigest: `sha256:${hash("evidence")}` };
  const denied = await decideAeatReconciliation(common);
  assert.equal(denied.replayAuthorized, false);
  const allowed = await decideAeatReconciliation({ ...common, absenceProofVerifier: { async verify(input) {
    assert.deepEqual(input.originalRecordIds, ["record-1"]);
        return { status: "verified", proofDigest: `sha256:${hash("absence")}`, authorizationEvidenceId: "approved-replay-1" };
  } } });
  assert.equal(allowed.disposition, "confirmed-absent-replay-authorized");
  assert.equal(allowed.replayAuthorized, true);
  assert.equal(allowed.absenceProofDigest, `sha256:${hash("absence")}`);
  assert.equal(allowed.replayAuthorizationEvidenceId, "approved-replay-1");
  let verifierCalls = 0;
  const malformedSnapshot = await decideAeatReconciliation({ ...common,
    consultation: { ...completeConsultation, pageDigests: "forged" },
    absenceProofVerifier: { async verify() { verifierCalls += 1; return { status: "verified", proofDigest: `sha256:${hash("absence")}`, authorizationEvidenceId: "approved-replay-1" }; } },
  });
  assert.equal(malformedSnapshot.diagnostics[0], "DIAG-AEAT-RECONCILIATION-INCOMPLETE");
  assert.equal(verifierCalls, 0);
  const malformedRecord = await decideAeatReconciliation({ ...common,
    consultation: { ...completeConsultation, records: [{ identity: [" "], payloadDigest: "malformed" }] },
  });
  assert.equal(malformedRecord.diagnostics[0], "DIAG-AEAT-RECONCILIATION-INCOMPLETE");
  assert.equal(bindReconciliationContext({ expected: context, observed: context }), true);
  assert.equal(bindReconciliationContext({ expected: context, observed: { ...context, taxpayerId: "wrong" } }), false);
});

test("partial remote evidence conflicts and never authorizes a resend", async () => {
  const result = await decideAeatReconciliation({ profile: profile(), operationId: "voluntary-submission", context,
    originalRecordIds: ["record-1", "record-2"], response: validResponse, correlation: { ...correlation,
      outcomes: [{ ...correlation.outcomes[0], state: "accepted" }, { recordId: "record-2", sequence: 2, state: "indeterminate", responseLineDigest: null }],
      status: "indeterminate", missingResponseLines: 1 }, consultation: completeConsultation,
    absenceProofVerifier: { async verify() { throw new Error("partial evidence must never reach authority verification"); } },
    evidenceDigest: `sha256:${hash("evidence")}` });
  assert.equal(result.disposition, "conflicting-evidence");
  assert.equal(result.replayAuthorized, false);
});

test("line correlation requires the exact issuer, series, number and issue-date identity set", () => {
  const active = profile();
  const batch = batchPlan(active);
  const xml = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:r="https://example.test/response"><s:Body><r:SubmitResponse><r:GlobalStatus>Correcto</r:GlobalStatus><r:Wait>1</r:Wait><r:Line><r:Issuer>ES123</r:Issuer><r:Series>A</r:Series><r:Number>1</r:Number><r:IssueDate>2026-10-03</r:IssueDate><r:State>Correcto</r:State></r:Line></r:SubmitResponse></s:Body></s:Envelope>';
  const parsed = parseAeatResponse({ profile: active, operationId: batch.operationId, httpStatus: 200, responseBytes: Buffer.from(xml) });
  assert.equal(parsed.status, "ok");
  const matched = correlateAeatResponse(batch, parsed.value);
  assert.equal(matched.status, "complete");
  assert.equal(matched.outcomes[0].state, "accepted");
  const hostile = correlateAeatResponse(batch, { ...parsed.value, lines: [...parsed.value.lines, parsed.value.lines[0]] });
  assert.equal(hostile.status, "indeterminate");
  assert.equal(hostile.duplicateResponseLines, 1);
});

test("correlation classifies global rejection, qualified lines, foreign, missing, duplicate and invalid evidence", () => {
  const batch = batchPlan();
  const digest = `sha256:${hash("correlation-response")}`;
  const artifact = Buffer.from("correlation-response");
  const response = (status, lines = []) => ({ status, globalStatus: null, lines, waitInstruction: null,
    responseArtifact: artifact, responseDigest: digest, diagnostics: [] });
  const line = (overrides = {}) => ({ identity: ["ES123", "A", "1", "2026-10-03"], wireStatus: "Correcto",
    classification: "accepted", errorCode: null, ...overrides });

  assert.equal(correlateAeatResponse(null, response("accepted")).diagnostics[0], "DIAG-AEAT-CORRELATION-INPUT");
  for (const [candidateBatch, candidateResponse] of [
    [{ ...batch, orderedRecords: [] }, response("accepted")],
    [{ ...batch, orderedRecords: [null] }, response("accepted")],
    [{ ...batch, orderedRecords: Array(2) }, response("accepted")],
    [{ ...batch, request: { ...batch.request, bytes: "not-bytes" } }, response("accepted")],
    [{ ...batch, request: { ...batch.request, sha256: `sha256:${"0".repeat(64)}` } }, response("accepted")],
    [batch, null],
    [batch, { ...response("accepted"), responseArtifact: "not-bytes" }],
    [batch, { ...response("accepted"), lines: null }],
  ]) assert.equal(correlateAeatResponse(candidateBatch, candidateResponse).diagnostics[0], "DIAG-AEAT-CORRELATION-INPUT");
  const globalReject = correlateAeatResponse(batch, response("rejected"));
  assert.equal(globalReject.status, "complete");
  assert.equal(globalReject.outcomes[0].state, "rejected");

  const qualified = correlateAeatResponse(batch, response("accepted-with-errors", [line({ classification: "accepted-with-errors" })]));
  assert.equal(qualified.status, "complete");
  assert.equal(qualified.outcomes[0].state, "accepted-with-errors");
  assert.equal(correlateAeatResponse(batch, response("rejected", [line({ classification: "rejected" })])).outcomes[0].state, "rejected");
  assert.equal(correlateAeatResponse(batch, response("accepted", [line({ classification: "unrecognized" })])).status, "indeterminate");

  const foreign = correlateAeatResponse(batch, response("accepted", [line({ identity: ["ES999", "A", "1", "2026-10-03"] })]));
  assert.equal(foreign.extraResponseLines, 1);
  assert.equal(foreign.outcomes[0].state, "indeterminate");
  const missing = correlateAeatResponse(batch, response("accepted"));
  assert.equal(missing.missingResponseLines, 1);
  const duplicate = correlateAeatResponse(batch, response("accepted", [line(), line()]));
  assert.equal(duplicate.duplicateResponseLines, 1);
  assert.equal(duplicate.outcomes[0].state, "indeterminate");
  recordP5FaultDetection("P5-FAULT-039", duplicate.duplicateResponseLines === 1 && duplicate.outcomes[0].state === "indeterminate");
  recordP5FaultDetection("P5-FAULT-044", missing.missingResponseLines === 1 && missing.outcomes[0].state === "indeterminate");
  recordP5FaultDetection("P5-FAULT-045", correlateAeatResponse(batch, response("accepted", [line({ classification: "unrecognized" })])).status === "indeterminate");
  recordP5FaultDetection("P5-FAULT-046", foreign.extraResponseLines === 1 && foreign.outcomes[0].state === "indeterminate");
  const nullResponseLine = correlateAeatResponse(batch, response("accepted", [null]));
  assert.equal(nullResponseLine.extraResponseLines, 1);
  assert.equal(nullResponseLine.status, "indeterminate");
  const sparseResponseLines = Array(1);
  const sparseLines = correlateAeatResponse(batch, response("accepted", sparseResponseLines));
  assert.equal(sparseLines.extraResponseLines, 1);
  assert.equal(sparseLines.status, "indeterminate");

  for (const identity of [null, [], ["ES123"], ["ES123", "A", "1", "2026-10-03", "extra"],
    ["ES123", "A", "1", null], ["ES123", "A", "1", ""]]) {
    const invalidLine = correlateAeatResponse(batch, response("accepted", [line({ identity })]));
    assert.equal(invalidLine.extraResponseLines, 1);
    assert.equal(invalidLine.status, "indeterminate");
  }
  const duplicateExpected = correlateAeatResponse({ ...batch, orderedRecords: [batch.orderedRecords[0],
    { ...batch.orderedRecords[0], recordId: "record-duplicate", sequence: 2 }] }, response("accepted", [line()]));
  assert.ok(duplicateExpected.diagnostics.includes("DIAG-AEAT-CORRELATION-EXPECTED-DUPLICATE"));
  assert.equal(duplicateExpected.status, "indeterminate");

  const badDigest = correlateAeatResponse(batch, { ...response("accepted", [line()]), responseDigest: `sha256:${"0".repeat(64)}` });
  assert.equal(badDigest.status, "indeterminate");
  for (const status of ["malformed", "unrecognized", "soap-fault", "http-error"]) {
    const value = correlateAeatResponse(batch, response(status, [line()]));
    assert.equal(value.status, "indeterminate", status);
    assert.ok(value.diagnostics.includes("DIAG-AEAT-RESPONSE-UNCLASSIFIED"), status);
  }
});

test("reconciliation distinguishes complete outcomes from incomplete, denied and conflicting absence evidence", async () => {
  const base = { profile: profile(), operationId: "voluntary-submission", context, originalRecordIds: ["record-1"],
    response: validResponse, correlation, consultation: completeConsultation, evidenceDigest: `sha256:${hash("evidence")}` };
  const accepted = await decideAeatReconciliation(base);
  assert.equal(accepted.disposition, "confirmed-applied");
  const rejected = await decideAeatReconciliation({ ...base, correlation: { ...correlation,
    outcomes: [{ ...correlation.outcomes[0], state: "rejected" }] } });
  assert.equal(rejected.disposition, "confirmed-rejected");
  const unknown = await decideAeatReconciliation({ ...base, correlation: { ...correlation, status: "complete",
    outcomes: [{ ...correlation.outcomes[0], state: "indeterminate" }] } });
  assert.equal(unknown.disposition, "still-unknown");
  assert.equal(unknown.diagnostics[0], "DIAG-AEAT-RECONCILIATION-STATUS");

  const absent = { ...base, correlation: { ...correlation, status: "indeterminate", outcomes: [], missingResponseLines: 1 } };
  const verifierDenied = await decideAeatReconciliation({ ...absent, absenceProofVerifier: { async verify() { return { status: "denied" }; } } });
  assert.equal(verifierDenied.disposition, "still-unknown");
  const verifierThrows = await decideAeatReconciliation({ ...absent, absenceProofVerifier: { async verify() { throw new Error("private"); } } });
  assert.equal(verifierThrows.disposition, "still-unknown");
  const invalidProof = await decideAeatReconciliation({ ...absent, absenceProofVerifier: { async verify() {
    return { status: "verified", proofDigest: "bad", authorizationEvidenceId: "evidence-1" };
  } } });
  assert.equal(invalidProof.replayAuthorized, false);
  const notStable = await decideAeatReconciliation({ ...absent, consultation: { ...completeConsultation, status: "indeterminate", diagnostic: "DIAG-AEAT-CONSULTATION-PAGE" } });
  assert.equal(notStable.diagnostics[0], "DIAG-AEAT-RECONCILIATION-INCOMPLETE");
  const malformed = await decideAeatReconciliation({ ...base, response: { ...validResponse, status: "malformed" } });
  assert.equal(malformed.disposition, "still-unknown");
  assert.equal(malformed.diagnostics[0], "DIAG-AEAT-RECONCILIATION-INCOMPLETE");
  for (const status of ["unrecognized", "soap-fault", "http-error"]) {
    const unclassified = await decideAeatReconciliation({ ...base, response: { ...validResponse, status } });
    assert.equal(unclassified.diagnostics[0], "DIAG-AEAT-RECONCILIATION-INCOMPLETE", status);
    assert.equal(unclassified.replayAuthorized, false, status);
  }
  const invalidAuthorizationEvidence = await decideAeatReconciliation({ ...absent, absenceProofVerifier: { async verify() {
    return { status: "verified", proofDigest: `sha256:${hash("absence")}`, authorizationEvidenceId: "bad\nevidence" };
  } } });
  assert.equal(invalidAuthorizationEvidence.replayAuthorized, false);

  const workDirectory = await mkdtemp(join(tmpdir(), "p5-reconciliation-crash-"));
  const statePath = join(workDirectory, "attempt-state.json");
  let decisionPersisted = false;
  let replayTriggered = false;
  try {
    const source = `import { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(statePath)}, JSON.stringify({ attemptId: "attempt-1", state: "indeterminate", decision: null })); process.exit(86);`;
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", source], { encoding: "utf8", timeout: 5_000, windowsHide: true });
    assert.equal(child.error, undefined);
    assert.equal(child.status, 86);
    const durableAttempt = JSON.parse(await readFile(statePath, "utf8"));
    assert.deepEqual(durableAttempt, { attemptId: "attempt-1", state: "indeterminate", decision: null });
    decisionPersisted = durableAttempt.decision !== null;
    const resumed = await decideAeatReconciliation(absent);
    replayTriggered = resumed.replayAuthorized;
    assert.equal(resumed.disposition, "still-unknown");
    assert.equal(resumed.replayAuthorized, false);
    recordP5FaultDetection("P5-FAULT-050", !decisionPersisted && !replayTriggered);
  } finally {
    await rm(workDirectory, { recursive: true, force: true });
  }
});

test("reconciliation validates every identity and completeness boundary before classifying evidence", async () => {
  const base = { profile: profile(), operationId: "voluntary-submission", context, originalRecordIds: ["record-1"],
    response: validResponse, correlation, consultation: completeConsultation, evidenceDigest: `sha256:${hash("evidence")}` };
  const invalidInputs = [
    null,
    { ...base, operationId: "unknown-operation" },
    { ...base, profile: { ...base.profile, digest: "tampered" } },
    { ...base, context: null },
    { ...base, originalRecordIds: null },
    { ...base, originalRecordIds: [] },
    { ...base, originalRecordIds: Array(501).fill("record-1") },
    { ...base, originalRecordIds: ["bad\nid"] },
    { ...base, originalRecordIds: ["same", "same"] },
    { ...base, response: null },
    { ...base, correlation: null },
    { ...base, consultation: null },
    { ...base, evidenceDigest: "malformed" },
  ];
  for (const input of invalidInputs) {
    const result = await decideAeatReconciliation(input);
    assert.equal(result.diagnostics[0], "DIAG-AEAT-RECONCILIATION-INPUT", JSON.stringify(input)?.slice(0, 160));
    assert.equal(result.replayAuthorized, false);
  }

  const incompleteSnapshots = [
    { ...completeConsultation, snapshotId: "" },
    { ...completeConsultation, pageCount: 0 },
    { ...completeConsultation, pageCount: 501 },
    { ...completeConsultation, pageDigests: [] },
    { ...completeConsultation, pageDigests: ["invalid"] },
    { ...completeConsultation, queryDigest: "invalid" },
    { ...completeConsultation, diagnostic: "DIAG-AEAT-CONSULTATION-PAGE" },
    { ...completeConsultation, records: [{ identity: [], payloadDigest: `sha256:${hash("record")}` }] },
    { ...completeConsultation, records: [{ identity: Array(9).fill("part"), payloadDigest: `sha256:${hash("record")}` }] },
    { ...completeConsultation, records: [{ identity: ["x".repeat(257)], payloadDigest: `sha256:${hash("record")}` }] },
  ];
  for (const consultation of incompleteSnapshots) {
    const result = await decideAeatReconciliation({ ...base, consultation });
    assert.equal(result.diagnostics[0], "DIAG-AEAT-RECONCILIATION-INCOMPLETE");
    assert.equal(result.replayAuthorized, false);
  }
});

test("consultation reports each fetch, retention, record, page and page-count failure", async () => {
  const active = profile();
  const query = { period: "2026-10" };
  const queryDigest = `sha256:${hash(JSON.stringify(query))}`;
  const page = (overrides = {}) => ({ context, editionDigest: active.digest, queryDigest, snapshotId: "snapshot-1", cursor: null,
    nextCursor: null, complete: true, responseBytes: Buffer.from("page"), records: [], ...overrides });
  const collect = (pagePort, retention = { async retain() { return true; } }, overrides = {}) => collectAeatConsultation({
    profile: active, operationId: "consultation", context, query, pagePort, retention,
    maximumPages: 1, maximumRecords: 5, maximumPageBytes: 32, ...overrides,
  });
  assert.equal((await collect({ async fetch() { throw new Error("private"); } })).diagnostic, "DIAG-AEAT-CONSULTATION-FETCH");
  assert.equal((await collect({ async fetch() { return page(); } }, { async retain() { return false; } })).diagnostic,
    "DIAG-AEAT-CONSULTATION-RETENTION");
  assert.equal((await collect({ async fetch() { return page({ records: [{ identity: ["unsafe token"], payloadDigest: "bad" }] }); } })).diagnostic,
    "DIAG-AEAT-CONSULTATION-RECORD");
  assert.equal((await collect({ async fetch() { return page({ responseBytes: Buffer.alloc(33) }); } })).diagnostic,
    "DIAG-AEAT-CONSULTATION-PAGE");
  assert.equal((await collect({ async fetch() { return page({ complete: false, nextCursor: "cursor-1" }); } })).diagnostic,
    "DIAG-AEAT-CONSULTATION-PAGE-LIMIT");
  assert.equal((await collect({ async fetch() { return page(); } }, undefined, { maximumPages: 0 })).diagnostic,
    "DIAG-AEAT-CONSULTATION-INPUT");
  const invalidInputs = [
    { operationId: "voluntary-submission" },
    { profile: { ...active, digest: "tampered" } },
    { context: null },
    { query: null },
    { query: Object.fromEntries(Array.from({ length: 33 }, (_, index) => [`field${index}`, "x"])) },
    { query: { "bad-key": "x" } },
    { query: { field: [] } },
    { query: { field: "x".repeat(257) } },
    { query: { field: "bad\nvalue" } },
    { pagePort: null },
    { pagePort: {} },
    { retention: null },
    { retention: {} },
    { maximumPages: 501 },
    { maximumPages: 1.5 },
    { maximumRecords: 0 },
    { maximumRecords: 100_001 },
    { maximumPageBytes: 0 },
    { maximumPageBytes: 1_048_577 },
  ];
  for (const override of invalidInputs) {
    const result = await collect({ async fetch() { return page(); } }, { async retain() { return true; } }, override);
    assert.equal(result.diagnostic, "DIAG-AEAT-CONSULTATION-INPUT", JSON.stringify(override)?.slice(0, 100));
  }
  assert.equal((await collectAeatConsultation(null)).diagnostic, "DIAG-AEAT-CONSULTATION-INPUT");
});
