import assert from "node:assert/strict";
import test from "node:test";
import { appendJournalTransition, isAllowedDurableTransition, validateJournalTransition } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/journal.js";
import { decideRetry } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/retry-policy.js";
import { claimOutboxLease, completeOutboxWithLease, releaseOutboxLease, renewOutboxLease } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/leases.js";
import { context, hash, identity } from "../support/p5-aeat-fixture.mjs";
import { recordP5FaultDetection } from "../support/p5-fault-evidence.mjs";

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
  const store = { contractVersion: 1, async append(token, value) {
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

test("lease service supplies an authoritative clock and stable fencing generation", async () => {
  const lease = { outboxId: "outbox-1", ownerInstanceId: "worker-1", fencingToken: 5, acquiredAt: "2026-10-03T12:00:00Z",
    expiresAt: "2026-10-03T12:05:00Z", version: 1, clockPolicyId: "db-clock-v1", authoritativeClock: true };
  const store = { contractVersion: 1, async claim() { return { status: "ok", value: lease }; },
    async renew() { return { status: "ok", value: { ...lease, version: 2, expiresAt: "2026-10-03T12:10:00Z" } }; } };
  assert.equal((await claimOutboxLease(store, { context, outboxId: "outbox-1", ownerInstanceId: "worker-1", ttlMs: 10_000, expectedVersion: 0 })).status, "ok");
  assert.equal((await renewOutboxLease(store, context, lease, 10_000)).status, "ok");
  const falseClock = { ...store, async claim() { return { status: "ok", value: { ...lease, authoritativeClock: false } }; } };
  assert.equal((await claimOutboxLease(falseClock, { context, outboxId: "outbox-1", ownerInstanceId: "worker-1", ttlMs: 10_000, expectedVersion: 0 })).status, "indeterminate");
  const fullStore = { ...store, async release() { return { status: "ok", value: "released" }; }, async complete(input) {
    return { status: "ok", value: { outboxId: input.lease.outboxId, fencingToken: input.lease.fencingToken,
      version: input.expectedOutboxVersion + 1, state: input.nextState, lastObservationId: input.observationId } };
  } };
  assert.equal((await releaseOutboxLease(fullStore, context, lease)).status, "ok");
  assert.equal((await completeOutboxWithLease(fullStore, { context, lease, expectedOutboxVersion: 1, nextState: "accepted", observationId: "observation-1" })).status, "ok");
  const stale = { ...fullStore, async complete(input) { return { status: "ok", value: { outboxId: input.lease.outboxId,
    fencingToken: input.lease.fencingToken + 1, version: input.expectedOutboxVersion + 1, state: input.nextState,
    lastObservationId: input.observationId } }; } };
  const staleCompletion = await completeOutboxWithLease(stale, { context, lease, expectedOutboxVersion: 1, nextState: "accepted", observationId: "observation-1" });
  assert.equal(staleCompletion.status, "indeterminate");
  recordP5FaultDetection("P5-FAULT-017", staleCompletion.status === "indeterminate");

  let claimed = false;
  const raceStore = { contractVersion: 1, async claim(input) {
    if (claimed) return { status: "conflict", code: "fenced" };
    claimed = true;
    return { status: "ok", value: { ...lease, outboxId: input.outboxId, ownerInstanceId: input.ownerInstanceId,
      version: input.expectedVersion + 1 } };
  } };
  const raceInput = { context, outboxId: "outbox-race", ttlMs: 10_000, expectedVersion: 0 };
  const racedClaims = await Promise.all([
    claimOutboxLease(raceStore, { ...raceInput, ownerInstanceId: "worker-a" }),
    claimOutboxLease(raceStore, { ...raceInput, ownerInstanceId: "worker-b" }),
  ]);
  assert.deepEqual(racedClaims.map((item) => item.status).sort(), ["conflict", "ok"]);
  recordP5FaultDetection("P5-FAULT-015", racedClaims.filter((item) => item.status === "ok").length === 1);

  // The lease is structurally valid but expired according to the store's
  // authoritative clock; the worker deliberately supplies no clock of its own.
  const expiredLease = { ...lease, acquiredAt: "2026-10-03T11:50:00Z", expiresAt: "2026-10-03T11:59:00Z" };
  const expiredRenewal = await renewOutboxLease({ contractVersion: 1, async renew() { return { status: "conflict", code: "fenced" }; } },
    context, expiredLease, 10_000);
  assert.deepEqual(expiredRenewal, { status: "conflict", code: "fenced" });
  recordP5FaultDetection("P5-FAULT-016", expiredRenewal.status === "conflict" && expiredRenewal.code === "fenced");
});

test("lease validation fails closed on malformed requests, store results, renewals and completion readbacks", async () => {
  const lease = { outboxId: "outbox-2", ownerInstanceId: "worker-2", fencingToken: 7, acquiredAt: "2026-10-03T12:00:00Z",
    expiresAt: "2026-10-03T12:05:00Z", version: 2, clockPolicyId: "db-clock-v1", authoritativeClock: true };
  const claimStore = { contractVersion: 1, async claim() { return { status: "ok", value: lease }; } };
  const claimInput = { context, outboxId: "outbox-2", ownerInstanceId: "worker-2", ttlMs: 10_000, expectedVersion: 1 };
  assert.equal((await claimOutboxLease(null, claimInput)).status, "invalid");
  for (const invalid of [
    { ...claimInput, outboxId: " padded " }, { ...claimInput, ownerInstanceId: "" }, { ...claimInput, ttlMs: 999 },
    { ...claimInput, ttlMs: 300_001 }, { ...claimInput, expectedVersion: -1 }, { ...claimInput, expectedVersion: 1.5 },
  ]) assert.equal((await claimOutboxLease(claimStore, invalid)).status, "invalid");
  assert.equal((await claimOutboxLease({ ...claimStore, async claim() { return { status: "unavailable", code: "unavailable" }; } }, claimInput)).status, "unavailable");
  for (const altered of [
    { ...lease, outboxId: "other" }, { ...lease, ownerInstanceId: "other" }, { ...lease, version: 1 },
    { ...lease, fencingToken: 0 }, { ...lease, authoritativeClock: false }, { ...lease, expiresAt: "2026-10-03T11:59:00Z" },
  ]) assert.equal((await claimOutboxLease({ ...claimStore, async claim() { return { status: "ok", value: altered }; } }, claimInput)).status, "indeterminate");

  const renewStore = { contractVersion: 1, async renew() { return { status: "ok", value: { ...lease, version: 3, expiresAt: "2026-10-03T12:10:00Z" } }; } };
  assert.equal((await renewOutboxLease(null, context, lease, 10_000)).status, "invalid");
  assert.equal((await renewOutboxLease(renewStore, context, lease, 999)).status, "invalid");
  assert.equal((await renewOutboxLease({ ...renewStore, async renew() { return { status: "conflict", code: "fenced" }; } }, context, lease, 10_000)).status, "conflict");
  for (const altered of [
    { ...lease, ownerInstanceId: "other", version: 3, expiresAt: "2026-10-03T12:10:00Z" },
    { ...lease, fencingToken: 8, version: 3, expiresAt: "2026-10-03T12:10:00Z" },
    { ...lease, version: 4, expiresAt: "2026-10-03T12:10:00Z" },
    { ...lease, version: 3, expiresAt: lease.expiresAt },
  ]) assert.equal((await renewOutboxLease({ ...renewStore, async renew() { return { status: "ok", value: altered }; } }, context, lease, 10_000)).status, "indeterminate");

  assert.equal((await releaseOutboxLease(null, context, lease)).status, "invalid");
  const completeInput = { context, lease, expectedOutboxVersion: 2, nextState: "accepted", observationId: "observation-2" };
  const completeStore = { contractVersion: 1, async complete(input) { return { status: "ok", value: { outboxId: input.lease.outboxId,
    fencingToken: input.lease.fencingToken, version: input.expectedOutboxVersion + 1, state: input.nextState,
    lastObservationId: input.observationId } }; } };
  assert.equal((await completeOutboxWithLease(null, completeInput)).status, "invalid");
  assert.equal((await completeOutboxWithLease(completeStore, { ...completeInput, expectedOutboxVersion: 0 })).status, "invalid");
  assert.equal((await completeOutboxWithLease(completeStore, { ...completeInput, nextState: "future-state" })).status, "invalid");
  assert.equal((await completeOutboxWithLease(completeStore, { ...completeInput, observationId: " padded " })).status, "invalid");
  assert.equal((await completeOutboxWithLease({ ...completeStore, async complete() { return { status: "unavailable", code: "unavailable" }; } }, completeInput)).status, "unavailable");
  for (const altered of [
    { outboxId: "other", fencingToken: lease.fencingToken, version: 3, state: "accepted", lastObservationId: "observation-2" },
    { outboxId: lease.outboxId, fencingToken: lease.fencingToken, version: 4, state: "accepted", lastObservationId: "observation-2" },
    { outboxId: lease.outboxId, fencingToken: lease.fencingToken, version: 3, state: "rejected", lastObservationId: "observation-2" },
    { outboxId: lease.outboxId, fencingToken: lease.fencingToken, version: 3, state: "accepted", lastObservationId: "other" },
  ]) assert.equal((await completeOutboxWithLease({ ...completeStore, async complete() { return { status: "ok", value: altered }; } }, completeInput)).status, "indeterminate");
});
