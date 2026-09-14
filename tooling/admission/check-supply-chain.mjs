#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, readJson, sha256, validateJsonFile } from "../lib/policy.mjs";

const ACTION_REFERENCE = /^([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)(?:\/[a-zA-Z0-9_./-]+)?@([0-9a-f]{40})$/;

export function validateActionReference(reference, admittedActions, source = "workflow") {
  const parsed = ACTION_REFERENCE.exec(reference);
  assert(parsed, "MUTABLE_ACTION", `${source} uses mutable or malformed Action ${reference}`);
  const admittedIdentity = `${parsed[1]}@${parsed[2]}`;
  assert(admittedActions.has(admittedIdentity), "ACTION_NOT_ADMITTED", `${source} uses unadmitted Action ${reference}`);
}

export function validateDependencyMetadata(lockPath, metadata, dependencyPolicy) {
  assert(!metadata.hasInstallScript, "LIFECYCLE_SCRIPT_FORBIDDEN", `${lockPath} declares an install script`);
  if (metadata.resolved) {
    assert(
      metadata.resolved.startsWith(dependencyPolicy.registry),
      "REGISTRY_NOT_ADMITTED",
      `${lockPath} resolves outside the exact npm registry`,
    );
    assert(metadata.integrity?.startsWith("sha512-"), "INTEGRITY_MISSING", `${lockPath} lacks SHA-512 lock integrity`);
  } else {
    assert(
      metadata.inBundle === true,
      "INTEGRITY_MISSING",
      `${lockPath} is neither integrity-bound nor a member of an admitted bundle`,
    );
  }
}

function packageName(lockPath) {
  const suffix = lockPath.slice(lockPath.lastIndexOf("node_modules/") + "node_modules/".length);
  const parts = suffix.split("/");
  return parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
}

function normalizedLicense(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length === 1 && value[0]?.type === "Apache 2.0") return "Apache-2.0";
  return null;
}

async function installedLicense(root, lockPath) {
  const manifest = await readJson(path.join(root, lockPath, "package.json")).catch(() => null);
  return normalizedLicense(manifest?.license ?? manifest?.licenses);
}

export async function checkSupplyChain(root) {
  const dependencyPolicy = await validateJsonFile(
    root,
    "config/admission/dependencies.json",
    "config/admission/dependencies.schema.json",
  );
  const actionPolicy = await validateJsonFile(
    root,
    "config/admission/actions.json",
    "config/admission/actions.schema.json",
  );
  const lockBytes = await readFile(path.join(root, "package-lock.json"));
  assert(
    sha256(lockBytes) === dependencyPolicy.lockfileSha256,
    "LOCKFILE_ADMISSION_DRIFT",
    "package-lock.json differs from its reviewed admission digest",
  );
  const lock = JSON.parse(lockBytes);
  const entries = Object.entries(lock.packages);
  assert(
    entries.length === dependencyPolicy.expectedPackageEntries,
    "LOCKFILE_COMPONENT_COUNT_DRIFT",
    `expected ${dependencyPolicy.expectedPackageEntries} lock entries; observed ${entries.length}`,
  );
  const licenses = new Set();
  let registryArtifacts = 0;
  let bundledMembers = 0;
  let optionalMembers = 0;
  for (const [lockPath, metadata] of entries) {
    if (!lockPath.startsWith("node_modules/") || metadata.link) continue;
    validateDependencyMetadata(lockPath, metadata, dependencyPolicy);
    if (metadata.optional) optionalMembers += 1;
    if (metadata.resolved) {
      registryArtifacts += 1;
    } else {
      bundledMembers += 1;
    }
    const license = normalizedLicense(metadata.license) ?? (await installedLicense(root, lockPath));
    assert(
      license && dependencyPolicy.allowedLicenses.includes(license),
      "LICENSE_NOT_ADMITTED",
      `${packageName(lockPath)}@${metadata.version} has unadmitted licence ${license ?? "missing"}`,
    );
    licenses.add(license);
  }
  const engine = lock.packages["node_modules/@noeos/verification-engine"];
  assert(
    engine?.version === dependencyPolicy.runtime.version &&
      engine.integrity === dependencyPolicy.runtime.integrity &&
      engine.license === dependencyPolicy.runtime.license,
    "RUNTIME_DEPENDENCY_DRIFT",
    "Verification Engine differs from its independent admission record",
  );
  assert(
    !engine.dependencies && !engine.optionalDependencies && !engine.hasInstallScript,
    "RUNTIME_DEPENDENCY_CAPABILITY_DRIFT",
    "Verification Engine acquired a runtime dependency, optional code or install script",
  );

  const admittedActions = new Map(actionPolicy.actions.map((action) => [`${action.repository}@${action.sha}`, action]));
  const workflows = await readdirWorkflows(root);
  const observedActions = new Set();
  for (const workflow of workflows) {
    const text = await readFile(workflow, "utf8");
    for (const match of text.matchAll(/^\s*uses:\s*([^\s#]+)/gm)) {
      if (match[1].startsWith("./")) continue;
      validateActionReference(match[1], admittedActions, workflow);
      observedActions.add(match[1]);
    }
  }
  return {
    dependencyPolicyId: dependencyPolicy.policyId,
    actionPolicyId: actionPolicy.policyId,
    lockEntries: entries.length,
    registryArtifacts,
    bundledMembers,
    optionalMembers,
    lifecycleScripts: 0,
    licenses: [...licenses].sort(),
    observedActionReferences: [...observedActions].sort(),
    admittedActionCount: admittedActions.size,
  };
}

async function readdirWorkflows(root) {
  const { readdir } = await import("node:fs/promises");
  return (await readdir(path.join(root, ".github/workflows")))
    .filter((name) => name.endsWith(".yml"))
    .sort()
    .map((name) => path.join(root, ".github/workflows", name));
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main("supply-chain-admission", () => checkSupplyChain(root));
