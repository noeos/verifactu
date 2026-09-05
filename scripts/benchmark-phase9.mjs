// SPDX-License-Identifier: Apache-2.0

import { performance } from "node:perf_hooks";
import {
  calculateRrsifFingerprint,
  validateFingerprintInput,
} from "../packages/verifactu/dist/esm/index.js";
import { renderQr } from "../packages/verifactu/dist/esm/qr/index.js";

const iterations = Math.max(100, Number(process.env.NOEOS_BENCH_ITERATIONS ?? 2_000));
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
if (validated.status !== "valid") throw new Error("Benchmark fixture rejected");
for (let index = 0; index < 100; index += 1) calculateRrsifFingerprint(validated.value);
const start = performance.now();
for (let index = 0; index < iterations; index += 1) calculateRrsifFingerprint(validated.value);
const fingerprintMs = performance.now() - start;
const qrIterations =
  process.env.NOEOS_BENCH_OFFICIAL === "1"
    ? Math.min(iterations, 1_000)
    : Math.min(iterations, 100);
const qrStart = performance.now();
for (let index = 0; index < qrIterations; index += 1)
  renderQr({
    nif: "B12345678",
    invoiceNumber: "F-1",
    issueDate: "03-09-2026",
    total: "11.00",
    environment: "test",
  });
const qrMs = performance.now() - qrStart;
const result = {
  iterations,
  qrIterations,
  fingerprintPerSecond: Math.round(iterations / (fingerprintMs / 1_000)),
  qrPerSecond: Math.round(qrIterations / (qrMs / 1_000)),
  fingerprintMs: Number(fingerprintMs.toFixed(3)),
  qrMs: Number(qrMs.toFixed(3)),
  node: process.versions.node,
};
if (process.env.NOEOS_BENCH_OFFICIAL === "1" && result.fingerprintPerSecond < 10_000)
  throw new Error(`Fingerprint budget failed: ${result.fingerprintPerSecond}/s`);
console.log(JSON.stringify(result));
