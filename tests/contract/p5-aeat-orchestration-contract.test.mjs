import assert from "node:assert/strict";
import test from "node:test";
import { submitAeatBatch } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/submission-coordinator.js";
import { acceptedResponse, batchPlan, certificateAuthorization, context, profile } from "../support/p5-aeat-fixture.mjs";
import { recordP5FaultDetection } from "../support/p5-fault-evidence.mjs";

const limits = { maxResponseBytes: 1_048_576, connectTimeoutMs: 100, tlsTimeoutMs: 100, writeTimeoutMs: 100,
  firstByteTimeoutMs: 100, bodyIdleTimeoutMs: 100, totalTimeoutMs: 500 };
const clock = { wallNow: () => "2026-10-03T12:00:00.000Z", monotonicNow: () => 10 };
const observation = { statusCode: 200, headers: { "content-type": "text/xml" }, responseBytes: acceptedResponse,
  phase: "complete", delivery: "fully-sent", failureCode: null, tls: null, startedAt: clock.wallNow(), completedAt: clock.wallNow(), elapsedMs: 1 };
const persistence = (events, beginStatus = "ok", finishStatus = "ok") => ({ contractVersion: 1,
  async begin(record) { events.push(["begin", record]); return beginStatus === "ok" ? { status: "ok", value: "created" } :
    beginStatus === "replayed" ? { status: "ok", value: "replayed" } : { status: "unavailable", code: "unavailable" }; },
  async finish(record) { events.push(["finish", record]); return finishStatus === "ok" ? { status: "ok", value: "created" } : { status: "unavailable", code: "unavailable" }; },
});
const transport = (events, value = observation) => ({ contractVersion: 1, adapterId: "synthetic-transport",
  async observeOnce(request) { events.push(["send", request.request.bytes.slice()]); return value; },
});

test("attempt is durably started before exactly one network observation", async () => {
  const events = [];
  const batch = batchPlan();
  const result = await submitAeatBatch({ profile: profile(), batch, context, certificateAuthorization,
    persistence: persistence(events), transport: transport(events), attemptId: "attempt-1", observationId: "observation-1", limits, clock });
  assert.equal(result.status, "complete");
  assert.deepEqual(events.map(([type]) => type), ["begin", "send", "finish"]);
  assert.equal(events[0][1].state, "attempt-started");
  assert.equal(events[0][1].requestDigest, batch.request.sha256);
  assert.equal(Buffer.from(events[0][1].requestBytes).equals(Buffer.from(batch.request.bytes)), true);
  assert.equal(events[2][1].observationId, "observation-1");
  assert.equal(events[2][1].outcome, "accepted");
});

test("failure to commit the attempt prevents all network I/O", async () => {
  const events = [];
  const result = await submitAeatBatch({ profile: profile(), batch: batchPlan(), context, certificateAuthorization,
    persistence: persistence(events, "unavailable"), transport: transport(events), attemptId: "attempt-2", observationId: "observation-2", limits, clock });
  assert.equal(result.status, "blocked");
  assert.deepEqual(events.map(([type]) => type), ["begin"]);
});

test("replayed attempt identity is reconciled and never sent a second time", async () => {
  const events = [];
  const result = await submitAeatBatch({ profile: profile(), batch: batchPlan(), context, certificateAuthorization,
    persistence: persistence(events, "replayed"), transport: transport(events), attemptId: "attempt-replayed", observationId: "observation-replayed", limits, clock });
  assert.deepEqual(result, { status: "indeterminate", attemptId: "attempt-replayed", diagnostic: "DIAG-AEAT-ATTEMPT-REPLAY-RECONCILE" });
  assert.deepEqual(events.map(([type]) => type), ["begin"]);
});

test("response persistence failure leaves delivery indeterminate and is never retried", async () => {
  const events = [];
  const result = await submitAeatBatch({ profile: profile(), batch: batchPlan(), context, certificateAuthorization,
    persistence: persistence(events, "ok", "unavailable"), transport: transport(events), attemptId: "attempt-3", observationId: "observation-3", limits, clock });
  assert.equal(result.status, "indeterminate");
  assert.equal(events.filter(([type]) => type === "send").length, 1);
  assert.equal(events.filter(([type]) => type === "finish").length, 1);
  recordP5FaultDetection("P5-FAULT-047", result.status === "indeterminate" && events.filter(([type]) => type === "send").length === 1);
});

