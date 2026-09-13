#!/usr/bin/env node
import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, sortedUnique, validateJsonFile } from "../lib/policy.mjs";

const WINDOWS_RESERVED = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

export function validatePaths(paths, policy) {
  const normalized = new Map();
  const rootFiles = new Set(policy.rootFiles);
  const prefixes = policy.pathClasses.map(({ prefix }) => prefix);
  const forbiddenTop = new Set(policy.forbiddenTopLevel);
  const forbiddenSegments = new Set(policy.forbiddenTrackedSegments);

  for (const rawPath of paths) {
    assert(
      rawPath.length > 0 && !rawPath.startsWith("/") && !rawPath.includes("\\"),
      "PATH_NON_PORTABLE",
      `invalid repository path: ${rawPath}`,
    );
    const canonical = rawPath.normalize(policy.unicodeNormalization);
    assert(
      canonical === rawPath,
      "PATH_UNICODE_DRIFT",
      `path is not ${policy.unicodeNormalization}-normalized: ${rawPath}`,
    );
    const folded = canonical.toLocaleLowerCase("en-US");
    const collision = normalized.get(folded);
    assert(
      collision === undefined || collision === rawPath,
      "PATH_CASE_COLLISION",
      `case-insensitive collision: ${collision} and ${rawPath}`,
    );
    normalized.set(folded, rawPath);

    const segments = rawPath.split("/");
    for (const segment of segments) {
      assert(segment !== "" && segment !== "." && segment !== "..", "PATH_TRAVERSAL", `unsafe segment in ${rawPath}`);
      const containsControl = [...segment].some((character) => character.codePointAt(0) <= 0x1f);
      assert(
        !/[. ]$/.test(segment) && !containsControl && !WINDOWS_RESERVED.test(segment),
        "PATH_NON_PORTABLE",
        `non-portable segment ${segment} in ${rawPath}`,
      );
      assert(
        !forbiddenSegments.has(segment),
        "FORBIDDEN_SEGMENT",
        `forbidden generated/private segment ${segment} in ${rawPath}`,
      );
    }

    if (segments.length === 1) {
      assert(rootFiles.has(rawPath), "UNREGISTERED_ROOT_FILE", `root file is not allowlisted: ${rawPath}`);
    } else {
      assert(!forbiddenTop.has(segments[0]), "FORBIDDEN_TOP_LEVEL", `forbidden top-level directory: ${segments[0]}`);
      assert(
        prefixes.some((prefix) => rawPath.startsWith(prefix)),
        "UNOWNED_PATH",
        `path has no registered semantic owner: ${rawPath}`,
      );
    }
  }
  return { pathCount: paths.length, caseFoldedPathCount: normalized.size };
}

async function walkForSymlinks(directory, root) {
  const findings = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".cache" || entry.name === "dist")
      continue;
    const absolute = path.join(directory, entry.name);
    const stat = await lstat(absolute);
    if (stat.isSymbolicLink()) findings.push(path.relative(root, absolute).split(path.sep).join("/"));
    else if (stat.isDirectory()) findings.push(...(await walkForSymlinks(absolute, root)));
  }
  return findings;
}

const INVENTORY_EXCLUSIONS = new Set([
  ".agents",
  ".cache",
  ".codex",
  ".git",
  ".nyc_output",
  ".stryker-tmp",
  "coverage",
  "dist",
  "downloads",
  "node_modules",
  "tmp",
]);

async function repositoryPaths(directory, root = directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (INVENTORY_EXCLUSIONS.has(entry.name) || entry.name === ".DS_Store" || entry.name === "Thumbs.db") continue;
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (
      relative === "evidence/runs" ||
      relative.startsWith("evidence/runs/") ||
      relative === "evidence/tmp" ||
      relative.startsWith("evidence/tmp/")
    )
      continue;
    if (entry.isDirectory()) output.push(...(await repositoryPaths(absolute, root)));
    else if (
      entry.isFile() &&
      !entry.name.endsWith(".log") &&
      !entry.name.endsWith(".tgz") &&
      !entry.name.endsWith(".tsbuildinfo") &&
      !/\.pyc$/.test(entry.name)
    ) {
      output.push(relative);
    }
  }
  return output;
}

export async function checkTree(root) {
  const policy = await validateJsonFile(root, "config/repository/tree.json", "config/repository/tree.schema.json");
  const paths = sortedUnique(await repositoryPaths(root));
  const evidence = validatePaths(paths, policy);
  for (const required of policy.requiredDirectories) {
    const stat = await lstat(path.join(root, required)).catch(() => null);
    assert(stat?.isDirectory(), "MISSING_REQUIRED_DIRECTORY", `required directory is absent: ${required}`);
  }
  const symlinks = await walkForSymlinks(root, root);
  assert(
    policy.allowSymlinks || symlinks.length === 0,
    "SYMLINK_FORBIDDEN",
    `repository contains symlinks: ${symlinks.join(", ")}`,
  );
  return {
    policyId: policy.policyId,
    ...evidence,
    symlinkCount: symlinks.length,
    semanticOwners: policy.pathClasses.length,
  };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main("repository-tree", () => checkTree(root));
