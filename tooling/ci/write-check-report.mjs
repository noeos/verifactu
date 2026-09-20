#!/usr/bin/env node
import { resolve } from "node:path";
import process from "node:process";
import { assert, sha256, writeJsonAtomic } from "../lib/core.mjs";

function value(flag) {
  const index = process.argv.indexOf(flag);
  assert(index >= 0 && process.argv[index + 1], "CHECK_REPORT_ARGUMENT", flag);
  return process.argv[index + 1];
}

const context = value("--context");
const jobId = value("--job-id");
const output = resolve(value("--output"));
const subject = process.env.VERIFACTU_SUBJECT_SHA;
assert(
  /^[a-f0-9]{40}$/u.test(subject ?? ""),
  "CHECK_REPORT_SUBJECT",
  subject ?? "missing",
);
const report = {
  schemaVersion: 1,
  context,
  jobId,
  producer: ".github/workflows/required.yml",
  subject,
  status: "passed",
  executed: 1,
  resultDigest: sha256(`${context}\0${jobId}\0${subject}\0passed`),
};
await writeJsonAtomic(output, report);
process.stdout.write(`${JSON.stringify(report)}\n`);
