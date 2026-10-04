import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { beginUnitOfWork } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/unit-of-work.js";
import { sha256Digest } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/model.js";
import { archiveRetentionClosure, planRetention, purgeRetentionPlan } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/retention.js";
import { createFiscalContext } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";
import { createIdentity } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";
import { recordP5FaultDetection } from "../support/p5-fault-evidence.mjs";

const identity = (kind, value) => createIdentity(kind, value).value;
const context = createFiscalContext({
  tenantId: identity("tenant", "tenant-a"),
  taxpayerId: identity("taxpayer", "taxpayer-a"),
  installationId: identity("installation", "install-a"),
  editionId: identity("edition", "edition-a"),
}).value;
const digest = `sha256:${createHash("sha256").update("command").digest("hex")}`;

function ports(overrides = {}) {
  const calls = { begin: 0, publication: 0, commit: 0, rollback: 0 };
  const token = {
    adapterId: "test:atomic-host",
    transactionId: "tx-1",
    context,
    commandId: "command-1",
    canonicalDigest: digest,
    capabilityLevel: "atomic-host",
  };
  const ok = (value) => ({ status: "ok", value });
  const store = {
    contractVersion: 1,
    append: async () => ok("created"),
    put: async () => ok("created"),
    get: async () => ({ status: "unavailable", code: "not-found" }),
    list: async () => ok({ items: [], snapshotId: "snapshot-1", nextCursor: null, complete: true }),
    discover: async () => ok({ items: [], snapshotId: "snapshot-1", nextCursor: null, complete: true }),
    read: async () => ({ status: "unavailable", code: "not-found" }),
    compareAndAppend: async () => ok("advanced"),
  };
  const leases = {
    contractVersion: 1,
    claim: async () => ({ status: "unavailable", code: "unavailable" }),
    renew: async () => ({ status: "unavailable", code: "unavailable" }),
    release: async () => ok("released"),
    complete: async () => ({ status: "unavailable", code: "unavailable" }),
  };
  const hostUnitOfWork = {
    contractVersion: 1,
    capabilityLevel: "atomic-host",
    adapterId: "test:atomic-host",
    begin: async () => { calls.begin += 1; return ok(token); },
    stageHostPublication: async () => { calls.publication += 1; return ok("staged"); },
    commit: async () => { calls.commit += 1; return overrides.commit ?? ok({ commitId: "commit-1" }); },
    rollback: async () => { calls.rollback += 1; return ok("rolled-back"); },
    resolveUnknownCommit: async () => ok({ committed: false, commitId: null }),
  };
  return {
    calls,
    token,
    ports: {
      capabilityLevel: overrides.capabilityLevel ?? "atomic-host",
      adapterId: "test:atomic-host",
      hostUnitOfWork,
      records: store,
      artifacts: store,
      evidence: store,
      journal: store,
      outbox: store,
      heads: store,
      leases,
    },
  };
}

test("host UoW refuses weak capabilities before opening a transaction", async () => {
  const standalone = ports({ capabilityLevel: "standalone-test" });
  assert.equal((await beginUnitOfWork(standalone.ports, { context, commandId: "command-1", canonicalDigest: digest })).status, "invalid");
  assert.equal(standalone.calls.begin, 0);
  const mismatched = ports();
  mismatched.token.transactionId = " padded ";
  assert.equal((await beginUnitOfWork(mismatched.ports, { context, commandId: "command-1", canonicalDigest: digest })).status, "invalid");
  assert.equal(mismatched.calls.rollback, 1);
  for (const [family, method] of [["records", "list"], ["artifacts", "get"], ["evidence", "append"], ["journal", "list"],
    ["outbox", "discover"], ["heads", "read"], ["leases", "claim"]]) {
    const invalidPorts = ports();
    invalidPorts.ports[family][method] = undefined;
    assert.equal((await beginUnitOfWork(invalidPorts.ports, { context, commandId: "command-1", canonicalDigest: digest })).status,
      "invalid", `${family}.${method}`);
    assert.equal(invalidPorts.calls.begin, 0, `${family}.${method}`);
  }
  const malformed = ports();
  const aborted = new AbortController();
  aborted.abort();
  for (const input of [null, { context, commandId: "command-1", canonicalDigest: "invalid" },
    { context, commandId: "bad\ncommand", canonicalDigest: digest },
    { context, commandId: "command-1", canonicalDigest: digest, signal: aborted.signal }])
    assert.equal((await beginUnitOfWork(malformed.ports, input)).status, "invalid");
  assert.equal(malformed.calls.begin, 0);
});

