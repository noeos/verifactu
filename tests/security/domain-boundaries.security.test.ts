// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateApplicability } from "../../packages/verifactu/src/domain/applicability.js";
import { validateFingerprintInput } from "../../packages/verifactu/src/fingerprint/rrsif.js";
import { inspectJsonLike } from "../../packages/verifactu/src/validation/object-inspection.js";

void test("hostile getters and proxies are rejected without execution", () => {
  let executions = 0;
  const getter = Object.defineProperty({}, "kind", {
    enumerable: true,
    get() {
      executions += 1;
      return "alta";
    },
  });
  assert.equal(validateFingerprintInput(getter).status, "invalid");
  assert.equal(executions, 0);

  const proxy = new Proxy(
    { kind: "alta" },
    {
      get: () => {
        throw new Error("executed");
      },
    },
  );
  assert.equal(validateFingerprintInput(proxy).status, "invalid");
  assert.equal(executions, 0);
});

void test("cycles, symbols, sparse arrays and resource limits fail closed", () => {
  const cyclic: { self?: unknown } = {};
  cyclic.self = cyclic;
  assert.equal(inspectJsonLike(cyclic).ok, false);
  assert.equal(inspectJsonLike({ [Symbol("secret")]: true }).ok, false);
  assert.equal(inspectJsonLike(new Array(2)).ok, false);
  assert.equal(
    inspectJsonLike([1, 2], { maxDepth: 3, maxNodes: 1, maxArrayElements: 2, maxStringBytes: 8 })
      .ok,
    false,
  );
});

void test("abort and unknown properties cannot produce favorable applicability", () => {
  const controller = new AbortController();
  controller.abort();
  assert.equal(evaluateApplicability({}, controller.signal).status, "indeterminate");
  assert.equal(
    evaluateApplicability({
      usesBillingSystem: "yes",
      taxpayerCategory: "corporate-taxpayer",
      territory: "common",
      subjectToSii: "no",
      operationInScope: "yes",
      hasNonApplicationResolution: "no",
      permissive: true,
    }).status,
    "indeterminate",
  );
});
