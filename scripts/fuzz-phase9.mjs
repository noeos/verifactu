// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { parseJsonDocument } from "../packages/cli/dist/esm/io/json-input.js";
import {
  calculateRrsifFingerprint,
  validateFingerprintInput,
  parseSecureXml,
  renderQr,
} from "../packages/verifactu/dist/esm/index.js";

const durationMs = Math.min(
  3_600_000,
  Math.max(1_000, Number(process.env.NOEOS_FUZZ_MS ?? 15_000)),
);
const seed = process.env.NOEOS_FUZZ_SEED ?? "verifactu-phase9";
const limits = Object.freeze({
  maxBytes: 16 * 1024,
  maxDepth: 32,
  maxProperties: 256,
  maxArray: 256,
});
let state = hashSeed(seed);
let iterations = 0;
const started = performance.now();
while (performance.now() - started < durationMs) {
  const text = fuzzJson(nextRandom());
  try {
    parseJsonDocument(text, limits);
  } catch {
    // Invalid input is an expected result; hangs and unexpected process failures are not.
  }
  const xml = `<r><v>${escapeXml(text.slice(0, 96))}</v></r>`;
  const parsedXml = parseSecureXml(xml);
  assert.equal(parsedXml.ok, true);
  const candidate = {
    nif: "B12345678",
    invoiceNumber: `F-${String(nextRandom() % 1000)}`,
    issueDate: "03-09-2026",
    total: "10.00",
    environment: "test",
  };
  const qr = renderQr(candidate);
  assert.equal(qr.ok, true);
  const fingerprint = validateFingerprintInput(fingerprintFixture());
  assert.equal(fingerprint.status, "valid");
  if (fingerprint.status === "valid")
    assert.equal(calculateRrsifFingerprint(fingerprint.value).fingerprint.value.length, 64);
  iterations += 1;
}
console.log(
  JSON.stringify({
    seed,
    durationMs,
    iterations,
    elapsedMs: Number((performance.now() - started).toFixed(3)),
  }),
);

function nextRandom() {
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return state >>> 0;
}
function hashSeed(value) {
  return [...value].reduce((acc, char) => (acc * 33 + (char.codePointAt(0) ?? 0)) >>> 0, 5381) || 1;
}
function fuzzJson(value) {
  const variant = value % 6;
  if (variant === 0) return `{"a":${String(value % 100)},"a":${String((value >>> 3) % 100)}}`;
  if (variant === 1) return `[${String(value)},true,null,"${value.toString(16)}"]`;
  if (variant === 2) return `{"nested":{"value":${JSON.stringify(String(value))}}}`;
  if (variant === 3) return `{"number":${String(value)}e999}`;
  if (variant === 4) return '{"unterminated":';
  return JSON.stringify({ value, seed });
}
function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function fingerprintFixture() {
  return {
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
}