test("concurrent duplicate command reservation returns one original record", async () => {
  const value = ports();
  const bytes = Buffer.from("same-canonical-command");
  const record = { id: identity("record", "race-record"), context, schemaVersion: 1, editionId: context.editionId,
    kind: "alta", predecessorId: null, semanticDigest: sha256Digest(bytes), canonicalBytes: bytes,
    createdAt: "2026-10-03T12:00:00Z", sequence: 1 };
  const reserved = new Map();
  let transactionNumber = 0;
  value.ports.hostUnitOfWork.begin = async (input) => ({ status: "ok", value: { ...value.token,
    transactionId: `tx-${++transactionNumber}`, context: input.context, commandId: input.commandId, canonicalDigest: input.canonicalDigest } });
  value.ports.records.append = async (_token, candidate, binding) => {
    const key = `${binding.context.tenantId.value}/${binding.context.taxpayerId.value}/${binding.commandId}`;
    const previous = reserved.get(key);
    if (previous) return previous.digest === binding.canonicalDigest && previous.record.id.value === candidate.id.value
      ? { status: "ok", value: "replayed" } : { status: "conflict", code: "idempotency-conflict" };
    reserved.set(key, { digest: binding.canonicalDigest, record: candidate });
    return { status: "ok", value: "created" };
  };
  const [left, right] = await Promise.all([
    beginUnitOfWork(value.ports, { context, commandId: "command-1", canonicalDigest: digest }),
    beginUnitOfWork(value.ports, { context, commandId: "command-1", canonicalDigest: digest }),
  ]);
  assert.equal(left.status, "ok");
  assert.equal(right.status, "ok");
  const outcomes = await Promise.all([
    left.value.appendRecord(record, { context, commandId: "command-1", canonicalDigest: digest, resultDigest: null }),
    right.value.appendRecord(record, { context, commandId: "command-1", canonicalDigest: digest, resultDigest: null }),
  ]);
  assert.deepEqual(outcomes.map((item) => item.status === "ok" ? item.value : item.status).sort(), ["created", "replayed"]);
  assert.equal(reserved.size, 1);
  recordP5FaultDetection("P5-FAULT-055", reserved.size === 1 && outcomes.filter((item) => item.status === "ok" && item.value === "created").length === 1 &&
    outcomes.filter((item) => item.status === "ok" && item.value === "replayed").length === 1);
});

