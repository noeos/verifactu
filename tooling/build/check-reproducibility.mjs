#!/usr/bin/env node
import { cp, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, sha256 } from "../lib/policy.mjs";
import { buildPackages } from "./build-packages.mjs";
import { packPackages } from "./pack-packages.mjs";

async function outputDigestMap(workspace) {
  const output = {};
  const walk = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile()) {
        output[path.relative(workspace, absolute).split(path.sep).join("/")] = sha256(await readFile(absolute));
      }
    }
  };
  for (const packageName of ["adapter-kit", "cli", "verifactu"]) {
    await walk(path.join(workspace, "packages", packageName, "dist"));
  }
  await walk(path.join(workspace, ".cache/packages"));
  return Object.fromEntries(Object.entries(output).sort(([left], [right]) => left.localeCompare(right, "en")));
}

export function assertReproducible(first, second) {
  assert(
    JSON.stringify(first) === JSON.stringify(second),
    "NONREPRODUCIBLE_OUTPUT",
    "independent clean builds produced different raw digests",
    { first, second },
  );
}

async function prepareCopy(source, destination) {
  await cp(path.join(source, "packages"), path.join(destination, "packages"), {
    recursive: true,
    filter: (entry) => !entry.split(path.sep).includes("dist"),
  });
  await cp(path.join(source, "config/packages"), path.join(destination, "config/packages"), { recursive: true });
}

export async function checkReproducibility(root) {
  const temporaryRoot = process.env.TMPDIR;
  assert(temporaryRoot, "MISSING_CONTROLLED_TEMP", "TMPDIR must be provided by the canonical runner");
  const first = await mkdtemp(path.join(temporaryRoot, "repro-a-"));
  const second = await mkdtemp(path.join(temporaryRoot, "repro-b-"));
  try {
    await prepareCopy(root, first);
    await prepareCopy(root, second);
    await buildPackages(first);
    await packPackages(first, path.join(first, ".cache/packages"));
    await buildPackages(second);
    await packPackages(second, path.join(second, ".cache/packages"));
    const firstDigests = await outputDigestMap(first);
    const secondDigests = await outputDigestMap(second);
    assertReproducible(firstDigests, secondDigests);
    return { cleanBuildCount: 2, outputCount: Object.keys(firstDigests).length, rawDigests: firstDigests };
  } finally {
    await rm(first, { recursive: true, force: true });
    await rm(second, { recursive: true, force: true });
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main("package-reproducibility", () => checkReproducibility(root));
}
