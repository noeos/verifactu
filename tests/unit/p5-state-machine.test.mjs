import assert from "node:assert/strict";
import { X509Certificate } from "node:crypto";
import test from "node:test";
import { appendJournalTransition, isAllowedDurableTransition, validateJournalTransition } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/journal.js";
import { decideRetry } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/retry-policy.js";
import { context, hash, identity } from "../support/p5-aeat-fixture.mjs";
import { createP5TestPki } from "../support/p5-test-pki.mjs";

test("synthetic PKI emits canonical positive DER certificate serials", () => {
  const serials = [
    "007f" + "11".repeat(14),
    "0080" + "22".repeat(14),
    "0001" + "33".repeat(14),
    "ff" + "44".repeat(15),
  ].map((serial) => Buffer.from(serial, "hex"));
  const expectedSerials = [
    "7f" + "11".repeat(14),
    "80" + "22".repeat(14),
    "01" + "33".repeat(14),
    "ff" + "44".repeat(15),
  ];
  let nextSerial = 0;
  const pki = createP5TestPki({ serialBytes: () => serials[nextSerial++] });
  const certificates = [
    pki.caPem,
    pki.serverCertificate,
    pki.wrongHostCertificate,
    pki.clientCertificate,
  ];

  assert.equal(nextSerial, certificates.length);
  assert.deepEqual(
    certificates.map((certificate) =>
      new X509Certificate(certificate).serialNumber.toLowerCase(),
    ),
    expectedSerials,
  );
});

test("durable journal has no blind retry or terminal-state escape", () => {
  assert.equal(isAllowedDurableTransition("attempt-started", "indeterminate"), true);
  assert.equal(isAllowedDurableTransition("indeterminate", "leased"), false);
  assert.equal(isAllowedDurableTransition("accepted", "pending"), false);
  assert.equal(isAllowedDurableTransition(null, "pending"), true);
});

test("journal transitions validate every field, freeze retained arrays and append only under the atomic host token", async () => {
  const entry = { id: identity("event", "event-1"), context, schemaVersion: 1, aggregateId: "aggregate-1", version: 1,
    eventCode: "record-created", commandId: "command-1", causationId: null, correlationId: "correlation-1", priorState: null,
    nextState: "pending", occurredAt: "2026-10-03T12:00:00Z", instantSource: "host", artifactIds: ["artifact-1"],
    claimIds: ["claim-1"], safeDiagnostics: ["DIAG-STORE-RECORDED"] };
  const checked = validateJournalTransition(entry, context, 0, null);
  assert.equal(checked.status, "ok");
  assert.equal(Object.isFrozen(checked.value.artifactIds), true);
  assert.equal(validateJournalTransition({ ...entry, version: 2 }, context, 0, null).status, "invalid");
  assert.equal(validateJournalTransition({ ...entry, nextState: "accepted" }, context, 0, null).status, "invalid");
  assert.equal(validateJournalTransition({ ...entry, safeDiagnostics: ["taxpayer-id"] }, context, 0, null).status, "invalid");

  let appends = 0;
  const store = { contractVersion: 2, async append(token, value) {
    appends += 1;
    assert.equal(token.transactionId, "tx-1");
    assert.equal(Object.isFrozen(value.claimIds), true);
    return { status: "ok", value: "created" };
  } };
  const token = { adapterId: "atomic-host", transactionId: "tx-1", context, commandId: "command-1",
    canonicalDigest: `sha256:${hash("command")}`, capabilityLevel: "atomic-host" };
  assert.equal((await appendJournalTransition(store, token, { entry, expectedVersion: 0, previousState: null })).status, "ok");
  assert.equal((await appendJournalTransition(store, { ...token, capabilityLevel: "standalone-test" }, { entry, expectedVersion: 0, previousState: null })).status, "invalid");
  assert.equal((await appendJournalTransition(null, token, { entry, expectedVersion: 0, previousState: null })).status, "invalid");
  assert.equal(appends, 1);
});

