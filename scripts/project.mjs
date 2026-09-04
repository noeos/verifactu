// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstat, readFile, readdir } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const excluded = new Set([
  ".build",
  ".git",
  ".npm",
  "artifacts",
  "coverage",
  "dist",
  "node_modules",
  "reports",
  "temp",
  "tmp",
]);

export async function assertProjectRoot() {
  const manifest = await readJson(resolve(projectRoot, "package.json"));
  if (manifest.name !== "@noeos/verifactu-workspace" || manifest.private !== true)
    throw new Error("Unsafe project root.");
}
export function digest(data, algorithm = "sha256") {
  return createHash(algorithm).update(data).digest("hex");
}
export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
export function stableJson(value) {
  return `${JSON.stringify(sortJson(value), null, 2)}\n`;
}
export function toPosix(path) {
  return relative(projectRoot, path).split(sep).join("/") || ".";
}
export function npmCliPath(environment = process.env) {
  const candidate = environment.npm_execpath;
  if (typeof candidate !== "string" || !candidate.endsWith("npm-cli.js"))
    throw new Error("Trusted npm CLI path required.");
  return candidate;
}
export function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: "inherit",
    ...options,
  });
}

export async function listRepositoryFiles(start = projectRoot) {
  const files = [];
  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      if (entry.isDirectory() && excluded.has(entry.name)) continue;
      const path = resolve(directory, entry.name);
      const metadata = await lstat(path);
      if (metadata.isSymbolicLink()) throw new Error(`Symlink forbidden: ${toPosix(path)}`);
      if (metadata.isDirectory()) await visit(path);
      else if (metadata.isFile()) files.push(path);
    }
  }
  await visit(start);
  return files;
}
function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, item]) => [key, sortJson(item)]),
    );
  return value;
}
