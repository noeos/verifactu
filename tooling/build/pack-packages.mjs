#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, sha256, validateJsonFile } from "../lib/policy.mjs";
import { createDeterministicTarGzip, parseTarGzip } from "./tar.mjs";

async function filesBelow(directory, root = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesBelow(absolute, root)));
    else if (entry.isFile()) files.push(path.relative(root, absolute).split(path.sep).join("/"));
  }
  return files.sort();
}

export function validateTarEntries(entries, contract) {
  const expected = contract.allowedFiles.map((file) => `package/${file}`).sort();
  const observed = entries.map(({ name }) => name).sort();
  assert(
    JSON.stringify(observed) === JSON.stringify(expected),
    "PACKAGE_CONTENT_LEAK",
    `${contract.name} expected ${expected.join(", ")}; observed ${observed.join(", ")}`,
  );
  for (const entry of entries) assert(entry.mode === 0o644, "PACKAGE_MODE_DRIFT", `${entry.name} must have mode 0644`);
  const manifestEntry = entries.find(({ name }) => name === "package/package.json");
  const manifest = JSON.parse(manifestEntry.bytes.toString("utf8"));
  assert(
    manifest.name === contract.name && manifest.private === true,
    "PACKED_MANIFEST_DRIFT",
    `${contract.name} packed manifest identity/publication state drifted`,
  );
  assert(
    manifest.scripts === undefined && manifest.bin === undefined,
    "PACKED_FAKE_CAPABILITY",
    `${contract.name} packed a script or binary during P2`,
  );
}

export async function packPackages(root, outputDirectory = path.join(root, ".cache/packages")) {
  const policy = await validateJsonFile(root, "config/packages/content.json", "config/packages/content.schema.json");
  await mkdir(outputDirectory, { recursive: true });
  const packed = [];
  for (const contract of policy.packages) {
    const packageRoot = path.join(root, contract.directory);
    const actual = (await filesBelow(packageRoot)).filter(
      (file) => !file.startsWith("src/") && !file.startsWith("test/") && file !== "tsconfig.json",
    );
    assert(
      JSON.stringify(actual) === JSON.stringify([...contract.allowedFiles].sort()),
      "PACKAGE_STAGING_DRIFT",
      `${contract.name} staged files differ from its closed allowlist`,
    );
    const files = [];
    for (const file of contract.allowedFiles)
      files.push({ name: `package/${file}`, bytes: await readFile(path.join(packageRoot, file)), mode: 0o644 });
    const tarball = createDeterministicTarGzip(files);
    const entries = parseTarGzip(tarball);
    validateTarEntries(entries, contract);
    const destination = path.join(outputDirectory, contract.tarball);
    await writeFile(destination, tarball, { mode: 0o600 });
    packed.push({
      name: contract.name,
      filename: contract.tarball,
      bytes: tarball.length,
      sha256: sha256(tarball),
      entryCount: entries.length,
    });
  }
  return { policyId: policy.policyId, packageCount: packed.length, packages: packed };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main("package-tarballs", () => packPackages(root));
