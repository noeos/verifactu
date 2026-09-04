// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "node:test";
const root = process.cwd();
void test("foundation packages expose no product API", async () => {
  const imported: unknown = await import(
    `file://${resolve(root, "packages/verifactu/dist/esm/index.js")}`
  );
  assert.ok(typeof imported === "object" && imported !== null);
  assert.deepEqual(Object.keys(imported), []);
  await import(`file://${resolve(root, "packages/cli/dist/esm/main.js")}`);
});
void test("foundation source cannot perform implicit I/O", async () => {
  for (const path of ["packages/verifactu/src/index.ts", "packages/cli/src/main.ts"]) {
    const source = await readFile(resolve(root, path), "utf8");
    assert.doesNotMatch(
      source,
      /node:(?:fs|net|http|https|tls|child_process)|console\.|process\./u,
    );
  }
});
