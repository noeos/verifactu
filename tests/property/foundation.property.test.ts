// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import { digest, stableJson } from "../../scripts/project.mjs";
void test("stable serialization is idempotent for JSON values", () => {
  fc.assert(
    fc.property(fc.jsonValue(), (value) => {
      const first = stableJson(value);
      assert.equal(stableJson(JSON.parse(first)), first);
      assert.equal(digest(first), digest(stableJson(JSON.parse(first))));
    }),
    { numRuns: 500 },
  );
});
