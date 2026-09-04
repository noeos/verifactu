// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import { evaluateApplicability } from "../../packages/verifactu/src/domain/applicability.js";
import { createInternalRecordEvidence } from "../../packages/verifactu/src/evidence/record-profile.js";
import { validateFingerprintInput } from "../../packages/verifactu/src/fingerprint/rrsif.js";
import { validateBillingRecord } from "../../packages/verifactu/src/validation/record.js";
import { validateBreakdownTotals } from "../../packages/verifactu/src/validation/totals.js";

void test("phase 4 public boundaries never throw for arbitrary JSON-like input", () => {
  fc.assert(
    fc.property(fc.jsonValue(), (value) => {
      for (const operation of [
        validateFingerprintInput,
        validateBillingRecord,
        validateBreakdownTotals,
        evaluateApplicability,
        createInternalRecordEvidence,
      ]) {
        assert.doesNotThrow(() => operation(value));
      }
    }),
    { numRuns: 2_000, seed: 2_026_090_4 },
  );
});