test("ambiguous delivery always routes to reconciliation before retry", () => {
  const policy = { policyId: "retry-policy-1", digest: `sha256:${hash("retry")}`, maximumAttempts: 3,
    baseDelayMs: 1000, maximumDelayMs: 60_000, retryableFaults: ["DIAG-AEAT-DNS"], replayEvidenceRequired: true };
  const decision = decideRetry({ operationId: "voluntary-submission", state: "attempt-started", attemptCount: 1,
    delivery: "fully-sent", faultCode: "DIAG-AEAT-DNS", provedNotAppliedEvidenceId: null, replayAuthorizationEvidenceId: null,
    aeatWaitUntil: null, now: "2026-10-03T12:00:00.000Z", jitterPermille: 100, policy });
  assert.equal(decision.action, "reconcile-first");
  const accepted = decideRetry({ operationId: "voluntary-submission", state: "accepted", attemptCount: 1,
    delivery: "fully-sent", faultCode: "DIAG-AEAT-DNS", provedNotAppliedEvidenceId: null, replayAuthorizationEvidenceId: null,
    aeatWaitUntil: null, now: "2026-10-03T12:00:00.000Z", jitterPermille: 100, policy });
  assert.deepEqual(accepted, { action: "terminal", state: "accepted" });
  for (const state of ["accepted-with-errors", "rejected", "permanently-failed"]) {
    assert.equal(decideRetry({ operationId: "voluntary-submission", state, attemptCount: 1, delivery: "not-started",
      faultCode: "DIAG-AEAT-DNS", provedNotAppliedEvidenceId: null, replayAuthorizationEvidenceId: null,
      aeatWaitUntil: null, now: "2026-10-03T12:00:00.000Z", jitterPermille: 0, policy }).action, "terminal");
  }
  const retry = decideRetry({ operationId: "voluntary-submission", state: "retry-wait", attemptCount: 1,
    delivery: "not-started", faultCode: "DIAG-AEAT-DNS", provedNotAppliedEvidenceId: null, replayAuthorizationEvidenceId: null,
    aeatWaitUntil: "2026-10-03T12:01:00.000Z", now: "2026-10-03T12:00:00.000Z", jitterPermille: 100, policy });
  assert.deepEqual(retry, { action: "retry-at", retryAt: "2026-10-03T12:01:00.000Z", attempt: 2, evidenceId: null });
  assert.equal(decideRetry({ operationId: "voluntary-submission", state: "retry-wait", attemptCount: 1, delivery: "not-started",
    faultCode: "DIAG-UNKNOWN", provedNotAppliedEvidenceId: null, replayAuthorizationEvidenceId: null, aeatWaitUntil: null,
    now: "2026-10-03T12:00:00.000Z", jitterPermille: 0, policy }).action, "operator-required");

  const valid = { operationId: "voluntary-submission", state: "retry-wait", attemptCount: 0, delivery: "not-started",
    faultCode: "DIAG-AEAT-DNS", provedNotAppliedEvidenceId: null, replayAuthorizationEvidenceId: null,
    aeatWaitUntil: null, now: "2026-10-03T12:00:00.000Z", jitterPermille: 0, policy };
  for (const bad of [
    { policy: null }, { policy: { ...policy, policyId: " unsafe " } }, { policy: { ...policy, digest: "bad" } },
    { policy: { ...policy, maximumAttempts: 0 } }, { policy: { ...policy, maximumAttempts: 101 } },
    { policy: { ...policy, baseDelayMs: -1 } }, { policy: { ...policy, maximumDelayMs: 999 } },
    { policy: { ...policy, retryableFaults: ["unsafe"] } }, { attemptCount: -1 }, { jitterPermille: 1001 },
    { now: "bad-date" }, { aeatWaitUntil: "bad-date" },
  ]) assert.equal(decideRetry({ ...valid, ...bad }).action, "blocked");

  for (const state of ["indeterminate", "reconciliation-required"])
    assert.equal(decideRetry({ ...valid, state }).action, "reconcile-first");
  assert.equal(decideRetry({ ...valid, delivery: "possibly-sent" }).reason, "DIAG-DELIVERY-AMBIGUOUS");
  assert.equal(decideRetry({ ...valid, attemptCount: 3 }).reason, "DIAG-RETRY-EXHAUSTED");
  assert.equal(decideRetry({ ...valid, delivery: "fully-sent", provedNotAppliedEvidenceId: "proof-1" }).reason, "DIAG-REPLAY-NOT-AUTHORIZED");
  const authorized = decideRetry({ ...valid, delivery: "fully-sent", provedNotAppliedEvidenceId: "proof-1",
    replayAuthorizationEvidenceId: "replay-1", policy: { ...policy, replayEvidenceRequired: true } });
  assert.equal(authorized.action, "retry-at");
  assert.equal(authorized.evidenceId, "proof-1");
  const waitPassed = decideRetry({ ...valid, attemptCount: 10, jitterPermille: 1000, aeatWaitUntil: "2026-10-03T11:59:00.000Z",
    policy: { ...policy, maximumAttempts: 20 } });
  assert.equal(waitPassed.action, "retry-at");
  assert.equal(waitPassed.retryAt, "2026-10-03T12:02:00.000Z");
});
