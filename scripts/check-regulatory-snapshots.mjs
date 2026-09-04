// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { access, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { assertProjectRoot, projectRoot, readJson } from "./project.mjs";

await assertProjectRoot();
const manifest = await readJson(resolve(projectRoot, "regulatory/sources.json"));
const snapshot = resolve(projectRoot, "regulatory/snapshots", manifest.edition, "raw");
for (const artifact of manifest.artifacts ?? []) {
  const path = resolve(snapshot, artifact.file);
  if (!path.startsWith(`${snapshot}/`))
    throw new Error(`Unsafe snapshot filename: ${artifact.file}`);
  await access(path);
  const metadata = await stat(path);
  if (!metadata.isFile()) throw new Error(`Snapshot is not a regular file: ${artifact.file}`);
  const bytes = await readFile(path);
  if (bytes.length !== artifact.bytes) throw new Error(`Snapshot size mismatch: ${artifact.id}`);
  if (hash(bytes, "sha256") !== artifact.sha256 || hash(bytes, "sha512") !== artifact.sha512)
    throw new Error(`Snapshot digest mismatch: ${artifact.id}`);
}
console.log(`Regulatory snapshots passed: ${manifest.artifacts.length} artifacts.`);

function hash(bytes, algorithm) {
  return createHash(algorithm).update(bytes).digest("hex");
}
