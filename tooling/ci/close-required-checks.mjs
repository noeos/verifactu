#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, validateJsonFile } from "../lib/policy.mjs";
import { validateClosureSnapshot } from "./check-required-registry.mjs";

async function fetchCheckRuns(repository, subject, token) {
  const response = await fetch(
    `https://api.github.com/repos/${repository}/commits/${subject}/check-runs?per_page=100`,
    {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28",
      },
      signal: AbortSignal.timeout(30000),
    },
  );
  assert(response.ok, "CHECK_RUN_API", `GitHub check-runs API returned ${response.status}`);
  const document = await response.json();
  assert(document.total_count <= 100, "CHECK_RUN_PAGINATION", "closure requires pagination beyond its admitted bound");
  return document.check_runs;
}

export async function closeRequiredChecks(root) {
  const repository = process.env.GITHUB_REPOSITORY;
  const subject = process.env.POLICY_HEAD_SHA ?? process.env.GITHUB_SHA;
  const token = process.env.GITHUB_TOKEN;
  assert(repository && /^[^/]+\/[^/]+$/.test(repository), "MISSING_GITHUB_CONTEXT", "GITHUB_REPOSITORY is required");
  assert(subject && /^[0-9a-f]{40}$/.test(subject), "MISSING_GITHUB_CONTEXT", "exact head SHA is required");
  assert(token, "MISSING_GITHUB_CONTEXT", "GITHUB_TOKEN is required");
  const localResults = JSON.parse(process.env.LOCAL_PREREQUISITE_RESULTS ?? "{}");
  const failedLocal = Object.entries(localResults)
    .filter(([, result]) => result !== "success")
    .map(([name, result]) => `${name}=${result}`);
  assert(
    failedLocal.length === 0,
    "FAILED_LOCAL_PREREQUISITE",
    `closure prerequisites did not succeed: ${failedLocal.join(", ")}`,
  );
  const registry = await validateJsonFile(
    root,
    "config/ci/required-checks.json",
    "config/ci/required-checks.schema.json",
  );
  const deadline = Date.now() + Number(process.env.CLOSURE_TIMEOUT_MS ?? 600000);
  let lastRuns = [];
  while (Date.now() < deadline) {
    lastRuns = await fetchCheckRuns(repository, subject, token);
    try {
      return validateClosureSnapshot(registry, lastRuns, subject);
    } catch (error) {
      if (error.code === "FAILED_REQUIRED_CHECK") throw error;
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
  return validateClosureSnapshot(registry, lastRuns, subject);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main("required-check-closure", () => closeRequiredChecks(root));
}
