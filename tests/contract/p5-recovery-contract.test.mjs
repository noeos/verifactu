import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  createSignedBackupManifest,
  verifyBackupManifest,
  verifyBackupObjects,
  authorizeRestoredStore,
} from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/backup-restore.js";
import { assessStartupRecovery } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/recovery.js";
import { isAllowedDurableTransition, validateJournalTransition } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/journal.js";
import { createFiscalContext } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";
import { createIdentity } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";
import { recordP5FaultDetection } from "../support/p5-fault-evidence.mjs";

const id = (kind, value) => createIdentity(kind, value).value;
const context = createFiscalContext({ tenantId: id("tenant", "tenant-a"), taxpayerId: id("taxpayer", "taxpayer-a"), installationId: id("installation", "install-a"), editionId: id("edition", "edition-a") }).value;
const hash = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

test("durable journal enforces transition order, version, context and safe diagnostics", () => {
  assert.equal(isAllowedDurableTransition(null, "pending"), true);
  assert.equal(isAllowedDurableTransition(null, "accepted"), false);
  assert.equal(isAllowedDurableTransition("attempt-started", "retry-wait"), true);
  assert.equal(isAllowedDurableTransition("accepted", "pending"), false);
  const entry = {
    id: id("event", "event-1"), context, schemaVersion: 1, aggregateId: "outbox-1", version: 1,
    eventCode: "SUBMISSION_QUEUED", commandId: "command-1", causationId: null, correlationId: "correlation-1",
    priorState: null, nextState: "pending", occurredAt: "2026-10-03T12:00:00Z", instantSource: "host",
    artifactIds: [], claimIds: [], safeDiagnostics: ["DIAG-TEST"],
  };
  assert.equal(validateJournalTransition(entry, context, 0, null).status, "ok");
  assert.equal(validateJournalTransition({ ...entry, version: 2 }, context, 0, null).status, "invalid");
  assert.equal(validateJournalTransition({ ...entry, nextState: "accepted" }, context, 0, null).status, "invalid");
  assert.equal(validateJournalTransition({ ...entry, safeDiagnostics: ["taxpayer=ES123"] }, context, 0, null).status, "invalid");
  const transitions = [
    ["pending", "leased"], ["pending", "permanently-failed"], ["leased", "pending"], ["leased", "attempt-started"],
    ["leased", "reconciliation-required"], ["attempt-started", "accepted"], ["attempt-started", "accepted-with-errors"],
    ["attempt-started", "rejected"], ["attempt-started", "retry-wait"], ["attempt-started", "indeterminate"],
    ["attempt-started", "reconciliation-required"], ["attempt-started", "permanently-failed"],
    ["indeterminate", "reconciliation-required"], ["retry-wait", "leased"], ["retry-wait", "reconciliation-required"],
    ["retry-wait", "permanently-failed"], ["reconciliation-required", "accepted"],
    ["reconciliation-required", "accepted-with-errors"], ["reconciliation-required", "rejected"],
    ["reconciliation-required", "retry-wait"], ["reconciliation-required", "permanently-failed"],
  ];
  for (const [from, to] of transitions) assert.equal(isAllowedDurableTransition(from, to), true, `${from} -> ${to}`);
  for (const [from, to] of [[null, "leased"], ["accepted", "pending"], ["unknown", "pending"], ["pending", "unknown"]])
    assert.equal(isAllowedDurableTransition(from, to), false, `${from} -> ${to}`);
  for (const [index, mutate] of [
    (value) => { value.context = null; },
    (value) => { value.context = { ...context, taxpayerId: id("taxpayer", "other") }; },
    (value) => { value.schemaVersion = 2; },
    (value) => { value.aggregateId = ""; },
    (value) => { value.commandId = ""; },
    (value) => { value.correlationId = ""; },
    (value) => { value.eventCode = ""; },
    (value) => { value.version = Number.MAX_SAFE_INTEGER + 1; },
    (value) => { value.priorState = "leased"; },
    (value) => { value.occurredAt = "invalid"; },
    (value) => { value.instantSource = "unknown"; },
    (value) => { value.artifactIds = null; },
    (value) => { value.artifactIds = ["bad\nartifact"]; },
    (value) => { value.claimIds = null; },
    (value) => { value.claimIds = [""]; },
    (value) => { value.safeDiagnostics = null; },
    (value) => { value.safeDiagnostics = Array(33).fill("DIAG-TEST"); },
  ].entries()) {
    const candidate = { ...entry };
    mutate(candidate);
    assert.equal(validateJournalTransition(candidate, context, 0, null).status, "invalid", `invalid journal case ${index + 1}`);
  }
});

