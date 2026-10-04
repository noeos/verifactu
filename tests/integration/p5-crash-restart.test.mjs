import assert from "node:assert/strict";
import test from "node:test";
import { assessStartupRecovery } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/recovery.js";
import { genesisHead } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/head-cas.js";
import { context, hash } from "../support/p5-aeat-fixture.mjs";
import { recordP5FaultDetection } from "../support/p5-fault-evidence.mjs";

test("restart verifies checkpoint closure and identifies uncertain attempts for reconciliation", async () => {
  const head = genesisHead(context, "chain-1");
  const checkpoint = { storeId: "store-1", context, schemaVersion: 1, generation: 0, headDigest: null, journalVersion: 0,
    manifestDigest: `sha256:${hash("manifest")}`, previousCheckpointDigest: null, createdAt: "2026-10-03T12:00:00Z", externalAnchorDigest: null };
  const assess = (pendingOutboxStates) => assessStartupRecovery({ storeId: "store-1", context, schemaVersion: 1, generation: 0,
    head, journalVersion: 0, latestCheckpoint: checkpoint, checkpointChainVerified: true, artifactClosureVerified: true,
    eventChainVerified: true, observedAt: "2026-10-03T12:00:01Z", pendingOutboxStates });
  const uncertain = assess(["attempt-started"]);
  assert.equal(uncertain.status, "ok");
  assert.equal(uncertain.value.status, "ready");
  assert.equal(uncertain.value.attemptsRequiringReconciliation, 1);
  const rolledBack = assess(["pending"]);
  assert.equal(rolledBack.value.workerDiscoveryAllowed, true);
  const broken = assess(["pending"]);
  assert.equal(assessStartupRecovery({ storeId: "store-1", context, schemaVersion: 1, generation: 0, head, journalVersion: 0,
    latestCheckpoint: { ...checkpoint, manifestDigest: "bad" }, checkpointChainVerified: false,
    artifactClosureVerified: false, eventChainVerified: false, observedAt: "2026-10-03T12:00:01Z", pendingOutboxStates: [] }).value.status, "blocked");
  assert.equal(broken.value.workerDiscoveryAllowed, true);

  const timedOutStore = { async readCheckpoint() { return { status: "unavailable", code: "unavailable" }; } };
  const timedOut = await timedOutStore.readCheckpoint();
  assert.equal(timedOut.status, "unavailable");
  const blockedAtRestart = assessStartupRecovery({ storeId: "store-1", context, schemaVersion: 1, generation: 0, head,
    journalVersion: 0, latestCheckpoint: timedOut.status === "ok" ? timedOut.value : null,
    checkpointChainVerified: false, artifactClosureVerified: false, eventChainVerified: false,
    observedAt: "2026-10-03T12:00:02Z", pendingOutboxStates: [] });
  assert.equal(blockedAtRestart.value.status, "blocked");
  assert.equal(blockedAtRestart.value.workerDiscoveryAllowed, false);
  assert.equal(blockedAtRestart.value.networkAllowed, false);
  const recoveredStore = { async readCheckpoint() { return { status: "ok", value: checkpoint }; } };
  const restored = await recoveredStore.readCheckpoint();
  const readyAfterRestart = assessStartupRecovery({ storeId: "store-1", context, schemaVersion: 1, generation: 0, head,
    journalVersion: 0, latestCheckpoint: restored.value, checkpointChainVerified: true, artifactClosureVerified: true,
    eventChainVerified: true, observedAt: "2026-10-03T12:00:03Z", pendingOutboxStates: ["attempt-started"] });
  assert.equal(readyAfterRestart.value.status, "ready");
  assert.equal(readyAfterRestart.value.attemptsRequiringReconciliation, 1);
  recordP5FaultDetection("P5-FAULT-054", blockedAtRestart.value.networkAllowed === false &&
    readyAfterRestart.value.status === "ready" && readyAfterRestart.value.attemptsRequiringReconciliation === 1);
});
