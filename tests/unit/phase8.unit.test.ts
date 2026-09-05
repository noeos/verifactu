// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import { createVerifactu, VECTOR_SET } from "../../packages/verifactu/src/index.js";
import { runAdapterConformance } from "../../packages/adapter-kit/src/index.js";

void test("phase 8 exposes an immutable public facade and capabilities", () => {
  const result = createVerifactu({
    mode: "verifactu",
    taxpayerScopeId: "taxpayer",
    installationId: "one",
    sequenceId: "records",
  });
  assert.equal(result.ok, true);
  assert.equal(result.ok, true);
  assert.equal(result.value.edition.edition, "aeat-rrsif-1.0@2026-09-03");
  assert.equal(Object.isFrozen(result.value), true);
  const applicability = result.value.evaluateApplicability({
    usesBillingSystem: "yes",
    taxpayerCategory: "corporate-taxpayer",
    territory: "common",
    subjectToSii: "no",
    operationInScope: "yes",
    hasNonApplicationResolution: "no",
  });
  assert.equal(applicability.ok, true);
});

void test("phase 8 rejects unsupported editions and kit identifies scenarios", async () => {
  const invalid = createVerifactu({
    // Runtime boundary test intentionally bypasses the compile-time EditionId union.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    edition: "unknown" as never,
    mode: "verifactu",
    taxpayerScopeId: "taxpayer",
    installationId: "one",
    sequenceId: "records",
  });
  assert.equal(invalid.ok, false);
  const report = await runAdapterConformance({ name: "fixture", version: "1.0.0" });
  assert.equal(report.ok, true);
  assert.equal(VECTOR_SET.files.length, 2);
});
