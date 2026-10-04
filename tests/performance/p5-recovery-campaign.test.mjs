import assert from "node:assert/strict";
import test from "node:test";
import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import {
  setImmediate as yieldToEventLoop,
  setTimeout as delay,
} from "node:timers/promises";
import { decideAeatReconciliation } from "../../evidence/runs/artifacts/build/verifactu/dist/aeat/reconciliation.js";
import { assessStartupRecovery } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/recovery.js";
import { genesisHead } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/head-cas.js";
import { context, hash, profile } from "../support/p5-aeat-fixture.mjs";

function reconciliationInputs() {
  const activeProfile = profile();
  const responseDigest = `sha256:${hash("recovery-campaign-response")}`;
  const response = {
    status: "accepted",
    responseArtifact: Buffer.from("synthetic-accepted-response"),
    responseDigest,
  };
  const correlation = {
    status: "complete",
    outcomes: [
      {
        recordId: "record-1",
        sequence: 1,
        state: "accepted",
        responseLineDigest: responseDigest,
      },
    ],
    extraResponseLines: 0,
    duplicateResponseLines: 0,
    missingResponseLines: 0,
    responseDigest,
    requestDigest: `sha256:${hash("recovery-campaign-request")}`,
    diagnostics: [],
  };
  const consultation = {
    status: "complete",
    queryDigest: `sha256:${hash("recovery-campaign-query")}`,
    snapshotId: "campaign-snapshot-1",
    pageCount: 1,
    records: [
      {
        identity: ["ES123", "A", "1"],
        payloadDigest: `sha256:${hash("recovery-campaign-record")}`,
      },
    ],
    pageDigests: [`sha256:${hash("recovery-campaign-page")}`],
    diagnostic: null,
  };
  const common = {
    profile: activeProfile,
    operationId: "voluntary-submission",
    context,
    originalRecordIds: ["record-1"],
    response,
    correlation,
    consultation,
    evidenceDigest: `sha256:${hash("recovery-campaign-evidence")}`,
  };
  return [
    common,
    { ...common, response: { ...response, status: "malformed" } },
    {
      ...common,
      correlation: {
        ...correlation,
        status: "indeterminate",
        outcomes: [],
        missingResponseLines: 1,
      },
      absenceProofVerifier: {
        async verify() {
          return {
            status: "verified",
            proofDigest: `sha256:${hash("recovery-campaign-absence-proof")}`,
            authorizationEvidenceId: "campaign-absence-authorization",
          };
        },
      },
    },
  ];
}

test("bounded recovery and AEAT reconciliation campaign records resource metrics", async () => {
  const head = genesisHead(context, "chain-1");
  const checkpoint = {
    storeId: "store-1",
    context,
    schemaVersion: 1,
    generation: 0,
    headDigest: null,
    journalVersion: 0,
    manifestDigest: `sha256:${hash("manifest")}`,
    previousCheckpointDigest: null,
    createdAt: "2026-10-03T12:00:00Z",
    externalAnchorDigest: `sha256:${hash("checkpoint-anchor")}`,
  };
  const observation = {
    storeId: "store-1",
    context,
    schemaVersion: 1,
    generation: 0,
    head,
    journalVersion: 0,
    latestCheckpoint: checkpoint,
    checkpointChainVerified: true,
    artifactClosureVerified: true,
    eventChainVerified: true,
    observedAt: "2026-10-03T12:00:01Z",
    pendingOutboxStates: ["attempt-started", "pending"],
  };
  const inputs = reconciliationInputs();
  const expectedDispositions = [
    "confirmed-applied",
    "still-unknown",
    "confirmed-absent-replay-authorized",
  ];
  const handlesBefore = process._getActiveHandles().length;
  const eventLoop = monitorEventLoopDelay({ resolution: 10 });
  eventLoop.enable();
  let peakRssBytes = process.memoryUsage().rss;
  const rssSampler = setInterval(() => {
    peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss);
  }, 5);
  const started = performance.now();
  let ready = 0;
  const dispositions = new Map(expectedDispositions.map((value) => [value, 0]));
  for (let index = 0; index < 10_000; index += 1) {
    if (assessStartupRecovery(observation).value.status === "ready") ready += 1;
    const decision = await decideAeatReconciliation(
      inputs[index % inputs.length],
    );
    dispositions.set(
      decision.disposition,
      (dispositions.get(decision.disposition) ?? 0) + 1,
    );
    if (index % 1_000 === 0)
      peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss);
  }

  const queue = Array.from({ length: 128 }, (_, index) => index);
  let queueHighWater = queue.length;
  let inFlight = 0;
  let maxConcurrent = 0;
  const concurrentDispositions = new Map(
    expectedDispositions.map((value) => [value, 0]),
  );
  await Promise.all(
    Array.from({ length: 32 }, async () => {
      for (;;) {
        const item = queue.shift();
        if (item === undefined) return;
        queueHighWater = Math.max(queueHighWater, queue.length);
        inFlight += 1;
        maxConcurrent = Math.max(maxConcurrent, inFlight);
        const decision = await decideAeatReconciliation(
          inputs[item % inputs.length],
        );
        concurrentDispositions.set(
          decision.disposition,
          (concurrentDispositions.get(decision.disposition) ?? 0) + 1,
        );
        await yieldToEventLoop();
        inFlight -= 1;
      }
    }),
  );

  await delay(20);
  const wallMs = performance.now() - started;
  clearInterval(rssSampler);
  eventLoop.disable();
  const handlesAfter = process._getActiveHandles().length;
  const metrics = {
    executions: 10_000,
    ready,
    reconciliationDecisions: 10_000,
    dispositionCounts: Object.fromEntries(dispositions),
    concurrentOperations: 128,
    concurrentDispositionCounts: Object.fromEntries(concurrentDispositions),
    wallMs,
    peakRssBytes: Math.max(peakRssBytes, process.memoryUsage().rss),
    eventLoopDelayMs: Number(eventLoop.max) / 1_000_000,
    queueHighWater,
    maxConcurrentSyntheticOperations: maxConcurrent,
    openHandlesBeforeAfter: { before: handlesBefore, after: handlesAfter },
  };
  assert.equal(metrics.ready, metrics.executions);
  assert.deepEqual(metrics.dispositionCounts, {
    "confirmed-applied": 3_334,
    "still-unknown": 3_333,
    "confirmed-absent-replay-authorized": 3_333,
  });
  assert.deepEqual(metrics.concurrentDispositionCounts, {
    "confirmed-applied": 43,
    "still-unknown": 43,
    "confirmed-absent-replay-authorized": 42,
  });
  assert.ok(metrics.wallMs < 3_600_000);
  assert.ok(metrics.peakRssBytes > 0);
  assert.ok(
    Number.isFinite(metrics.eventLoopDelayMs) && metrics.eventLoopDelayMs >= 0,
  );
  assert.ok(metrics.queueHighWater > 0);
  assert.ok(metrics.maxConcurrentSyntheticOperations <= 32);
  assert.ok(
    metrics.openHandlesBeforeAfter.before < 128 &&
      metrics.openHandlesBeforeAfter.after < 128,
  );
  assert.ok(
    metrics.openHandlesBeforeAfter.after <=
      metrics.openHandlesBeforeAfter.before + 8,
  );
  console.log(`P5_PERFORMANCE_METRICS ${JSON.stringify(metrics)}`);
});
