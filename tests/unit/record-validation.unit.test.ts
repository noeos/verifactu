// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import { validateBillingRecord } from "../../packages/verifactu/src/validation/record.js";

void test("validates an immutable alta against local AEAT business rules", () => {
  const result = validateBillingRecord(validAlta());
  assert.equal(result.status, "valid");
  assert.equal(result.value.kind, "alta");
  assert.equal(Object.isFrozen(result.value), true);
  assert.equal(Object.isFrozen(result.value.facts), true);
  assert.equal(result.value.evaluatedRuleIds.length, 9);
});

void test("reports every deterministic alta rule failure in stable order", () => {
  const input = validAlta();
  const result = validateBillingRecord({
    ...input,
    taxpayerNif: "B12345678",
    rectificationType: "substitution",
    rectificationAmounts: true,
    recipientCount: 0,
  });
  assert.equal(result.status, "invalid");
  assert.ok(result.diagnostics.length >= 3);
  assert.deepEqual(
    result.diagnostics.map((diagnostic) => diagnostic.ruleId),
    [...result.diagnostics.map((diagnostic) => diagnostic.ruleId)].sort(),
  );
});

void test("never guesses an external prior-record fact for an anulacion", () => {
  const result = validateBillingRecord({
    kind: "anulacion",
    fingerprint: {
      kind: "anulacion",
      issuerNif: "89890001K",
      invoiceNumber: "A-2",
      issueDate: "01-09-2026",
      previous: { kind: "genesis" },
      generatedAt: "2026-09-01T10:00:00+02:00",
    },
    taxpayerNif: "89890001K",
    generatedBy: "none",
    generatorDetails: false,
    priorRecord: "unknown",
    withoutPriorRecordFlag: false,
  });
  assert.equal(result.status, "indeterminate");
  assert.equal(result.diagnostics[0]?.code, "VF_RECORD_EXTERNAL_FACT_MISSING");
});

void test("honors cancellation before inspecting untrusted records", () => {
  const controller = new AbortController();
  controller.abort();
  const result = validateBillingRecord(
    Object.defineProperty({}, "kind", {
      get() {
        throw new Error("must not execute");
      },
    }),
    controller.signal,
  );
  assert.equal(result.status, "aborted");
});

function validAlta(): Record<string, unknown> {
  return {
    kind: "alta",
    fingerprint: {
      kind: "alta",
      issuerNif: "89890001K",
      invoiceNumber: "A-1",
      issueDate: "01-09-2026",
      invoiceType: "F1",
      taxAmount: "21.00",
      totalAmount: "121.00",
      previous: { kind: "genesis" },
      generatedAt: "2026-09-01T10:00:00+02:00",
    },
    taxpayerNif: "89890001K",
    currentDate: "04-09-2026",
    rectificationType: "none",
    correctedInvoices: false,
    substitutedInvoices: false,
    rectificationAmounts: false,
    operationDate: "01-09-2026",
    simplifiedFlag: false,
    unidentifiedRecipientFlag: false,
    macrodataFlag: false,
    issuedBy: "issuer",
    thirdPartyDetails: false,
    recipientCount: 1,
    taxKind: "01",
    regimeCode: "01",
  };
}