test("retention planning blocks unsafe closure and purge requires matching approval and tombstone", async () => {
  const policy = { policyId: "policy-1", digest, dataClasses: ["fiscal-record"], jurisdiction: "ES", fiscalPeriod: "2026",
    legalHoldResolved: true, approvalRequired: true };
  const object = (objectId, overrides = {}) => ({ objectId, context, dataClass: "fiscal-record", createdAt: "2020-01-01T00:00:00Z",
    minimumRetainUntil: "2025-01-01T00:00:00Z", legalHold: false, dependencies: [], closureComplete: true, version: 1, ...overrides });
  const eligible = object("record-1");
  const eligibleSecond = object("record-0", { version: 2 });
  const blockedByHold = object("record-2", { legalHold: "unknown" });
  const blockedByMissingDependency = object("record-3", { dependencies: ["artifact-missing"] });
  const classifiedRows = [
    object(" bad-id "),
    object("record-unknown-class", { dataClass: "unlisted-class" }),
    object("record-retained", { minimumRetainUntil: "2027-01-01T00:00:00Z" }),
    object("record-invalid-retention", { minimumRetainUntil: "bad-date" }),
    object("record-open-closure", { closureComplete: false }),
    object("record-invalid-dependency", { dependencies: ["unsafe dependency"] }),
  ];
  const adapter = {
    async dryRun() { return { status: "ok", value: [eligible, blockedByHold, blockedByMissingDependency, ...classifiedRows] }; },
    async archive(input) { return { status: "ok", value: { archivedCount: input.objects.length, archiveManifestDigest: digest } }; },
    async purge(input) { return { status: "ok", value: { purgedCount: input.objects.length, tombstoneDigest: digest } }; },
  };
  const planned = await planRetention(adapter, { context, policy, asOf: "2026-10-03T12:00:00Z", limit: 10 });
  assert.equal(planned.status, "ok");
  assert.equal(planned.value.status, "blocked");
  assert.deepEqual(planned.value.candidates.map((item) => item.objectId), ["record-1"]);
  assert.deepEqual(planned.value.blocked.map((item) => item.reason).sort(), [
    "DIAG-RETENTION-CLOSURE", "DIAG-RETENTION-DEPENDENCY", "DIAG-RETENTION-DEPENDENCY",
    "DIAG-RETENTION-LEGAL-HOLD", "DIAG-RETENTION-MINIMUM", "DIAG-RETENTION-MINIMUM",
    "DIAG-RETENTION-OBJECT-INVALID", "DIAG-RETENTION-POLICY-UNKNOWN",
  ]);

  const oneObjectPlan = await planRetention({ ...adapter, async dryRun() { return { status: "ok", value: [eligible] }; } },
    { context, policy, asOf: "2026-10-03T12:00:00Z", limit: 10 });
  assert.equal(oneObjectPlan.status, "ok");
  assert.equal(oneObjectPlan.value.status, "eligible");
  const sortedPlan = await planRetention({ ...adapter, async dryRun() { return { status: "ok", value: [eligible, eligibleSecond] }; } },
    { context, policy, asOf: "2026-10-03T12:00:00Z", limit: 10 });
  assert.equal(sortedPlan.status, "ok");
  assert.deepEqual(sortedPlan.value.candidates.map((item) => item.objectId), ["record-0", "record-1"]);
  const linked = object("record-linked", { dependencies: ["record-0"] });
  const closurePlan = await planRetention({ ...adapter, async dryRun() { return { status: "ok", value: [linked, eligibleSecond] }; } },
    { context, policy, asOf: "2026-10-03T12:00:00Z", limit: 10 });
  assert.equal(closurePlan.value.status, "eligible");
  assert.deepEqual(closurePlan.value.candidates.map((item) => item.objectId), ["record-0", "record-linked"]);
  const duplicatePlan = await planRetention({ ...adapter, async dryRun() { return { status: "ok", value: [eligible, eligible] }; } },
    { context, policy, asOf: "2026-10-03T12:00:00Z", limit: 10 });
  assert.deepEqual(duplicatePlan, { status: "indeterminate", code: "corruption" });
  const malformedPlanRows = await planRetention({ ...adapter, async dryRun() { return { status: "ok", value: null }; } },
    { context, policy, asOf: "2026-10-03T12:00:00Z", limit: 10 });
  assert.deepEqual(malformedPlanRows, { status: "indeterminate", code: "corruption" });
  const invalidPlans = [
    [null, { context, policy, asOf: "2026-10-03T12:00:00Z", limit: 10 }],
    [adapter, null],
    [adapter, { context, policy: null, asOf: "2026-10-03T12:00:00Z", limit: 10 }],
    [adapter, { context: null, policy, asOf: "2026-10-03T12:00:00Z", limit: 10 }],
    [adapter, { context, policy: { ...policy, policyId: "" }, asOf: "2026-10-03T12:00:00Z", limit: 10 }],
    [adapter, { context, policy: { ...policy, digest: "invalid" }, asOf: "2026-10-03T12:00:00Z", limit: 10 }],
    [adapter, { context, policy: { ...policy, jurisdiction: "" }, asOf: "2026-10-03T12:00:00Z", limit: 10 }],
    [adapter, { context, policy: { ...policy, fiscalPeriod: "" }, asOf: "2026-10-03T12:00:00Z", limit: 10 }],
    [adapter, { context, policy: { ...policy, legalHoldResolved: false }, asOf: "2026-10-03T12:00:00Z", limit: 10 }],
    [adapter, { context, policy, asOf: "invalid", limit: 10 }],
    [adapter, { context, policy, asOf: "2026-10-03T12:00:00Z", limit: 0 }],
    [adapter, { context, policy, asOf: "2026-10-03T12:00:00Z", limit: 501 }],
    [adapter, { context, policy: { ...policy, dataClasses: null }, asOf: "2026-10-03T12:00:00Z", limit: 10 }],
    [adapter, { context, policy: { ...policy, dataClasses: [] }, asOf: "2026-10-03T12:00:00Z", limit: 10 }],
    [adapter, { context, policy: { ...policy, dataClasses: [""] }, asOf: "2026-10-03T12:00:00Z", limit: 10 }],
  ];
  for (const [candidateAdapter, candidateInput] of invalidPlans)
    assert.deepEqual(await planRetention(candidateAdapter, candidateInput), { status: "invalid", code: "invalid-input" });
  const archiveInput = { context, objects: [eligible], archiveIdentity: "archive-1" };
  const invalidArchives = [
    [null, archiveInput], [adapter, null], [adapter, { ...archiveInput, archiveIdentity: "" }],
    [adapter, { ...archiveInput, context: null }], [adapter, { ...archiveInput, objects: [] }],
    [adapter, { ...archiveInput, objects: Array(501).fill(eligible) }],
    [adapter, { ...archiveInput, objects: [{ ...eligible, objectId: "" }] }],
    [adapter, { ...archiveInput, objects: [{ ...eligible, dataClass: "" }] }],
    [adapter, { ...archiveInput, objects: [{ ...eligible, version: 0 }] }],
    [adapter, { ...archiveInput, objects: [{ ...eligible, dependencies: null }] }],
    [adapter, { ...archiveInput, objects: [{ ...eligible, closureComplete: false }] }],
    [adapter, { ...archiveInput, objects: [{ ...eligible, legalHold: true }] }],
    [adapter, { ...archiveInput, objects: [{ ...eligible, context: { ...context, tenantId: identity("tenant", "other") } }] }],
  ];
  for (const [candidateAdapter, candidateInput] of invalidArchives)
    assert.deepEqual(await archiveRetentionClosure(candidateAdapter, candidateInput), { status: "invalid", code: "invalid-input" });
  const archived = await archiveRetentionClosure(adapter, { context, objects: [eligibleSecond, eligible], archiveIdentity: "archive-1" });
  assert.equal(archived.status, "ok");
  assert.equal(archived.value.archivedCount, 2);
  assert.equal((await archiveRetentionClosure(adapter, { context, objects: [blockedByHold], archiveIdentity: "archive-1" })).status, "invalid");
  assert.equal((await archiveRetentionClosure(adapter, { context, objects: [eligible, eligible], archiveIdentity: "archive-1" })).status, "invalid");
  assert.equal((await archiveRetentionClosure(adapter, { context, objects: [null], archiveIdentity: "archive-1" })).status, "invalid");
  const partialArchive = await archiveRetentionClosure({ ...adapter, async archive() {
    return { status: "ok", value: { archivedCount: 0, archiveManifestDigest: digest } };
  } }, { context, objects: [eligible], archiveIdentity: "archive-1" });
  assert.deepEqual(partialArchive, { status: "indeterminate", code: "corruption" });
  recordP5FaultDetection("P5-FAULT-025", partialArchive.status === "indeterminate");

  let purges = 0;
  const approval = { async verify(input) {
    assert.equal(input.planDigest, oneObjectPlan.value.planDigest);
    return { status: "ok", value: true };
  } };
  const purgingAdapter = { ...adapter, async purge(input) { purges += 1; return adapter.purge(input); } };
  const blockedByLegalHold = await purgeRetentionPlan(purgingAdapter, approval, { context, plan: planned.value,
    approvalEvidenceId: "approval-1", tombstoneId: "tombstone-1", confirmedPlanDigest: planned.value.planDigest });
  assert.equal(blockedByLegalHold.status, "invalid");
  recordP5FaultDetection("P5-FAULT-026", planned.value.blocked.some((item) => item.reason === "DIAG-RETENTION-LEGAL-HOLD") && purges === 0);
  const mismatched = await purgeRetentionPlan(purgingAdapter, approval, { context, plan: oneObjectPlan.value, approvalEvidenceId: "approval-1",
    tombstoneId: "tombstone-1", confirmedPlanDigest: digest });
  assert.equal(mismatched.status, "invalid");
  assert.equal(purges, 0);
  const purged = await purgeRetentionPlan(purgingAdapter, approval, { context, plan: oneObjectPlan.value, approvalEvidenceId: "approval-1",
    tombstoneId: "tombstone-1", confirmedPlanDigest: oneObjectPlan.value.planDigest });
  assert.equal(purged.status, "ok");
  assert.equal(purges, 1);
  const purgeInput = { context, plan: oneObjectPlan.value, approvalEvidenceId: "approval-1", tombstoneId: "tombstone-1",
    confirmedPlanDigest: oneObjectPlan.value.planDigest };
  const invalidPurges = [
    [null, approval, purgeInput], [purgingAdapter, null, purgeInput], [purgingAdapter, approval, null],
    [purgingAdapter, approval, { ...purgeInput, plan: null }],
    [purgingAdapter, approval, { ...purgeInput, plan: { ...oneObjectPlan.value, status: "blocked" } }],
    [purgingAdapter, approval, { ...purgeInput, plan: { ...oneObjectPlan.value, blocked: [{ objectId: "record-1", reason: "hold" }] } }],
    [purgingAdapter, approval, { ...purgeInput, plan: { ...oneObjectPlan.value, candidates: null } }],
    [purgingAdapter, approval, { ...purgeInput, plan: { ...oneObjectPlan.value, policyDigest: "invalid" } }],
    [purgingAdapter, approval, { ...purgeInput, plan: { ...oneObjectPlan.value, planDigest: "invalid" } }],
    [purgingAdapter, approval, { ...purgeInput, plan: { ...oneObjectPlan.value, policyId: "" } }],
    [purgingAdapter, approval, { ...purgeInput, plan: { ...oneObjectPlan.value, context: null } }],
    [purgingAdapter, approval, { ...purgeInput, confirmedPlanDigest: digest }],
    [purgingAdapter, approval, { ...purgeInput, approvalEvidenceId: "" }],
    [purgingAdapter, approval, { ...purgeInput, tombstoneId: "" }],
    [purgingAdapter, approval, { ...purgeInput, plan: { ...oneObjectPlan.value, candidates: [] } }],
    [purgingAdapter, approval, { ...purgeInput, plan: { ...oneObjectPlan.value, candidates: [null] } }],
    [purgingAdapter, approval, { ...purgeInput, plan: { ...oneObjectPlan.value, candidates: [{ objectId: "", version: 1, dataClass: "fiscal-record" }] } }],
    [purgingAdapter, approval, { ...purgeInput, plan: { ...oneObjectPlan.value, candidates: [{ objectId: "record-1", version: 1, dataClass: "" }] } }],
    [purgingAdapter, approval, { ...purgeInput, plan: { ...oneObjectPlan.value, candidates: [{ objectId: "record-1", version: 0, dataClass: "fiscal-record" }] } }],
    [purgingAdapter, approval, { ...purgeInput, plan: { ...oneObjectPlan.value, candidates: [oneObjectPlan.value.candidates[0], oneObjectPlan.value.candidates[0]] } }],
  ];
  for (const [candidateAdapter, candidateApproval, candidateInput] of invalidPurges)
    assert.deepEqual(await purgeRetentionPlan(candidateAdapter, candidateApproval, candidateInput),
      { status: "invalid", code: "unsupported-capability" });
  assert.deepEqual(await purgeRetentionPlan(purgingAdapter, { async verify() { return { status: "ok", value: false }; } }, purgeInput),
    { status: "invalid", code: "unsupported-capability" });
  assert.deepEqual(await purgeRetentionPlan(purgingAdapter, { async verify() { return { status: "unavailable", code: "unavailable" }; } }, purgeInput),
    { status: "unavailable", code: "unavailable" });
  assert.deepEqual(await purgeRetentionPlan({ ...purgingAdapter, async purge() { return { status: "conflict", code: "fenced" }; } }, approval, purgeInput),
    { status: "conflict", code: "fenced" });

  const failedDryRun = await planRetention({ ...adapter, async dryRun() { throw new Error("read unavailable"); } },
    { context, policy, asOf: "2026-10-03T12:00:00Z", limit: 10 });
  assert.deepEqual(failedDryRun, { status: "unavailable", code: "unavailable" });
  const failedArchive = await archiveRetentionClosure({ ...adapter, async archive() { throw new Error("commit may be unknown"); } },
    { context, objects: [eligible], archiveIdentity: "archive-1" });
  assert.deepEqual(failedArchive, { status: "indeterminate", code: "unknown-commit" });
  const failedApproval = await purgeRetentionPlan(purgingAdapter, { async verify() { throw new Error("approval source unavailable"); } },
    { context, plan: oneObjectPlan.value, approvalEvidenceId: "approval-1", tombstoneId: "tombstone-1",
      confirmedPlanDigest: oneObjectPlan.value.planDigest });
  assert.deepEqual(failedApproval, { status: "unavailable", code: "unavailable" });
  const failedPurge = await purgeRetentionPlan({ ...purgingAdapter, async purge() { throw new Error("purge may be unknown"); } }, approval,
    { context, plan: oneObjectPlan.value, approvalEvidenceId: "approval-1", tombstoneId: "tombstone-1",
      confirmedPlanDigest: oneObjectPlan.value.planDigest });
  assert.deepEqual(failedPurge, { status: "indeterminate", code: "unknown-commit" });
});

