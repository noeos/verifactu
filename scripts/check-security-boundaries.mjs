// SPDX-License-Identifier: Apache-2.0

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const files = await listSourceFiles("packages");
files.push(...(await listSourceFiles("scripts")));
const forbidden = [
  { pattern: /\beval\s*\(/u, name: "eval" },
  { pattern: /new\s+Function\s*\(/u, name: "dynamic Function" },
  { pattern: /child_process\.(?:exec|execSync|spawn|spawnSync)\b/u, name: "shell execution" },
];
for (const file of files) {
  const source = await readFile(file, "utf8");
  for (const item of forbidden)
    if (item.pattern.test(source)) throw new Error(`${item.name} boundary violation in ${file}`);
}
const xml = await readFile("packages/verifactu/src/xml/codec.ts", "utf8");
if (!xml.includes("<!DOCTYPE") || !xml.includes("<!ENTITY") || !xml.includes("CDATA"))
  throw new Error("XML hardening checks are missing");
const endpoints = await readFile("packages/verifactu/src/transport/endpoints.ts", "utf8");
if (!endpoints.includes('"https://')) throw new Error("HTTPS endpoint allowlist missing");
const output = await readFile("packages/cli/src/io/output.ts", "utf8");
if (!output.includes("0o600") || !output.includes("rename("))
  throw new Error("Atomic restrictive output boundary missing");
console.log(
  JSON.stringify({
    status: "passed",
    files: files.length,
    checks: ["no-dynamic-code", "xml-xxe", "https-allowlist", "atomic-output"],
  }),
);

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listSourceFiles(path)));
    else if (/\.(?:mjs|ts|js)$/u.test(entry.name)) files.push(path);
  }
  return files;
}
