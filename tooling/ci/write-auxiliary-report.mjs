#!/usr/bin/env node
import { resolve } from "node:path";
import process from "node:process";
import { stat } from "node:fs/promises";
import { assert, readJson, sha256File, writeJsonAtomic } from "../lib/core.mjs";

function value(flag) {
  const index = process.argv.indexOf(flag);
  assert(index >= 0 && process.argv[index + 1], "AUX_REPORT_ARGUMENT", flag);
  return process.argv[index + 1];
}

const context = value("--context");
const jobId = value("--job-id");
const output = resolve(value("--output"));
const sourcePath = resolve(value("--task-report"));
const subject = process.env.VERIFACTU_SUBJECT_SHA;
assert(
  /^[a-f0-9]{40}$/u.test(subject ?? ""),
  "AUX_REPORT_SUBJECT",
  subject ?? "missing",
);
const sourceStat = await stat(sourcePath);
assert(
  sourceStat.isFile() && sourceStat.size > 0,
  "AUX_REPORT_EMPTY",
  sourcePath,
);
const task = await readJson(sourcePath);
assert(task.status === "passed", "AUX_REPORT_TASK_STATUS", task.taskId);
assert(task.subject === subject, "AUX_REPORT_TASK_SUBJECT", task.taskId);
assert(
  task.selected > 0 && task.executed > 0 && task.passed > 0,
  "AUX_REPORT_TASK_EMPTY",
  task.taskId,
);
const digest = await sha256File(sourcePath);
await writeJsonAtomic(output, {
  schemaVersion: 1,
  context,
  jobId,
  producer: "auxiliary-workflow",
  subject,
  status: "passed",
  taskId: task.taskId,
  executed: task.executed,
  evidenceSha256: digest,
  resultDigest: digest,
});
