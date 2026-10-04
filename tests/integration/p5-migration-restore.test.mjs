import assert from "node:assert/strict";
import test from "node:test";
import { applyResumableMigration } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/migrations.js";
import { recordP5FaultDetection } from "../support/p5-fault-evidence.mjs";

const backupDigest = `sha256:${"a".repeat(64)}`;
const itemDigest = `sha256:${"b".repeat(64)}`;
const definition = {
  migrationId: "schema-v1-to-v2", fromVersion: 1, toVersion: 2, online: false,
  maximumBatchItems: 10, requiredBackupDigest: backupDigest, affectedEntities: ["record", "artifact"],
};
const ok = (value) => ({ status: "ok", value });

function adapter(overrides = {}) {
  const state = { cursor: null, batch: 0, saved: [], verified: 0, finished: 0 };
  const implementation = {
    schemaVersion: 1, writable: true, fencingToken: 7,
    loadCheckpoint: async () => ok(null),
    verifyBackup: async () => ok(true),
    begin: async (input) => ok({ migrationId: input.migrationId, sourceVersion: 1, targetVersion: 2, cursor: null, processedItems: 0, status: "started", fencingToken: 7 }),
    applyBatch: async (_definition, checkpoint) => {
      state.batch += 1;
      if (checkpoint.cursor === null) return ok({ nextCursor: "page-1", processedItems: 2, complete: false, sourceDigest: itemDigest, outputDigest: itemDigest });
      return ok({ nextCursor: null, processedItems: 1, complete: true, sourceDigest: itemDigest, outputDigest: itemDigest });
    },
    saveCheckpoint: async (checkpoint) => { state.saved.push(checkpoint); return ok(checkpoint); },
    verify: async () => { state.verified += 1; return ok({ sourceDigest: itemDigest, outputDigest: itemDigest, valid: true }); },
    finish: async (checkpoint) => { state.finished += 1; return ok(checkpoint); },
    ...overrides,
  };
  return { state, implementation };
}

test("migration writes resumable checkpoints, verifies the full result, then finishes", async () => {
  const fixture = adapter();
  const result = await applyResumableMigration(fixture.implementation, definition);
  assert.equal(result.status, "complete");
  assert.equal(result.checkpoint.status, "complete");
  assert.equal(result.checkpoint.processedItems, 3);
  assert.equal(fixture.state.saved.length, 2);
  assert.equal(fixture.state.verified, 1);
  assert.equal(fixture.state.finished, 1);
});

test("unknown newer schema is read-only and never invokes migration writes", async () => {
  const fixture = adapter({ schemaVersion: 3, begin: async () => assert.fail("must not begin") });
  const result = await applyResumableMigration(fixture.implementation, definition);
  assert.deepEqual(result, { status: "read-only", reason: "unknown-newer-schema" });
  assert.equal(fixture.state.saved.length, 0);
});

test("missing backup, stale fencing and nonadvancing cursor fail closed", async () => {
  const noBackup = adapter({ verifyBackup: async () => ({ status: "indeterminate", code: "corruption" }) });
  assert.equal((await applyResumableMigration(noBackup.implementation, definition)).status, "blocked");
  const stale = adapter({ begin: async () => ok({ migrationId: definition.migrationId, sourceVersion: 1, targetVersion: 2, cursor: null, processedItems: 0, status: "started", fencingToken: 6 }) });
  assert.equal((await applyResumableMigration(stale.implementation, definition)).code, "DIAG-MIGRATION-FENCE");
  const stuck = adapter({ applyBatch: async (_definition, checkpoint) => ok({ nextCursor: checkpoint.cursor, processedItems: 0, complete: false, sourceDigest: itemDigest, outputDigest: itemDigest }) });
  assert.equal((await applyResumableMigration(stuck.implementation, definition)).code, "DIAG-MIGRATION-BATCH-INVALID");
  assert.equal(stuck.state.saved.length, 0);
});

test("migration bounds batches and blocks mismatched verification or failed checkpoint writes", async () => {
  let cursorNumber = 0;
  const bounded = adapter({ applyBatch: async () => { cursorNumber += 1; return ok({ nextCursor: `cursor-${cursorNumber}`, processedItems: 1, complete: false, sourceDigest: itemDigest, outputDigest: itemDigest }); } });
  assert.equal((await applyResumableMigration(bounded.implementation, definition, 2)).code, "DIAG-MIGRATION-BOUND");
  const badVerification = adapter({ applyBatch: async () => ok({ nextCursor: null, processedItems: 1, complete: true, sourceDigest: itemDigest, outputDigest: itemDigest }), verify: async () => ok({ sourceDigest: itemDigest, outputDigest: itemDigest, valid: false }) });
  assert.equal((await applyResumableMigration(badVerification.implementation, definition)).code, "DIAG-MIGRATION-VERIFY");
  const checkpointFailure = adapter({ saveCheckpoint: async () => ({ status: "unavailable", code: "unavailable" }) });
  assert.equal((await applyResumableMigration(checkpointFailure.implementation, definition)).code, "DIAG-MIGRATION-CHECKPOINT-WRITE");
});

