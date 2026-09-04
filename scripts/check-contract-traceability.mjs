// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertProjectRoot, projectRoot, readJson } from "./project.mjs";

await assertProjectRoot();
const manifest = await readJson(resolve(projectRoot, "regulatory/sources.json"));
const directory = resolve(projectRoot, "contracts/editions", manifest.edition);
const map = await readJson(resolve(directory, "source-map.json"));
const mapped = new Set((map.entries ?? []).map((entry) => entry.artifact));
for (const artifact of manifest.artifacts ?? []) {
  const path = resolve(projectRoot, "regulatory/snapshots", manifest.edition, "raw", artifact.file);
  await readFile(path);
  if ((artifact.kind === "xsd" || artifact.kind === "wsdl") && !mapped.has(artifact.id))
    throw new Error(`Contract source is not mapped: ${artifact.id}`);
  if (
    (artifact.kind === "xsd" || artifact.kind === "wsdl") &&
    (!Array.isArray(artifact.requirements) || artifact.requirements.length === 0)
  )
    throw new Error(`Contract source has no requirement mapping: ${artifact.id}`);
}
console.log(`Contract traceability passed: ${manifest.artifacts.length} sources evaluated.`);
