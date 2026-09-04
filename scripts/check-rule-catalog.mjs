// SPDX-License-Identifier: Apache-2.0
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { assertProjectRoot, projectRoot, readJson } from "./project.mjs";

await assertProjectRoot();
const catalog = await readJson(resolve(projectRoot, "regulatory/rules/aeat-1.2.2.json"));
if (catalog.edition !== "aeat-rrsif-1.0@2026-09-03" || catalog.source?.revision !== "1.2.2")
  throw new Error("Rule catalog edition or source revision is invalid.");
const identifiers = new Set();
for (const rule of catalog.rules ?? []) {
  if (!/^VAL-AEAT-[A-Z0-9.-]+$/u.test(rule.id) || identifiers.has(rule.id))
    throw new Error(`Invalid or duplicate rule ID: ${rule.id}`);
  identifiers.add(rule.id);
  if (rule.classification !== "implemented" && rule.classification !== "implemented-indeterminate")
    throw new Error(`Unresolved rule classification: ${rule.id}`);
  if (!/^REG-[0-9]{3}$/u.test(rule.requirement) || !rule.locator)
    throw new Error(`Untraceable rule: ${rule.id}`);
  await access(safeRepositoryFile(rule.implementation));
  if (!Array.isArray(rule.tests) || rule.tests.length === 0)
    throw new Error(`Rule has no tests: ${rule.id}`);
  for (const test of rule.tests) await access(safeRepositoryFile(test));
  if (rule.classification === "implemented-indeterminate" && !rule.externalFact)
    throw new Error(`Indeterminate rule has no external fact: ${rule.id}`);
}
if (identifiers.size < 15) throw new Error("Rule catalog is unexpectedly incomplete.");
console.log(`Rule catalog passed: ${identifiers.size} traced rules, no unresolved classification.`);

function safeRepositoryFile(relative) {
  if (typeof relative !== "string" || relative.startsWith("/") || relative.includes(".."))
    throw new Error(`Unsafe catalog path: ${String(relative)}`);
  const path = resolve(projectRoot, relative);
  if (!path.startsWith(`${projectRoot}/`)) throw new Error(`Unsafe catalog path: ${relative}`);
  return path;
}
