// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "node:test";
const root = process.cwd();
void test("contract metadata is exposed without implicit I/O", async () => {
  const imported: unknown = await import(
    `file://${resolve(root, "packages/verifactu/dist/esm/index.js")}`
  );
  assert.ok(typeof imported === "object" && imported !== null);
  assert.deepEqual(Object.keys(imported).sort(), ["editionInfo", "getEdition", "listEditions"]);
  const getEdition: unknown = Reflect.get(imported, "getEdition");
  const listEditions: unknown = Reflect.get(imported, "listEditions");
  assert.equal(typeof getEdition, "function");
  assert.equal(typeof listEditions, "function");
  if (typeof getEdition === "function" && typeof listEditions === "function") {
    const editionResult: unknown = Reflect.apply(getEdition, undefined, []);
    Reflect.apply(getEdition, undefined, ["aeat-rrsif-1.0@2026-09-03"]);
    Reflect.apply(getEdition, undefined, ["unknown-edition"]);
    const editionsResult: unknown = Reflect.apply(listEditions, undefined, []);
    assert.equal(typeof editionResult, "object");
    assert.equal(Array.isArray(editionsResult), true);
    if (Array.isArray(editionsResult)) assert.equal(editionsResult.length, 1);
  }
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
