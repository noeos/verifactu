#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";
import { assert, main, readJson, sortedUnique, validateJsonFile } from "../lib/policy.mjs";

function dependencyCoordinates(manifest) {
  return Object.entries(manifest.dependencies ?? {})
    .map(([name, version]) => `${name}@${version}`)
    .sort();
}

export function exportedBindings(source, file) {
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  let count = 0;
  for (const statement of parsed.statements) {
    if (ts.isExportAssignment(statement)) count += 1;
    if (statement.modifiers?.some(({ kind }) => kind === ts.SyntaxKind.ExportKeyword)) {
      if (statement.name || ts.isVariableStatement(statement)) count += 1;
    }
    if (ts.isExportDeclaration(statement))
      count +=
        statement.exportClause && ts.isNamedExports(statement.exportClause)
          ? statement.exportClause.elements.length
          : 1;
  }
  return count;
}

export function validateP2Manifest(manifest, contract, policy, source, sourceName = contract.directory) {
  assert(manifest.name === contract.name, "PACKAGE_NAME_DRIFT", `${contract.directory} has unexpected name`);
  assert(
    manifest.version === policy.workspaceVersion && manifest.private === true,
    "PACKAGE_PUBLICATION_UNSAFE",
    `${contract.name} must remain private at ${policy.workspaceVersion}`,
  );
  assert(
    manifest.license === "UNLICENSED",
    "PACKAGE_LICENSE_DRIFT",
    `${contract.name} must remain UNLICENSED before P8`,
  );
  assert(
    manifest.scripts === undefined && manifest.bin === undefined,
    "FAKE_CAPABILITY",
    `${contract.name} exposes an unimplemented script or binary`,
  );
  assert(
    JSON.stringify(Object.keys(manifest.exports ?? {}).sort()) === JSON.stringify([...contract.expectedExports].sort()),
    "EXPORT_MAP_DRIFT",
    `${contract.name} export map differs from its contract`,
  );
  assert(
    JSON.stringify(Object.keys(manifest.bin ?? {}).sort()) === JSON.stringify([...contract.expectedBins].sort()),
    "BIN_MAP_DRIFT",
    `${contract.name} binary map differs from its contract`,
  );
  assert(
    JSON.stringify(dependencyCoordinates(manifest)) ===
      JSON.stringify([...contract.allowedProductionDependencies].sort()),
    "DEPENDENCY_DRIFT",
    `${contract.name} production dependencies differ from admission`,
  );
  for (const field of ["optionalDependencies", "peerDependencies", "bundledDependencies", "bundleDependencies"]) {
    assert(manifest[field] === undefined, "DEPENDENCY_CHANNEL_FORBIDDEN", `${contract.name} uses forbidden ${field}`);
  }
  const exportCount = exportedBindings(source, sourceName);
  assert(
    exportCount === contract.p2ExportCount,
    "FAKE_PUBLIC_EXPORT",
    `${contract.name} exports ${exportCount} bindings during P2; expected ${contract.p2ExportCount}`,
  );
  return exportCount;
}

export async function checkShells(root) {
  const policy = await validateJsonFile(root, "config/packages/packages.json", "config/packages/packages.schema.json");
  const expectedDirectories = policy.packages.map(({ directory }) => directory).sort();
  const actualDirectories = (await readdir(path.join(root, "packages"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => `packages/${entry.name}`)
    .sort();
  assert(
    JSON.stringify(actualDirectories) === JSON.stringify(expectedDirectories),
    "PACKAGE_SET_DRIFT",
    `expected ${expectedDirectories.join(", ")}; observed ${actualDirectories.join(", ")}`,
  );

  const lock = await readJson(path.join(root, "package-lock.json"));
  assert(lock.lockfileVersion === 3, "LOCKFILE_VERSION", "package-lock.json must use lockfileVersion 3");
  const names = [];
  for (const contract of policy.packages) {
    const manifest = await readJson(path.join(root, contract.directory, "package.json"));
    names.push(manifest.name);
    const entryName = contract.role === "command-line-interface" ? "main.ts" : "index.ts";
    const entry = path.join(root, contract.directory, "src", entryName);
    validateP2Manifest(manifest, contract, policy, await readFile(entry, "utf8"), entry);
    const lockEntry = lock.packages?.[contract.directory];
    assert(
      lockEntry?.name === contract.name && lockEntry?.version === policy.workspaceVersion,
      "LOCK_WORKSPACE_DRIFT",
      `${contract.name} is not represented exactly in the lockfile`,
    );
    assert(
      JSON.stringify(dependencyCoordinates(lockEntry)) ===
        JSON.stringify([...contract.allowedProductionDependencies].sort()),
      "LOCK_DEPENDENCY_DRIFT",
      `${contract.name} lock dependencies differ from admission`,
    );
  }
  assert(new Set(names).size === names.length, "DUPLICATE_PACKAGE_NAME", "workspace package names must be unique");
  const rootManifest = await readJson(path.join(root, "package.json"));
  assert(
    JSON.stringify(sortedUnique(rootManifest.workspaces ?? [])) === JSON.stringify(expectedDirectories),
    "WORKSPACE_SET_DRIFT",
    "root workspaces differ from canonical package set",
  );
  return {
    policyId: policy.policyId,
    publicationState: policy.publicationState,
    packageCount: policy.packages.length,
    packageNames: names.sort(),
    publicBindingCount: 0,
  };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main("package-shells", () => checkShells(root));
