// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { digest, stableJson } from "../../scripts/project.mjs";

void test("stable JSON sorts object keys without reordering arrays", () => {
  assert.equal(
    stableJson({ z: { b: 2, a: 1 }, a: [{ d: 4, c: 3 }] }),
    '{\n  "a": [\n    {\n      "c": 3,\n      "d": 4\n    }\n  ],\n  "z": {\n    "a": 1,\n    "b": 2\n  }\n}\n',
  );
});
void test("SHA-256 digest is deterministic lowercase hexadecimal", () => {
  assert.equal(digest("noeos"), "eed22dada0a03d48dae0a261a5bd5835f836aec861e2b1338a71ebdde1145366");
});
