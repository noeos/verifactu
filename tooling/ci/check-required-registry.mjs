#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PolicyFailure, assert, main, validateJsonFile } from "../lib/policy.mjs";

export const REQUIRED_CONTEXTS = [
  "Required · governance signatures and DCO",
  "Required · documentation and traceability",
  "Required · regulatory sources and generated contracts",
  "Required · quality and policy",
  "Required · ubuntu-24.04 · Node 22.14.0",
  "Required · ubuntu-24.04 · Node 22.23.2",
  "Required · ubuntu-24.04 · Node 24.21.0",
  "Required · windows-2025 · Node 24.21.0",
  "Required · macos-15 · Node 24.21.0",
  "Required · package reproducibility",
  "Required · integration conformance",
  "Required · dependency review",
  "Required · CodeQL",
  "Required · secret scan",
  "Required · OSV",
  "Required · npm audit signatures and licenses",
  "Required · required-check closure",
].sort();

export function validateRequiredRegistry(registry, observedContexts) {
  const contexts = registry.contexts.map(({ context }) => context);
  assert(
    new Set(contexts).size === contexts.length,
    "DUPLICATE_REQUIRED_CONTEXT",
    "required context names must be unique",
  );
  assert(
    JSON.stringify([...contexts].sort()) === JSON.stringify(REQUIRED_CONTEXTS),
    "REQUIRED_CONTEXT_DRIFT",
    "required context registry differs from the normative set",
  );
  const producers = registry.contexts.map(({ workflow, job, runner, runtime }) =>
    [workflow, job, runner, runtime].join("\0"),
  );
  assert(
    new Set(producers).size === producers.length,
    "DUPLICATE_CONTEXT_PRODUCER",
    "context producer keys must be unique",
  );
  const observed = [...new Set(observedContexts)].sort();
  const missing = REQUIRED_CONTEXTS.filter((context) => !observed.includes(context));
  assert(missing.length === 0, "MISSING_REQUIRED_JOB", `workflows do not emit: ${missing.join(", ")}`);
  const unexpected = observed.filter((context) => !REQUIRED_CONTEXTS.includes(context));
  assert(
    unexpected.length === 0,
    "UNREGISTERED_REQUIRED_JOB",
    `workflows emit unregistered contexts: ${unexpected.join(", ")}`,
  );
}

export function validateClosureSnapshot(registry, checkRuns, subject) {
  const expected = registry.contexts
    .map(({ context }) => context)
    .filter((context) => context !== "Required · required-check closure");
  const latest = new Map();
  for (const run of checkRuns) {
    if (run.head_sha !== subject || !expected.includes(run.name)) continue;
    if (!latest.has(run.name) || Number(run.id) > Number(latest.get(run.name).id)) latest.set(run.name, run);
  }
  const missing = expected.filter((context) => !latest.has(context));
  assert(
    missing.length === 0,
    "MISSING_REQUIRED_CHECK_REPORT",
    `closure is missing check reports: ${missing.join(", ")}`,
  );
  const incomplete = expected.filter((context) => latest.get(context).status !== "completed");
  assert(incomplete.length === 0, "INCOMPLETE_REQUIRED_CHECK", `checks are incomplete: ${incomplete.join(", ")}`);
  const failed = expected.filter((context) => latest.get(context).conclusion !== "success");
  assert(failed.length === 0, "FAILED_REQUIRED_CHECK", `checks did not succeed: ${failed.join(", ")}`);
  return { subject, requiredLeafCount: expected.length, successfulLeafCount: expected.length };
}

async function observedWorkflowContexts(root) {
  const directory = path.join(root, ".github/workflows");
  const names = (await readdir(directory)).filter((name) => name.endsWith(".yml")).sort();
  const requiredFiles = [
    "ci.yml",
    "conformance.yml",
    "github-audit.yml",
    "performance.yml",
    "release-candidate.yml",
    "scorecard.yml",
    "security.yml",
  ];
  assert(
    JSON.stringify(names) === JSON.stringify(requiredFiles),
    "WORKFLOW_SET_DRIFT",
    `workflow set is ${names.join(", ")}`,
  );
  const contexts = [];
  for (const name of names) {
    const text = await readFile(path.join(directory, name), "utf8");
    for (const match of text.matchAll(/^\s+(?:-\s+)?(?:name|context):\s*["']?(Required · .+?)["']?\s*$/gm)) {
      contexts.push(match[1]);
    }
  }
  return contexts;
}

export async function checkRequiredRegistry(root) {
  const registry = await validateJsonFile(
    root,
    "config/ci/required-checks.json",
    "config/ci/required-checks.schema.json",
  );
  const observed = await observedWorkflowContexts(root);
  validateRequiredRegistry(registry, observed);
  return {
    registryId: registry.registryId,
    requiredContextCount: registry.contexts.length,
    producerCount: registry.contexts.length,
    workflowCount: 7,
  };
}

export async function expectPolicyCode(expectedCode, operation) {
  try {
    await operation();
  } catch (error) {
    assert(error instanceof PolicyFailure, "FIXTURE_WRONG_FAILURE", `fixture produced ${error}`);
    assert(error.code === expectedCode, "FIXTURE_WRONG_REASON", `expected ${expectedCode}; observed ${error.code}`);
    return expectedCode;
  }
  throw new PolicyFailure("FIXTURE_UNEXPECTED_PASS", `fixture unexpectedly passed instead of ${expectedCode}`);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main("required-check-registry", () => checkRequiredRegistry(root));
}
