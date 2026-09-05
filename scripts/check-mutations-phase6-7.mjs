// SPDX-License-Identifier: Apache-2.0
import { canTransition } from "../packages/verifactu/dist/esm/state/index.js";
import { decideRetry } from "../packages/verifactu/dist/esm/outbox/index.js";
import { listAeatEndpoints } from "../packages/verifactu/dist/esm/transport/index.js";

const states = [
  "prepared",
  "secured",
  "persisted",
  "queued",
  "submitting",
  "accepted",
  "accepted-with-errors",
  "rejected",
  "retryable",
  "correction-required",
  "cancelled",
  "indeterminate",
];
for (const from of states)
  for (const to of states) {
    if (from === to && canTransition(from, to)) throw new Error(`Self-transition escaped: ${from}`);
  }
const exhausted = decideRetry({
  now: "2026-01-01T00:00:00.000Z",
  attempt: 8,
  reason: "network",
  policy: { maxAttempts: 8, baseDelayMs: 1_000, maxDelayMs: 3_600_000, jitter: () => 0 },
});
if (!exhausted.ok || exhausted.value.retry) throw new Error("Retry exhaustion boundary failed");
const invalidJitter = decideRetry({
  now: "2026-01-01T00:00:00.000Z",
  attempt: 0,
  reason: "network",
  policy: { maxAttempts: 1, baseDelayMs: 1_000, maxDelayMs: 3_600_000, jitter: () => 2 },
});
if (invalidJitter.ok) throw new Error("Invalid jitter was accepted");
for (const endpoint of listAeatEndpoints()) {
  if (!endpoint.url.startsWith("https://") || endpoint.soapAction !== "RegFactuSistemaFacturacion")
    throw new Error(`Endpoint allowlist invariant failed: ${endpoint.id}`);
}
console.log("Phase 6/7 mutation boundary checks passed.");
