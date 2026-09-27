import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageManifest = new URL(
  "../../packages/verifactu/package.json",
  import.meta.url,
);

test("P4 public root exports no private implementation paths", async () => {
  const manifest = JSON.parse(await readFile(packageManifest, "utf8"));
  assert.deepEqual(Object.keys(manifest.exports), ["."]);
  assert.equal(manifest.exports["./internal"], undefined);
  assert.equal(manifest.exports["./editions"], undefined);
  assert.equal(manifest.private, true);
});