test("adapter exceptions stop migration and retain the last known checkpoint", async () => {
  const faultCases = [
    ["verifyBackup", "DIAG-MIGRATION-BACKUP"],
    ["loadCheckpoint", "DIAG-MIGRATION-CHECKPOINT"],
    ["begin", "DIAG-MIGRATION-BEGIN"],
    ["applyBatch", "DIAG-MIGRATION-BATCH"],
    ["saveCheckpoint", "DIAG-MIGRATION-CHECKPOINT-WRITE"],
    ["verify", "DIAG-MIGRATION-VERIFY"],
    ["finish", "DIAG-MIGRATION-FINISH"],
  ];
  for (const [method, expectedCode] of faultCases) {
    const calls = [];
    const throwAdapter = adapter({
      [method]: async () => { calls.push(method); throw new Error(`${method} unavailable`); },
    });
    const result = await applyResumableMigration(throwAdapter.implementation, definition);
    assert.equal(result.status, "blocked", method);
    assert.equal(result.code, expectedCode, method);
    assert.ok(calls.includes(method), `${method} should be called`);
    if (method === "applyBatch" || method === "saveCheckpoint")
      assert.equal(result.checkpoint?.status, "started", `${method} should preserve last acknowledged checkpoint`);
    if (["verifyBackup", "loadCheckpoint", "begin"].includes(method))
      assert.equal(result.checkpoint, null, `${method} should not claim a checkpoint exists`);
    if (method === "verify")
      assert.equal(result.checkpoint?.status, "verifying", "verification failure should retain resumable state");
    if (method === "finish")
      assert.equal(result.checkpoint?.status, "verifying", "finish failure should retain resumable state");
    const faultId = { saveCheckpoint: "P5-FAULT-018", begin: "P5-FAULT-022", applyBatch: "P5-FAULT-023", verify: "P5-FAULT-024" }[method];
    if (faultId) recordP5FaultDetection(faultId, result.status === "blocked" && result.code === expectedCode);
  }
});

test("migration blocks malformed plans and every unacknowledged adapter result", async () => {
  assert.equal((await applyResumableMigration(adapter().implementation, { ...definition, maximumBatchItems: 0 })).code,
    "DIAG-MIGRATION-INVALID");
  assert.equal((await applyResumableMigration(adapter().implementation, definition, 0)).code, "DIAG-MIGRATION-INVALID");
  assert.equal((await applyResumableMigration(adapter({ schemaVersion: 0 }).implementation, definition)).code,
    "DIAG-MIGRATION-SCHEMA");
  assert.equal((await applyResumableMigration(adapter({ writable: false }).implementation, definition)).code,
    "DIAG-MIGRATION-SCHEMA");
  assert.equal((await applyResumableMigration(adapter({ verifyBackup: async () => ({ status: "unavailable", code: "unavailable" }) }).implementation,
    definition)).code, "DIAG-MIGRATION-BACKUP");
  assert.equal((await applyResumableMigration(adapter({ loadCheckpoint: async () => ({ status: "unavailable", code: "unavailable" }) }).implementation,
    definition)).code, "DIAG-MIGRATION-CHECKPOINT");
  assert.equal((await applyResumableMigration(adapter({ begin: async () => ({ status: "unavailable", code: "unavailable" }) }).implementation,
    definition)).code, "DIAG-MIGRATION-BEGIN");
  assert.equal((await applyResumableMigration(adapter({ applyBatch: async () => ({ status: "unavailable", code: "unavailable" }) }).implementation,
    definition)).code, "DIAG-MIGRATION-BATCH");
  assert.equal((await applyResumableMigration(adapter({ verify: async () => ({ status: "unavailable", code: "unavailable" }) }).implementation,
    definition)).code, "DIAG-MIGRATION-VERIFY");
  assert.equal((await applyResumableMigration(adapter({ finish: async () => ({ status: "unavailable", code: "unavailable" }) }).implementation,
    definition)).code, "DIAG-MIGRATION-FINISH");

  const badBatch = adapter({ applyBatch: async () => ok({ nextCursor: null, processedItems: 0, complete: true,
    sourceDigest: "bad", outputDigest: itemDigest }) });
  assert.equal((await applyResumableMigration(badBatch.implementation, definition)).code, "DIAG-MIGRATION-BATCH-INVALID");
  const invalidCheckpointReadback = adapter({ saveCheckpoint: async (checkpoint) => ok({ ...checkpoint, fencingToken: 99 }) });
  assert.equal((await applyResumableMigration(invalidCheckpointReadback.implementation, definition)).code,
    "DIAG-MIGRATION-CHECKPOINT-WRITE");
  const invalidFinishReadback = adapter({ finish: async (checkpoint) => ok({ ...checkpoint, status: "running" }) });
  assert.equal((await applyResumableMigration(invalidFinishReadback.implementation, definition)).code, "DIAG-MIGRATION-FINISH");
});
