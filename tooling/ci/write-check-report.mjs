#!/usr/bin/env node
import { resolve } from "node:path";
import process from "node:process";
import { stat } from "node:fs/promises";
import { assert, readJson, sha256File, writeJsonAtomic } from "../lib/core.mjs";

function value(flag) {
  const index = process.argv.indexOf(flag);
  assert(index >= 0 && process.argv[index + 1], "CHECK_REPORT_ARGUMENT", flag);
  return process.argv[index + 1];
}

const context = value("--context");
const jobId = value("--job-id");
const output = resolve(value("--output"));
const registry = await readJson(resolve("config/ci/required-checks.json"));
const check = registry.checks.find((entry) => entry.jobId === jobId);
assert(
  check?.context === context,
  "CHECK_REPORT_REGISTRY",
  `${jobId}: ${context}`,
);
const subject = process.env.VERIFACTU_SUBJECT_SHA;
const taskIndex = process.argv.indexOf("--task-report");
const evidenceIndex = process.argv.indexOf("--evidence-file");
assert(
  taskIndex >= 0 !== evidenceIndex >= 0,
  "CHECK_REPORT_EVIDENCE",
  "exactly one --task-report or --evidence-file is required",
);
assert(
  /^[a-f0-9]{40}$/u.test(subject ?? ""),
  "CHECK_REPORT_SUBJECT",
  subject ?? "missing",
);
const sourcePath = resolve(
  process.argv[(taskIndex >= 0 ? taskIndex : evidenceIndex) + 1],
);
const sourceStat = await stat(sourcePath);
assert(
  sourceStat.isFile() && sourceStat.size > 0,
  "CHECK_REPORT_EMPTY",
  sourcePath,
);
const sourceDigest = await sha256File(sourcePath);
let executed = 1;
let evidenceTask = null;
if (taskIndex >= 0) {
  const task = await readJson(sourcePath);
  const expectedTask = check.task.includes(":")
    ? check.task
    : ["npm-audit", "dependency-review"].includes(jobId)
      ? "policy:supply-chain"
      : null;
  assert(
    task.taskId === expectedTask,
    "CHECK_REPORT_TASK_ID",
    `${jobId}: ${task.taskId}`,
  );
  assert(task.status === "passed", "CHECK_REPORT_TASK_STATUS", task.taskId);
  assert(task.subject === subject, "CHECK_REPORT_TASK_SUBJECT", task.taskId);
  assert(
    Number.isInteger(task.selected) &&
      task.selected > 0 &&
      Number.isInteger(task.executed) &&
      task.executed > 0 &&
      Number.isInteger(task.passed) &&
      task.passed > 0,
    "CHECK_REPORT_TASK_EMPTY",
    task.taskId,
  );
  executed = task.executed;
  evidenceTask = task.taskId;
} else {
  assert(
    !check.task.includes(":") ||
      ["dependency-review", "documentation"].includes(jobId),
    "CHECK_REPORT_TASK_REQUIRED",
    jobId,
  );
}
const report = {
  schemaVersion: 1,
  context,
  jobId,
  producer: ".github/workflows/required.yml",
  subject,
  status: "passed",
  executed,
  evidenceTask,
  evidenceSha256: sourceDigest,
  resultDigest: sourceDigest,
};
await writeJsonAtomic(output, report);
process.stdout.write(`${JSON.stringify(report)}\n`);
