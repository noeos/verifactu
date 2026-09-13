#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";

import { assert } from "../lib/policy.mjs";
import { validateClosureReports } from "./validate-reports.mjs";

const id = process.argv[2];
assert(id?.startsWith("gate:"), "GATE_IDENTITY", "closure gate identity is required");
const directory = process.env.VERIFACTU_TASK_REPORT_DIRECTORY;
const dependencies = JSON.parse(process.env.VERIFACTU_TASK_DEPENDENCIES ?? "[]");
assert(directory && Array.isArray(dependencies), "GATE_ENVIRONMENT", "runner-owned closure environment is missing");
const reports = [];
for (const dependency of dependencies) {
  const filename = `${dependency.replaceAll(":", "-")}.json`;
  reports.push(JSON.parse(await readFile(path.join(directory, filename), "utf8")));
}
const evidence = validateClosureReports({ id, dependencies }, reports);
process.stdout.write(`${JSON.stringify({ schemaVersion: 1, gate: id, result: "passed", ...evidence })}\n`);