test("atomic-host commit requires host publication staged with the same command", async () => {
  const fixture = ports();
  const opened = await beginUnitOfWork(fixture.ports, { context, commandId: "command-1", canonicalDigest: digest });
  assert.equal(opened.status, "ok");
  const session = opened.value;
  assert.equal((await session.commit()).status, "invalid");
  assert.equal(fixture.calls.commit, 0);
  assert.equal((await session.stagePublication({
    publicationId: "invoice-publication-1",
    revision: 1,
    commandId: "command-1",
    canonicalDigest: digest,
    createdAt: "2026-10-03T12:00:00Z",
  })).status, "ok");
  assert.equal((await session.commit()).status, "ok");
  assert.equal(session.state, "committed");
  assert.equal(fixture.calls.commit, 1);
  assert.equal((await session.rollback()).status, "conflict");
});

test("unit of work validates journal diagnostics and serializes subsequent operations", async () => {
  const fixture = ports();
  const opened = await beginUnitOfWork(fixture.ports, { context, commandId: "command-1", canonicalDigest: digest });
  assert.equal(opened.status, "ok");
  const entry = { id: identity("event", "journal-event"), context, schemaVersion: 1, aggregateId: "aggregate-1", version: 1,
    eventCode: "record-published", commandId: "command-1", causationId: null, correlationId: "correlation-1",
    priorState: null, nextState: "pending", occurredAt: "2026-10-03T12:00:00Z", instantSource: "host",
    artifactIds: [], claimIds: [], safeDiagnostics: ["DIAG-TEST"] };
  assert.deepEqual(await opened.value.appendJournal(entry), { status: "ok", value: "created" });
  assert.deepEqual(await opened.value.appendJournal({ ...entry, id: identity("event", "journal-event-2"), safeDiagnostics: ["unsafe"] }),
    { status: "invalid", code: "invalid-input" });
  assert.equal(opened.value.state, "active");
});