test("startup recovery detects rollback and fences work on incomplete evidence", () => {
  const checkpoint = {
    storeId: "store-a", context, schemaVersion: 1, generation: 3,
    headDigest: `sha256:${"a".repeat(64)}`, journalVersion: 9,
    manifestDigest: `sha256:${"b".repeat(64)}`, previousCheckpointDigest: null,
    createdAt: "2026-10-03T10:00:00Z", externalAnchorDigest: `sha256:${"c".repeat(64)}`,
  };
  const observation = {
    storeId: "store-a", context, schemaVersion: 1, generation: 3,
    head: { id: id("chain", "chain-a"), context, schemaVersion: 1, generation: 3, lastRecordId: id("record", "record-3"), officialFingerprint: checkpoint.headDigest, generatedAt: checkpoint.createdAt, commitId: "commit-3" },
    journalVersion: 10, latestCheckpoint: checkpoint, checkpointChainVerified: true,
    artifactClosureVerified: true, eventChainVerified: true, observedAt: "2026-10-03T12:00:00Z",
    pendingOutboxStates: ["attempt-started", "pending"],
  };
  const recovered = assessStartupRecovery(observation);
  assert.equal(recovered.status, "ok");
  assert.equal(recovered.value.status, "ready");
  assert.equal(recovered.value.workerDiscoveryAllowed, true);
  assert.equal(recovered.value.attemptsRequiringReconciliation, 1);
  const rolledBack = assessStartupRecovery({ ...observation, generation: 2, journalVersion: 8, head: { ...observation.head, generation: 2 } });
  assert.equal(rolledBack.value.status, "blocked");
  assert.ok(rolledBack.value.reasons.includes("DIAG-ROLLBACK-DETECTED"));
  recordP5FaultDetection("P5-FAULT-021", rolledBack.value.status === "blocked" && !rolledBack.value.workerDiscoveryAllowed);
  assert.equal(assessStartupRecovery({ ...observation, artifactClosureVerified: false }).value.workerDiscoveryAllowed, false);
  assert.ok(assessStartupRecovery({ ...observation, latestCheckpoint: null }).value.reasons.includes("DIAG-CHECKPOINT-MISSING"));
  assert.ok(assessStartupRecovery({ ...observation, head: { ...observation.head, officialFingerprint: `sha256:${"f".repeat(64)}` } }).value.reasons.includes("DIAG-CHECKPOINT-HEAD-MISMATCH"));
  assert.ok(assessStartupRecovery({ ...observation, checkpointChainVerified: false }).value.reasons.includes("DIAG-CHECKPOINT-CHAIN"));
  assert.ok(assessStartupRecovery({ ...observation, latestCheckpoint: { ...checkpoint, previousCheckpointDigest: "bad" } }).value.reasons.includes("DIAG-CHECKPOINT-CHAIN"));
  assert.ok(assessStartupRecovery({ ...observation, latestCheckpoint: { ...checkpoint, storeId: "other" } }).value.reasons.includes("DIAG-CHECKPOINT-IDENTITY"));
  assert.ok(assessStartupRecovery({ ...observation, eventChainVerified: false }).value.reasons.includes("DIAG-JOURNAL-CLOSURE"));
  assert.ok(assessStartupRecovery({ ...observation, head: { ...observation.head, generation: 2 } }).value.reasons.includes("DIAG-HEAD-READBACK"));
  assert.equal(assessStartupRecovery({ ...observation, pendingOutboxStates: ["future-state"] }).status, "invalid");
  const twoUncertain = assessStartupRecovery({ ...observation, pendingOutboxStates: ["attempt-started", "indeterminate"] });
  assert.equal(twoUncertain.value.attemptsRequiringReconciliation, 2);
});

