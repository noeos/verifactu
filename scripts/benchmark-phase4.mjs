// SPDX-License-Identifier: Apache-2.0
import {
  calculateRrsifFingerprint,
  validateFingerprintInput,
} from "../packages/verifactu/dist/esm/index.js";
import { assertProjectRoot, projectRoot, readJson } from "./project.mjs";

await assertProjectRoot();
const scenario = await readJson(`${projectRoot}/benchmarks/scenarios/phase-4-domain.json`);
const input = {
  kind: "alta",
  issuerNif: "89890001K",
  invoiceNumber: "12345678/G33",
  issueDate: "01-01-2024",
  invoiceType: "F1",
  taxAmount: "12.35",
  totalAmount: "123.45",
  previous: { kind: "genesis" },
  generatedAt: "2024-01-01T19:20:30+01:00",
};
let guard = "";
run(scenario.warmupIterations);
const rates = [];
for (let sample = 0; sample < scenario.samples; sample += 1) {
  const started = process.hrtime.bigint();
  run(scenario.sampleIterations);
  const elapsed = Number(process.hrtime.bigint() - started) / 1_000_000_000;
  rates.push(scenario.sampleIterations / elapsed);
}
rates.sort((left, right) => left - right);
const minimum = rates[0];
const median = rates[Math.floor(rates.length / 2)];
if (minimum === undefined || median === undefined || minimum < scenario.minimumRecordsPerSecond)
  throw new Error(
    `Phase 4 performance budget failed: ${String(Math.floor(minimum ?? 0))} records/s.`,
  );
if (guard.length !== 64) throw new Error("Benchmark result was not consumed.");
console.log(
  JSON.stringify({
    scenario: scenario.id,
    minimumRecordsPerSecond: Math.floor(minimum),
    medianRecordsPerSecond: Math.floor(median),
    budgetRecordsPerSecond: scenario.minimumRecordsPerSecond,
  }),
);

function run(iterations) {
  for (let index = 0; index < iterations; index += 1) {
    const parsed = validateFingerprintInput(input);
    if (parsed.status !== "valid") throw new Error("Benchmark fixture rejected.");
    guard = calculateRrsifFingerprint(parsed.value).fingerprint.value;
  }
}