test("unknown commit acknowledgement becomes indeterminate and cannot be rolled back", async () => {
  const fixture = ports({ commit: { status: "indeterminate", code: "unknown-commit" } });
  const opened = await beginUnitOfWork(fixture.ports, { context, commandId: "command-1", canonicalDigest: digest });
  assert.equal(opened.status, "ok");
  const session = opened.value;
  assert.equal((await session.stagePublication({
    publicationId: "invoice-publication-1", revision: 1, commandId: "command-1",
    canonicalDigest: digest, createdAt: "2026-10-03T12:00:00Z",
  })).status, "ok");
  assert.equal((await session.commit()).status, "indeterminate");
  assert.equal(session.state, "indeterminate");
  assert.equal((await session.rollback()).status, "conflict");
  assert.equal(fixture.calls.rollback, 0);
});

test("cancellation before commit rolls back without claiming a commit", async () => {
  const fixture = ports();
  const controller = new AbortController();
  const opened = await beginUnitOfWork(fixture.ports, { context, commandId: "command-1", canonicalDigest: digest, signal: controller.signal });
  assert.equal(opened.status, "ok");
  controller.abort();
  assert.equal((await opened.value.commit()).status, "unavailable");
  assert.equal(opened.value.state, "rolled-back");
  assert.equal(fixture.calls.commit, 0);
  assert.equal(fixture.calls.rollback, 1);
});
