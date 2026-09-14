#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, sha256, stableJson } from "../lib/policy.mjs";

export function validateGeneratedDocument(actual, expected) {
  assert(
    stableJson(actual) === stableJson(expected),
    "STALE_OR_HAND_EDITED_GENERATED",
    "checked-in generated toolchain summary does not equal generator output",
  );
}

export async function expectedToolchainSummary(root) {
  const sourceBytes = await readFile(path.join(root, "config/toolchain/profiles.json"));
  const source = JSON.parse(sourceBytes);
  return {
    schemaVersion: 1,
    generator: "tooling/generation/check-generated.mjs",
    source: "config/toolchain/profiles.json",
    sourceSha256: sha256(sourceBytes),
    profiles: Object.entries(source.profiles).map(([id, profile]) => ({
      id,
      node: profile.node,
      npm: profile.npm,
      status: profile.status,
    })),
  };
}

export async function checkGenerated(root) {
  const expected = await expectedToolchainSummary(root);
  const actual = JSON.parse(await readFile(path.join(root, "config/generated/toolchain-summary.json"), "utf8"));
  validateGeneratedDocument(actual, expected);
  return { generatedFileCount: 1, sourceSha256: expected.sourceSha256, byteIdenticalToGenerator: true };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main("checked-in-generated-files", () => checkGenerated(root));
}
