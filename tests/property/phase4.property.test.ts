// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import {
  buildRrsifPreimage,
  calculateRrsifFingerprint,
  validateFingerprintInput,
} from "../../packages/verifactu/src/fingerprint/rrsif.js";

void test("fingerprinting is deterministic for every accepted generated alta", () => {
  fc.assert(
    fc.property(
      fc.stringMatching(/^[A-Z0-9]{9}$/u),
      fc.stringMatching(/^[A-Z0-9][A-Z0-9._/-]{0,30}$/u),
      fc.integer({ min: -999_999, max: 999_999 }),
      (issuerNif, invoiceNumber, amount) => {
        const decimal = `${String(amount)}.00`;
        const parsed = validateFingerprintInput({
          kind: "alta",
          issuerNif,
          invoiceNumber,
          issueDate: "01-01-2026",
          invoiceType: "F1",
          taxAmount: decimal,
          totalAmount: decimal,
          previous: { kind: "genesis" },
          generatedAt: "2026-01-01T00:00:00Z",
        });
        assert.equal(parsed.status, "valid");
        assert.equal(
          calculateRrsifFingerprint(parsed.value).fingerprint.value,
          calculateRrsifFingerprint(parsed.value).fingerprint.value,
        );
        assert.equal(Buffer.from(buildRrsifPreimage(parsed.value), "utf8").includes(0), false);
      },
    ),
    { numRuns: 1_000, seed: 2_026_090_4 },
  );
});

void test("changing each committed official field changes the alta fingerprint", () => {
  const base = {
    kind: "alta",
    issuerNif: "89890001K",
    invoiceNumber: "A-1",
    issueDate: "01-01-2026",
    invoiceType: "F1",
    taxAmount: "21.00",
    totalAmount: "121.00",
    previous: { kind: "genesis" },
    generatedAt: "2026-01-01T00:00:00Z",
  };
  const variants = [
    { ...base, issuerNif: "89890002E" },
    { ...base, invoiceNumber: "A-2" },
    { ...base, issueDate: "02-01-2026" },
    { ...base, invoiceType: "F2" },
    { ...base, taxAmount: "22.00" },
    { ...base, totalAmount: "122.00" },
    {
      ...base,
      previous: {
        kind: "previous",
        fingerprint: "3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60",
      },
    },
    { ...base, generatedAt: "2026-01-01T00:00:01Z" },
  ];
  const original = fingerprint(base);
  for (const variant of variants) assert.notEqual(fingerprint(variant), original);
});

function fingerprint(input: unknown): string {
  const parsed = validateFingerprintInput(input);
  assert.equal(parsed.status, "valid");
  return calculateRrsifFingerprint(parsed.value).fingerprint.value;
}
