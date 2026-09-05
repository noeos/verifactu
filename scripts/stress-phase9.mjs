// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  calculateRrsifFingerprint,
  validateFingerprintInput,
} from "../packages/verifactu/dist/esm/index.js";

const count = Math.min(
  10_000_000,
  Math.max(1_000, Number(process.env.NOEOS_STRESS_COUNT ?? 100_000)),
);
const fixture = {
  kind: "alta",
  issuerNif: "B12345678",
  invoiceNumber: "F-1",
  issueDate: "03-09-2026",
  invoiceType: "F1",
  taxAmount: "1.00",
  totalAmount: "11.00",
  previous: { kind: "genesis" },
  generatedAt: "2026-09-03T10:00:00+02:00",
};
const validated = validateFingerprintInput(fixture);
if (validated.status !== "valid") throw new Error("Stress fixture rejected");
const before = process.memoryUsage();
const start = performance.now();
for (let index = 0; index < count; index += 1) calculateRrsifFingerprint(validated.value);
const after = process.memoryUsage();
assert.equal(after.rss >= before.rss, true);
console.log(
  JSON.stringify({
    count,
    elapsedMs: Number((performance.now() - start).toFixed(3)),
    rssDelta: after.rss - before.rss,
    heapDelta: after.heapUsed - before.heapUsed,
  }),
);
