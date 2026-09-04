// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import { validateBreakdownTotals } from "../../packages/verifactu/src/validation/totals.js";

void test("checks AEAT tax and invoice totals with the official ten-euro tolerance", () => {
  const exact = validateBreakdownTotals(totals("21.00", "121.00"));
  assert.equal(exact.status, "valid");
  assert.equal(exact.diagnostics.length, 0);

  const boundary = validateBreakdownTotals(totals("31.00", "131.00"));
  assert.equal(boundary.status, "valid");
  assert.equal(boundary.diagnostics.length, 0);

  const outside = validateBreakdownTotals(totals("31.01", "131.01"));
  assert.equal(outside.status, "valid");
  assert.deepEqual(
    outside.diagnostics.map((diagnostic) => diagnostic.code),
    ["VF_RECORD_TOTAL_MISMATCH", "VF_RECORD_TOTAL_MISMATCH"],
  );
});

void test("reports the explicit AEAT exemptions instead of silently skipping totals", () => {
  const result = validateBreakdownTotals({
    taxAmount: "0",
    totalAmount: "0",
    lines: [
      {
        baseAmount: "100.00",
        taxAmount: "21.00",
        surchargeAmount: "0",
        regimeCode: "08",
      },
    ],
  });
  assert.equal(result.status, "valid");
  assert.equal(result.diagnostics[0]?.code, "VF_RECORD_TOTAL_CHECK_NOT_APPLICABLE");
});

void test("rejects accessors in breakdown arrays without executing them", () => {
  let executed = false;
  const lines: unknown[] = [];
  Object.defineProperty(lines, "0", {
    get() {
      executed = true;
      return {};
    },
  });
  lines.length = 1;
  const result = validateBreakdownTotals({ taxAmount: "0", totalAmount: "0", lines });
  assert.equal(result.status, "invalid");
  assert.equal(executed, false);
});

function totals(taxAmount: string, totalAmount: string): Record<string, unknown> {
  return {
    taxAmount,
    totalAmount,
    lines: [
      {
        baseAmount: "100.00",
        taxAmount: "21.00",
        surchargeAmount: "0",
        regimeCode: "01",
      },
    ],
  };
}