test("submission blocks stale artifacts and endpoint bindings before the durable attempt", async () => {
  const base = { profile: profile(), batch: batchPlan(), context, certificateAuthorization,
    persistence: persistence([]), transport: transport([]), attemptId: "attempt-preflight", observationId: "observation-preflight", limits, clock };
  const record = base.batch.orderedRecords[0];
  const recordDigest = base.batch.request.recordDigests[0];
  const cases = [
    [{ profile: null }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ profile: { ...base.profile, creationAllowed: false } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ context: { ...context, taxpayerId: { ...context.taxpayerId, value: "taxpayer-b" } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ attemptId: "" }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ observationId: "" }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ clock: { wallNow: () => "bad-date", monotonicNow: () => 10 } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ persistence: null }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ transport: null }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ certificateAuthorization: null }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ certificateAuthorization: { ...certificateAuthorization, environment: "production" } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, batchId: "" } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, eligibleAt: "bad-date" } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, request: { ...base.batch.request, bytes: Buffer.from("tampered") } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, endpointId: "other-endpoint", request: { ...base.batch.request, endpointId: "other-endpoint" } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [] } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: null } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: Array(501).fill(record) } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, request: null } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, request: { ...base.batch.request, bytes: "not-bytes" } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, request: { ...base.batch.request, bytes: new Uint8Array(), byteLength: 0 } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, request: { ...base.batch.request, byteLength: base.batch.request.byteLength + 1 } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, request: { ...base.batch.request, sha256: "invalid" } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, manifestDigest: `sha256:${"0".repeat(64)}` } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, request: { ...base.batch.request, orderedRecordIds: ["foreign-record"] } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, request: { ...base.batch.request, orderedRecordIds: null } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, request: { ...base.batch.request, recordDigests: null } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, request: { ...base.batch.request, recordDigests: [] } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, request: { ...base.batch.request, recordDigests: ["invalid"] } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, request: { ...base.batch.request, editionId: "foreign-edition" } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, request: { ...base.batch.request, editionDigest: `sha256:${"0".repeat(64)}` } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, request: { ...base.batch.request, operationId: "consultation" } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [{ ...base.batch.orderedRecords[0], sequence: 0 }] } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [{ ...base.batch.orderedRecords[0], sequence: Number.MAX_SAFE_INTEGER + 1 }] } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [{ ...base.batch.orderedRecords[0], sequence: 1.5 }] } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [{ ...base.batch.orderedRecords[0], series: "s".repeat(61) }] } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [{ ...base.batch.orderedRecords[0], number: "n".repeat(61) }] } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [{ ...base.batch.orderedRecords[0], issueDate: "2026-02-30" }] } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [{ ...record, recordId: "" }] } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [{ ...record, issuer: "" }] } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [{ ...record, issuer: "bad\nissuer" }] } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [{ ...record, series: "" }] } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [{ ...record, number: "" }] } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [null] } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [record, { ...record, sequence: 2 }],
      request: { ...base.batch.request, orderedRecordIds: [record.recordId, record.recordId], recordDigests: [recordDigest, recordDigest] } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [record, { ...record, sequence: 1, recordId: "second-record" }],
      request: { ...base.batch.request, orderedRecordIds: [record.recordId, "second-record"], recordDigests: [recordDigest, recordDigest] } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ batch: { ...base.batch, orderedRecords: [record, { ...record, recordId: "different-record" }],
      request: { ...base.batch.request, orderedRecordIds: [record.recordId, "different-record"], recordDigests: [recordDigest, recordDigest] } } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ certificateAuthorization: { ...certificateAuthorization, purpose: "document-signing" } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ profile: { ...base.profile, lifecycle: "candidate" } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
    [{ clock: { wallNow() { throw new Error("clock unavailable"); }, monotonicNow: () => 10 } }, "DIAG-AEAT-SUBMISSION-PREFLIGHT"],
  ];
  for (const [override, diagnostic] of cases) {
    const events = [];
    const result = await submitAeatBatch({ ...base, ...override,
      persistence: Object.hasOwn(override, "persistence") ? override.persistence : persistence(events),
      transport: Object.hasOwn(override, "transport") ? override.transport : transport(events),
    });
    assert.equal(result.status, "blocked", JSON.stringify(override));
    assert.equal(result.diagnostic, diagnostic, JSON.stringify(override));
    assert.deepEqual(events, [], JSON.stringify(override));
  }
});

