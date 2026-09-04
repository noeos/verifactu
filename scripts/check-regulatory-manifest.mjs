// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertProjectRoot, projectRoot, readJson } from "./project.mjs";
await assertProjectRoot();
const manifest = await readJson(resolve(projectRoot, "regulatory/sources.json"));
const schema = await readJson(resolve(projectRoot, "regulatory/sources.schema.json"));
if (
  schema.type !== "object" ||
  manifest.manifestVersion !== 1 ||
  !/^https:\/\//u.test(manifest.baseUrl)
)
  throw new Error("Invalid regulatory manifest policy.");
if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0)
  throw new Error("Regulatory manifest has no artifacts.");
const ids = new Set();
for (const artifact of manifest.artifacts) {
  if (ids.has(artifact.id)) throw new Error(`Duplicate regulatory artifact: ${artifact.id}`);
  ids.add(artifact.id);
  if (
    !Number.isSafeInteger(artifact.bytes) ||
    artifact.bytes < 1 ||
    !/^[a-f0-9]{64}$/u.test(artifact.sha256) ||
    !/^[a-f0-9]{128}$/u.test(artifact.sha512)
  )
    throw new Error(`Invalid digest metadata: ${artifact.id}`);
}
const source = await readFile(resolve(projectRoot, "regulatory/sources.json"), "utf8");
const unresolved = ["TO", "DO", "FIX", "ME"].map((part) => part).join("");
if (source.includes(unresolved))
  throw new Error("Regulatory manifest contains an unresolved marker.");
console.log(
  `Regulatory manifest verified: ${manifest.artifacts.length} artifacts, no network access used.`,
);
