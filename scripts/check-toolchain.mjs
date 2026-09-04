// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertProjectRoot, projectRoot, readJson } from "./project.mjs";
import { bundledNpmManifestPath } from "./toolchain-rules.mjs";
await assertProjectRoot();
const profile = process.argv[process.argv.indexOf("--profile") + 1];
const manifest = await readJson(resolve(projectRoot, "security/runtime-toolchain.json"));
const expected = manifest.profiles[profile];
if (expected === undefined) throw new Error(`Unknown runtime profile: ${profile}`);
const nodeVersion = (await readFile(resolve(projectRoot, ".node-version"), "utf8")).trim();
if (profile === "node-24-primary" && nodeVersion !== expected.node)
  throw new Error(".node-version mismatch");
if (process.versions.node !== expected.node)
  throw new Error(`Node ${expected.node} required; found ${process.versions.node}`);
const npmManifest = await readJson(bundledNpmManifestPath(process.execPath));
if (npmManifest.version !== expected.npm)
  throw new Error(`npm ${expected.npm} required; found ${npmManifest.version}`);
console.log(
  `Toolchain verified: Node ${process.versions.node}, npm ${npmManifest.version} (${profile}).`,
);