test("submission contains begin and finish exceptions and stores unknown authority outcomes once", async () => {
  const beginEvents = [];
  const beginThrows = { contractVersion: 1, async begin() { beginEvents.push("begin"); throw new Error("private"); }, async finish() { throw new Error("unused"); } };
  const beginFailure = await submitAeatBatch({ profile: profile(), batch: batchPlan(), context, certificateAuthorization,
    persistence: beginThrows, transport: transport(beginEvents), attemptId: "attempt-begin-throw", observationId: "observation-begin-throw", limits, clock });
  assert.equal(beginFailure.diagnostic, "DIAG-AEAT-ATTEMPT-NOT-DURABLE");
  assert.deepEqual(beginEvents, ["begin"]);

  const events = [];
  const finishThrows = { contractVersion: 1, async begin() { events.push("begin"); return { status: "ok", value: "created" }; },
    async finish(item) { events.push(["finish", item]); throw new Error("private"); } };
  const nonSuccess = { ...observation, statusCode: 503 };
  const result = await submitAeatBatch({ profile: profile(), batch: batchPlan(), context, certificateAuthorization,
    persistence: finishThrows, transport: transport(events, nonSuccess), attemptId: "attempt-finish-throw", observationId: "observation-finish-throw", limits, clock });
  assert.equal(result.status, "indeterminate");
  assert.equal(result.diagnostic, "DIAG-AEAT-RESULT-NOT-DURABLE");
  assert.equal(events.filter((event) => Array.isArray(event) && event[0] === "finish").length, 1);
  assert.equal(events.filter((event) => Array.isArray(event) && event[0] === "send").length, 1);

  const runKnownOutcome = async (globalStatus, lineStatus, attemptId) => {
    const batch = batchPlan();
    const events = [];
    const xml = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:r="https://example.test/response"><s:Body><r:SubmitResponse><r:GlobalStatus>${globalStatus}</r:GlobalStatus><r:Wait>0</r:Wait><r:Line><r:Issuer>${batch.orderedRecords[0].issuer}</r:Issuer><r:Series>${batch.orderedRecords[0].series}</r:Series><r:Number>${batch.orderedRecords[0].number}</r:Number><r:IssueDate>${batch.orderedRecords[0].issueDate}</r:IssueDate><r:State>${lineStatus}</r:State></r:Line></r:SubmitResponse></s:Body></s:Envelope>`;
    const remote = { ...observation, responseBytes: Buffer.from(xml) };
    const result = await submitAeatBatch({ profile: profile(), batch, context, certificateAuthorization,
      persistence: persistence(events), transport: transport(events, remote), attemptId, observationId: `${attemptId}-observation`, limits, clock });
    assert.equal(result.status, "complete");
    return result.outcome;
  };
  assert.equal(await runKnownOutcome("ParcialmenteCorrecto", "AceptadoConErrores", "attempt-qualified"), "accepted-with-errors");
  assert.equal(await runKnownOutcome("Incorrecto", "Incorrecto", "attempt-rejected"), "rejected");
  const malformedEvents = [];
  const malformedOutcome = await submitAeatBatch({ profile: profile(), batch: batchPlan(), context, certificateAuthorization,
    persistence: persistence(malformedEvents), transport: transport(malformedEvents, { ...observation, responseBytes: Buffer.from("malformed") }),
    attemptId: "attempt-malformed-response", observationId: "observation-malformed-response", limits, clock });
  assert.equal(malformedOutcome.status, "indeterminate");
  assert.equal(malformedOutcome.diagnostic, "DIAG-AEAT-OUTCOME-UNRESOLVED");
});
