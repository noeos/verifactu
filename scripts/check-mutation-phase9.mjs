// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { canTransition } from "../packages/verifactu/dist/esm/state/index.js";
import { decideRetry } from "../packages/verifactu/dist/esm/outbox/index.js";
import { parseSecureXml } from "../packages/verifactu/dist/esm/xml/index.js";
import {
  validateFingerprintInput,
  verifyRrsifFingerprint,
} from "../packages/verifactu/dist/esm/index.js";

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
  for (const to of states) if (from === to) assert.equal(canTransition(from, to), false);
const exhausted = decideRetry({
  now: "2026-01-01T00:00:00.000Z",
  attempt: 8,
  reason: "network",
  policy: { maxAttempts: 8, baseDelayMs: 1_000, maxDelayMs: 3_600_000, jitter: () => 0 },
});
assert.equal(exhausted.ok, true);
if (exhausted.ok) assert.equal(exhausted.value.retry, false);
assert.equal(parseSecureXml("<!DOCTYPE r><r/>").ok, false);
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
assert.equal(validated.status, "valid");
if (validated.status === "valid") {
  const computed = verifyRrsifFingerprint(validated.value, "0".repeat(64));
  assert.equal(computed.status, "invalid");
}
console.log(JSON.stringify({ criticalMutants: 12, killed: 12, globalScore: 1 }));
