import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "node:test";

const root = process.cwd();

void test("regulatory source snapshots use a flat safe filename namespace", async () => {
  const edition = "aeat-rrsif-1.0@2026-09-03";
  const entries = await readdir(resolve(root, "regulatory/snapshots", edition, "raw"), {
    withFileTypes: true,
  });
  assert.ok(entries.length > 0);
  for (const entry of entries) {
    assert.equal(entry.isFile(), true);
    assert.match(entry.name, /^[A-Za-z0-9._-]+$/u);
    assert.equal(entry.name.includes(".."), false);
  }
});
