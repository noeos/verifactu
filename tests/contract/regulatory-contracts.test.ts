import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "node:test";

const root = process.cwd();

void test("the pinned regulatory edition has complete generated inventories", async () => {
  const output = await readFile(
    resolve(root, "contracts/editions/aeat-rrsif-1.0@2026-09-03/manifest.json"),
    "utf8",
  );
  const sourceMap = await readFile(
    resolve(root, "contracts/editions/aeat-rrsif-1.0@2026-09-03/source-map.json"),
    "utf8",
  );
  assert.match(output, /"declarations": 530/u);
  assert.match(output, /"operations": 6/u);
  assert.match(sourceMap, /"artifact": "AEAT-/u);
});

void test("official XML snapshots contain no forbidden external entity declarations", async () => {
  const manifest = await readFile(resolve(root, "regulatory/sources.json"), "utf8");
  assert.doesNotMatch(manifest, /<!DOCTYPE|<!ENTITY|<xi:include\b/u);
});
