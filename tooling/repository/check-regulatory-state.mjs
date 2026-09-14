#!/usr/bin/env node
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main } from "../lib/policy.mjs";

export function validateRegulatoryFiles(editions, schemas) {
  assert(
    JSON.stringify(editions.sort()) === JSON.stringify(["README.md"]),
    "UNADMITTED_REGULATORY_EDITION",
    `P2 editions must contain only the boundary README; observed ${editions.join(", ")}`,
  );
  assert(
    JSON.stringify(schemas.sort()) === JSON.stringify(["README.md"]),
    "UNADMITTED_PUBLIC_SCHEMA",
    `P2 schemas must contain only the boundary README; observed ${schemas.join(", ")}`,
  );
}

export async function checkRegulatoryState(root) {
  const editions = await readdir(path.join(root, "editions"));
  const schemas = await readdir(path.join(root, "schemas"));
  validateRegulatoryFiles(editions, schemas);
  return { phase: "P2", regulatoryEditionCount: 0, publicGeneratedSchemaCount: 0, officialSourceImportEnabled: false };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main("regulatory-generated-state", () => checkRegulatoryState(root));