test("backup manifest signs canonical metadata and independently verifies every object", async () => {
  const signer = {
    signerId: "test:sig-v1",
    sign: async (_handle, bytes) => ({ status: "ok", value: Buffer.from(hash(bytes)) }),
    verify: async (_handle, bytes, signature) => ({ status: "ok", value: Buffer.from(hash(bytes)).equals(signature) }),
  };
  const object = Buffer.from("immutable-artifact", "utf8");
  const secondObject = Buffer.from("second-immutable-artifact", "utf8");
  const unsigned = {
    manifestVersion: 1, storeId: "source-store", targetStoreIdentity: "restored-store", schemaVersion: 1,
    contexts: [context], editionIds: ["edition-a"], entityCounts: { records: 1, artifacts: 2 },
    headsDigest: hash(Buffer.from("heads")), journalPosition: 4, outboxPosition: 2,
    objectReferences: [
      { objectId: "artifact-z", class: "artifact", byteLength: object.length, sha256: hash(object) },
      { objectId: "artifact-a", class: "artifact", byteLength: secondObject.length, sha256: hash(secondObject) },
    ],
    encryptionKeyReferences: ["kms:key-version-2"], toolVersion: "p5-test-1",
    checkpointDigest: hash(Buffer.from("checkpoint")), createdAt: "2026-10-03T12:00:00Z",
  };
  const created = await createSignedBackupManifest(unsigned, signer, "signer-handle");
  assert.equal(created.status, "ok");
  assert.equal((await verifyBackupManifest(created.value, signer)).status, "ok");
  assert.deepEqual(created.value.objectReferences.map((reference) => reference.objectId), ["artifact-a", "artifact-z"]);
  assert.equal(verifyBackupObjects(created.value, new Map([["artifact-z", object], ["artifact-a", secondObject]])).status, "ok");
  assert.equal(verifyBackupObjects(created.value, new Map([["artifact-z", Buffer.from("tampered")], ["artifact-a", secondObject]])).status, "indeterminate");
  recordP5FaultDetection("P5-FAULT-019", verifyBackupObjects(created.value,
    new Map([["artifact-z", new Uint8Array(object.length - 1)], ["artifact-a", secondObject]])).status === "indeterminate");
  const modified = { ...created.value, targetStoreIdentity: "attacker-store" };
  assert.equal((await verifyBackupManifest(modified, signer)).status, "indeterminate");
  for (const invalid of [
    null, { ...created.value, manifestVersion: 2 }, { ...created.value, storeId: "" },
    { ...created.value, targetStoreIdentity: "source-store" }, { ...created.value, schemaVersion: 0 },
    { ...created.value, contexts: [] }, { ...created.value, contexts: [null] }, { ...created.value, objectReferences: "invalid" },
    { ...created.value, editionIds: null }, { ...created.value, encryptionKeyReferences: null },
    { ...created.value, journalPosition: -1 }, { ...created.value, outboxPosition: -1 },
    { ...created.value, createdAt: "bad" }, { ...created.value, headsDigest: "bad" },
    { ...created.value, checkpointDigest: "bad" }, { ...created.value, entityCounts: [] },
    { ...created.value, entityCounts: { records: -1 } }, { ...created.value, toolVersion: "" },
    { ...created.value, objectReferences: [{ objectId: " padded ", byteLength: 1, sha256: hash(object) }] },
    { ...created.value, objectReferences: [{ objectId: "artifact-1", class: "unknown", byteLength: 1, sha256: hash(object) }] },
  ]) assert.equal((await createSignedBackupManifest(invalid, signer, "signer-handle")).status, "invalid", JSON.stringify(invalid));
  assert.equal((await createSignedBackupManifest(unsigned, { ...signer, sign: async () => ({ status: "unavailable", code: "unavailable" }) }, "signer-handle")).status, "unavailable");
  assert.equal((await createSignedBackupManifest(unsigned, { ...signer, async sign() { throw new Error("private"); } }, "signer-handle")).status, "unavailable");
  assert.equal((await createSignedBackupManifest(unsigned, signer, " padded ")).status, "invalid");
  assert.equal((await verifyBackupManifest(null, signer)).status, "invalid");
  assert.equal((await verifyBackupManifest(created.value, { ...signer, verify: async () => ({ status: "unavailable", code: "unavailable" }) })).status, "unavailable");
  assert.equal((await verifyBackupManifest(created.value, { ...signer, verify: async () => ({ status: "ok", value: false }) })).status, "indeterminate");
  assert.equal((await verifyBackupManifest(created.value, { ...signer, async verify() { throw new Error("private"); } })).status, "unavailable");
  assert.equal(verifyBackupObjects(created.value, new Map()).status, "indeterminate");
  assert.equal(verifyBackupObjects(created.value, new Map([["artifact-z", new Uint8Array(object.length + 1)], ["artifact-a", secondObject]])).status, "indeterminate");
});

