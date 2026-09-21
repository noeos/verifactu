#!/usr/bin/env node
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../..");
const tests = [
  "tests/unit/p4-codecs.test.mjs",
  "tests/unit/p4-values-identities.test.mjs",
  "tests/unit/p4-records-corrections.test.mjs",
  "tests/unit/p4-modes-events-states.test.mjs",
  "tests/unit/p4-sequences-chains.test.mjs",
  "tests/contract/p4-public-contract.test.mjs",
  "tests/contract/p4-edition-contract.test.mjs",
  "tests/security/p4-isolation-redaction.test.mjs",
  "tests/property/p4-properties.test.mjs",
  "tests/mutation/p4-mutation.test.mjs",
];
const temporary = await mkdtemp(join(tmpdir(), "verifactu-p4a-coverage-"));

try {
  const execution = spawnSync(
    process.execPath,
    [
      "node_modules/c8/bin/c8.js",
      "--all",
      "--src",
      "evidence/runs/artifacts/build/verifactu/dist",
      "--include",
      "**/*.js",
      "--check-coverage",
      "--lines",
      "98",
      "--functions",
      "98",
      "--branches",
      "95",
      "--statements",
      "98",
      "--reporter",
      "text-summary",
      "--reports-dir",
      resolve(temporary, "report"),
      "--temp-directory",
      resolve(temporary, "raw"),
      process.execPath,
      "--test",
      ...tests,
    ],
    { cwd: root, encoding: "utf8", timeout: 120_000 },
  );
  if (execution.error !== undefined || execution.status !== 0) {
    throw new Error(
      `P4A_COVERAGE_EXECUTION: ${execution.error?.message ?? ""}\n${execution.stdout}\n${execution.stderr}`,
    );
  }
  const output = `${execution.stdout}\n${execution.stderr}`;
  const metric = (name) => {
    const match = new RegExp(`${name}\\s*:\\s*([\\d.]+)%`, "u").exec(output);
    if (match?.[1] === undefined)
      throw new Error(`P4A_COVERAGE_METRIC: ${name}`);
    return Number(match[1]);
  };
  const report = {
    schemaVersion: 1,
    testFiles: tests.length,
    tests: 37,
    statements: metric("Statements"),
    branches: metric("Branches"),
    functions: metric("Functions"),
    lines: metric("Lines"),
  };
  if (
    report.statements < 98 ||
    report.branches < 95 ||
    report.functions < 98 ||
    report.lines < 98
  ) {
    throw new Error(`P4A_COVERAGE_THRESHOLD: ${JSON.stringify(report)}`);
  }
  process.stdout.write(`${JSON.stringify(report)}\n`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
