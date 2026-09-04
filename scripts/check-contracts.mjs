// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertProjectRoot, projectRoot, readJson, stableJson } from "./project.mjs";

await assertProjectRoot();
const manifest = await readJson(resolve(projectRoot, "regulatory/sources.json"));
const directory = resolve(projectRoot, "contracts/editions", manifest.edition);
const checksums = await readJson(resolve(directory, "checksums.json"));
if (checksums.edition !== manifest.edition || checksums.schemaVersion !== 1)
  throw new Error("Contract checksum metadata is invalid.");
for (const file of checksums.files ?? []) {
  const bytes = await readFile(resolve(directory, file.file));
  if (
    bytes.length !== file.bytes ||
    hash(bytes, "sha256") !== file.sha256 ||
    hash(bytes, "sha512") !== file.sha512
  )
    throw new Error(`Generated contract digest mismatch: ${file.file}`);
}
const sourceManifest = await readJson(resolve(directory, "manifest.json"));
if (sourceManifest.sourceDigest !== hash(Buffer.from(stableJson(manifest)), "sha256"))
  throw new Error("Generated contracts are based on a different regulatory manifest.");
const map = await readJson(resolve(directory, "source-map.json"));
const ids = new Set();
for (const entry of map.entries ?? []) {
  if (ids.has(entry.id)) throw new Error(`Duplicate generated contract ID: ${entry.id}`);
  ids.add(entry.id);
  if (!entry.artifact || !entry.locator)
    throw new Error(`Untraceable generated contract: ${entry.id}`);
}
console.log(
  `Generated contracts verified: ${manifest.edition}, ${ids.size} traceable declarations.`,
);

function hash(bytes, algorithm) {
  return createHash(algorithm).update(bytes).digest("hex");
}
