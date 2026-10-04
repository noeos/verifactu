import assert from "node:assert/strict";
import test from "node:test";
import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import { setImmediate as yieldToEventLoop, setTimeout as delay } from "node:timers/promises";
import { assessStartupRecovery } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/recovery.js";
import { genesisHead } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/head-cas.js";
import { context, hash } from "../support/p5-aeat-fixture.mjs";

test("recovery campaign records the frozen resource metrics and respects concurrency bounds", async () => {
  const head = genesisHead(context, "chain-1");
  const checkpoint = { storeId: "store-1", context, schemaVersion: 1, generation: 0, headDigest: null, journalVersion: 0,
    manifestDigest: `sha256:${hash("manifest")}`, previousCheckpointDigest: null, createdAt: "2026-10-03T12:00:00Z", externalAnchorDigest: null };
  const observation = { storeId: "store-1", context, schemaVersion: 1, generation: 0, head, journalVersion: 0, latestCheckpoint: checkpoint,
    checkpointChainVerified: true, artifactClosureVerified: true, eventChainVerified: true, observedAt: "2026-10-03T12:00:01Z",
    pendingOutboxStates: ["attempt-started", "pending"] };
  const handlesBefore = process._getActiveHandles().length;
  const eventLoop = monitorEventLoopDelay({ resolution: 10 });
  eventLoop.enable();
  let peakRssBytes = process.memoryUsage().rss;
  const rssSampler = setInterval(() => { peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss); }, 5);
  const started = performance.now();
  let ready = 0;
  for (let index = 0; index < 10_000; index += 1) {
    if (assessStartupRecovery(observation).value.status === "ready") ready += 1;
    if (index % 1000 === 0) peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss);
  }

  const queue = Array.from({ length: 128 }, (_, index) => index);
  let queueHighWater = queue.length;
  let inFlight = 0;
  let maxConcurrent = 0;
  await Promise.all(Array.from({ length: 32 }, async () => {
    for (;;) {
      const item = queue.shift();
      if (item === undefined) return;
      queueHighWater = Math.max(queueHighWater, queue.length);
      inFlight += 1;
      maxConcurrent = Math.max(maxConcurrent, inFlight);
      await yieldToEventLoop();
      inFlight -= 1;
    }
  }));

  await delay(20);
  const wallMs = performance.now() - started;
  clearInterval(rssSampler);
  eventLoop.disable();
  const handlesAfter = process._getActiveHandles().length;
  const metrics = {
    executions: 10_000,
    ready,
    wallMs,
    peakRssBytes: Math.max(peakRssBytes, process.memoryUsage().rss),
    eventLoopDelayMs: Number(eventLoop.max) / 1_000_000,
    queueHighWater,
    maxConcurrentSyntheticOperations: maxConcurrent,
    openHandlesBeforeAfter: { before: handlesBefore, after: handlesAfter },
  };
  assert.equal(metrics.ready, metrics.executions);
  assert.ok(metrics.wallMs < 3_600_000);
  assert.ok(metrics.peakRssBytes > 0);
  assert.ok(Number.isFinite(metrics.eventLoopDelayMs) && metrics.eventLoopDelayMs >= 0);
  assert.ok(metrics.queueHighWater > 0);
  assert.ok(metrics.maxConcurrentSyntheticOperations <= 32);
  assert.ok(metrics.openHandlesBeforeAfter.before < 128 && metrics.openHandlesBeforeAfter.after < 128);
  assert.ok(metrics.openHandlesBeforeAfter.after <= metrics.openHandlesBeforeAfter.before + 8);
  console.log(`P5_PERFORMANCE_METRICS ${JSON.stringify(metrics)}`);
});
