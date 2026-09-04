// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateApplicability } from "../../packages/verifactu/src/domain/applicability.js";
import {
  AeatDate,
  AeatDateTime,
  DecimalLexeme,
} from "../../packages/verifactu/src/domain/values.js";
import {
  buildRrsifPreimage,
  calculateRrsifFingerprint,
  validateFingerprintInput,
  verifyRrsifFingerprint,
} from "../../packages/verifactu/src/fingerprint/rrsif.js";

const FIRST = "3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60";
const SECOND = "F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97";
const THIRD = "177547C0D57AC74748561D054A9CEC14B4C4EA23D1BEFD6F2E69E3A388F90C68";

void test("reproduces all three official AEAT fingerprint vectors", () => {
  const first = requiredFingerprintInput({
    kind: "alta",
    issuerNif: "89890001K",
    invoiceNumber: "12345678/G33",
    issueDate: "01-01-2024",
    invoiceType: "F1",
    taxAmount: "12.35",
    totalAmount: "123.45",
    previous: { kind: "genesis" },
    generatedAt: "2024-01-01T19:20:30+01:00",
  });
  assert.equal(calculateRrsifFingerprint(first).fingerprint.value, FIRST);
  assert.equal(
    buildRrsifPreimage(first),
    "IDEmisorFactura=89890001K&NumSerieFactura=12345678/G33&FechaExpedicionFactura=01-01-2024&TipoFactura=F1&CuotaTotal=12.35&ImporteTotal=123.45&Huella=&FechaHoraHusoGenRegistro=2024-01-01T19:20:30+01:00",
  );

  const second = requiredFingerprintInput({
    kind: "alta",
    issuerNif: "89890001K",
    invoiceNumber: "12345679/G34",
    issueDate: "01-01-2024",
    invoiceType: "F1",
    taxAmount: "12.35",
    totalAmount: "123.45",
    previous: { kind: "previous", fingerprint: FIRST },
    generatedAt: "2024-01-01T19:20:35+01:00",
  });
  assert.equal(calculateRrsifFingerprint(second).fingerprint.value, SECOND);

  const third = requiredFingerprintInput({
    kind: "anulacion",
    issuerNif: "89890001K",
    invoiceNumber: "12345679/G34",
    issueDate: "01-01-2024",
    previous: { kind: "previous", fingerprint: SECOND },
    generatedAt: "2024-01-01T19:20:40+01:00",
  });
  assert.equal(calculateRrsifFingerprint(third).fingerprint.value, THIRD);
  assert.equal(verifyRrsifFingerprint(third, THIRD).status, "valid");
  assert.equal(verifyRrsifFingerprint(third, FIRST).status, "invalid");
  assert.equal(verifyRrsifFingerprint(third, THIRD.toLowerCase()).status, "invalid");
});

void test("preserves the emitted decimal lexeme in the preimage", () => {
  const oneDecimal = requiredFingerprintInput(altaWithAmounts("123.1", "123.1"));
  const twoDecimals = requiredFingerprintInput(altaWithAmounts("123.10", "123.10"));
  assert.notEqual(buildRrsifPreimage(oneDecimal), buildRrsifPreimage(twoDecimals));
  assert.notEqual(
    calculateRrsifFingerprint(oneDecimal).fingerprint.value,
    calculateRrsifFingerprint(twoDecimals).fingerprint.value,
  );
});

void test("validates Gregorian dates, offsets and exact decimals", () => {
  assert.ok(AeatDate.parse("29-02-2024"));
  assert.equal(AeatDate.parse("29-02-2023"), undefined);
  assert.ok(AeatDateTime.parse("2024-02-29T23:59:59+14:00"));
  assert.equal(AeatDateTime.parse("2024-02-29T23:59:60+01:00"), undefined);
  assert.ok(DecimalLexeme.parse("999999999999.99"));
  assert.equal(DecimalLexeme.parse("1e2"), undefined);
  assert.equal(DecimalLexeme.parse("1.000"), undefined);
  assert.equal(DecimalLexeme.parse("+1.00"), undefined);
});

void test("applicability is trivalent and never assumes missing facts", () => {
  const applicable = evaluateApplicability({
    usesBillingSystem: "yes",
    taxpayerCategory: "corporate-taxpayer",
    territory: "common",
    subjectToSii: "no",
    operationInScope: "yes",
    hasNonApplicationResolution: "no",
  });
  assert.equal(applicable.status, "valid");
  assert.equal(applicable.value.status, "applicable");

  const excluded = evaluateApplicability({
    usesBillingSystem: "yes",
    taxpayerCategory: "corporate-taxpayer",
    territory: "common",
    subjectToSii: "yes",
    operationInScope: "yes",
    hasNonApplicationResolution: "no",
  });
  assert.equal(excluded.status, "valid");
  assert.equal(excluded.value.status, "notApplicable");

  const unknown = evaluateApplicability({
    usesBillingSystem: "unknown",
    taxpayerCategory: "unknown",
    territory: "unknown",
    subjectToSii: "unknown",
    operationInScope: "unknown",
    hasNonApplicationResolution: "unknown",
  });
  assert.equal(unknown.status, "valid");
  assert.equal(unknown.value.status, "indeterminate");
  assert.equal(unknown.value.missingFacts.length, 6);
});

function requiredFingerprintInput(input: unknown) {
  const result = validateFingerprintInput(input);
  assert.equal(result.status, "valid");
  return result.value;
}

function altaWithAmounts(taxAmount: string, totalAmount: string): unknown {
  return {
    kind: "alta",
    issuerNif: "89890001K",
    invoiceNumber: "A-1",
    issueDate: "01-01-2024",
    invoiceType: "F1",
    taxAmount,
    totalAmount,
    previous: { kind: "genesis" },
    generatedAt: "2024-01-01T19:20:30+01:00",
  };
}