test("restore remains gated by full integrity and classifies uncertain attempts for reconciliation", () => {
  const valid = {
    targetStoreId: "restored-store", manifestValid: true, signatureValid: true, allBytesVerified: true,
    countsVerified: true, constraintsRebuilt: true, chainsVerified: true, checkpointVerified: true,
    schemaSupported: true, contextMappingVerified: true, outboxStates: ["attempt-started", "pending"],
  };
  const fenced = authorizeRestoredStore(valid);
  assert.equal(fenced.value.status, "blocked");
  assert.equal(fenced.value.workersEnabled, false);
  assert.equal(fenced.value.networkEnabled, false);
  assert.equal(fenced.value.attemptStartedItemsToReconcile, 1);
  assert.ok(fenced.value.reasons.includes("DIAG-RECONCILIATION-REQUIRED"));
  const ready = authorizeRestoredStore({ ...valid, outboxStates: ["pending"] });
  assert.equal(ready.value.status, "ready");
  assert.equal(ready.value.workersEnabled, true);
  assert.equal(ready.value.attemptStartedItemsToReconcile, 0);
  const blocked = authorizeRestoredStore({ ...valid, chainsVerified: false });
  assert.equal(blocked.value.status, "blocked");
  assert.equal(blocked.value.networkEnabled, false);
  recordP5FaultDetection("P5-FAULT-020", blocked.value.status === "blocked" && !blocked.value.workersEnabled && !blocked.value.networkEnabled);
  for (const field of ["manifestValid", "signatureValid", "allBytesVerified", "countsVerified", "constraintsRebuilt",
    "chainsVerified", "checkpointVerified", "schemaSupported", "contextMappingVerified"]) {
    const blockedForField = authorizeRestoredStore({ ...valid, [field]: false, outboxStates: [] });
    assert.equal(blockedForField.value.status, "blocked", field);
    assert.equal(blockedForField.value.reasons.length, 1, field);
  }
  assert.equal(authorizeRestoredStore(null).status, "invalid");
  assert.equal(authorizeRestoredStore({ ...valid, targetStoreId: " padded " }).status, "invalid");
  assert.equal(authorizeRestoredStore({ ...valid, outboxStates: null }).status, "invalid");
  assert.equal(authorizeRestoredStore({ ...valid, outboxStates: ["unrecognized-state"] }).status, "invalid");
});
