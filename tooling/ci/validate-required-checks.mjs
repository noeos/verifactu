#!/usr/bin/env node
import { resolve } from "node:path";
import process from "node:process";
import {
  assert,
  readJson,
  sha256,
  walk,
  writeJsonAtomic,
} from "../lib/core.mjs";

function value(flag) {
  const index = process.argv.indexOf(flag);
  assert(index >= 0 && process.argv[index + 1], "CLOSURE_ARGUMENT", flag);
  return process.argv[index + 1];
}

const reportsRoot = resolve(value("--reports"));
const output = resolve(value("--output"));
const registry = await readJson(resolve("config/ci/required-checks.json"));
const leaves = registry.checks.filter((check) => check.jobId !== "closure");
const entries = (await walk(reportsRoot)).filter(
  (entry) => entry.type === "file" && entry.relative.endsWith(".json"),
);
assert(
  entries.length === leaves.length,
  "CLOSURE_REPORT_COUNT",
  `${entries.length} != ${leaves.length}`,
);
const subject = process.env.VERIFACTU_SUBJECT_SHA;
const observed = new Map();
for (const entry of entries) {
  const report = await readJson(entry.path);
  assert(report.schemaVersion === 1, "CLOSURE_REPORT_SCHEMA", entry.relative);
  assert(report.status === "passed", "CLOSURE_REPORT_STATUS", report.context);
  assert(
    report.subject === subject,
    "CLOSURE_REPORT_SUBJECT",
    `${report.context}: ${report.subject}`,
  );
  assert(
    Number.isInteger(report.executed) && report.executed > 0,
    "CLOSURE_REPORT_EMPTY",
    report.context,
  );
  assert(
    !observed.has(report.context),
    "CLOSURE_REPORT_DUPLICATE",
    report.context,
  );
  observed.set(report.context, report);
}
for (const leaf of leaves) {
  const report = observed.get(leaf.context);
  assert(report, "CLOSURE_REPORT_MISSING", leaf.context);
  assert(report.jobId === leaf.jobId, "CLOSURE_PRODUCER", leaf.context);
}
const needs = JSON.parse(process.env.REQUIRED_NEEDS_JSON ?? "{}");
for (const leaf of leaves) {
  assert(
    needs[leaf.jobId]?.result === "success",
    "CLOSURE_JOB_RESULT",
    `${leaf.jobId}: ${needs[leaf.jobId]?.result ?? "absent"}`,
  );
}
const report = {
  schemaVersion: 1,
  context: "Required · required-check closure",
  jobId: "closure",
  producer: ".github/workflows/required.yml",
  subject,
  status: "passed",
  executed: leaves.length,
  contexts: leaves.map((leaf) => leaf.context),
  resultDigest: sha256(JSON.stringify([...observed.keys()].sort())),
};
await writeJsonAtomic(output, report);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
