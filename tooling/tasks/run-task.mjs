#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  assert,
  canonicalJson,
  digestFiles,
  matchesAny,
  readJson,
  run,
  sha256,
  snapshot,
  walk,
  writeJsonAtomic,
} from "../lib/core.mjs";
import { operationCapabilities, operations } from "./operations.mjs";

const ROOT = resolve(import.meta.dirname, "../..");

function parseArguments(argv) {
  const parsed = {
    task: null,
    registry: "config/tasks/task-registry.json",
    evidenceDir: "evidence/runs",
    list: false,
    selfTest: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--task") parsed.task = argv[++index];
    else if (argument === "--registry") parsed.registry = argv[++index];
    else if (argument === "--evidence-dir") parsed.evidenceDir = argv[++index];
    else if (argument === "--list") parsed.list = true;
    else if (argument === "--self-test") parsed.selfTest = true;
    else throw new Error(`ARGUMENT_UNKNOWN: ${argument}`);
  }
  return parsed;
}

export function validateRegistry(registry) {
  assert(
    registry?.schemaVersion === 1,
    "REGISTRY_SCHEMA",
    "schemaVersion must be 1",
  );
  assert(
    Array.isArray(registry.tasks) && registry.tasks.length > 0,
    "REGISTRY_EMPTY",
    "no tasks declared",
  );
  const ids = new Set();
  const producers = new Map();
  const requiredFields = [
    "id",
    "version",
    "owner",
    "dependencies",
    "inputs",
    "outputs",
    "workingDirectory",
    "toolProfile",
    "tools",
    "environment",
    "network",
    "secrets",
    "timeoutSeconds",
    "concurrencyLock",
    "selectionClass",
    "reportSchema",
    "zeroWork",
    "operation",
  ];
  for (const task of registry.tasks) {
    for (const field of requiredFields) {
      assert(
        Object.hasOwn(task, field),
        "TASK_FIELD_MISSING",
        `${task.id ?? "<unknown>"}.${field}`,
      );
    }
    assert(!ids.has(task.id), "TASK_DUPLICATE", task.id);
    ids.add(task.id);
    assert(task.version >= 1, "TASK_VERSION", task.id);
    assert(task.timeoutSeconds > 0, "TASK_TIMEOUT", task.id);
    assert(
      task.zeroWork === "fail",
      "TASK_ZERO_WORK",
      `${task.id} must fail zero work`,
    );
    assert(
      ["denied", "prepare-only"].includes(task.network),
      "TASK_NETWORK",
      task.id,
    );
    assert(task.secrets === "denied", "TASK_SECRETS", task.id);
    assert(
      operations[task.operation],
      "TASK_OPERATION",
      `${task.id}: ${task.operation}`,
    );
    const capability = operationCapabilities[task.operation];
    assert(capability, "TASK_CAPABILITY", task.operation);
    assert(
      JSON.stringify(task.tools) === JSON.stringify(capability.tools),
      "TASK_TOOL_DECLARATION",
      `${task.id}: ${JSON.stringify(task.tools)} != ${JSON.stringify(capability.tools)}`,
    );
    assert(
      task.network === capability.network,
      "TASK_NETWORK_DECLARATION",
      `${task.id}: ${task.network} != ${capability.network}`,
    );
    for (const output of task.outputs) {
      assert(
        !producers.has(output),
        "TASK_DUPLICATE_PRODUCER",
        `${output}: ${producers.get(output)} and ${task.id}`,
      );
      producers.set(output, task.id);
    }
  }
  for (const task of registry.tasks) {
    for (const dependency of task.dependencies) {
      assert(
        ids.has(dependency),
        "TASK_DEPENDENCY_UNKNOWN",
        `${task.id}: ${dependency}`,
      );
    }
  }
  const state = new Map();
  const byId = new Map(registry.tasks.map((task) => [task.id, task]));
  const visit = (id, path = []) => {
    if (state.get(id) === "done") return;
    assert(
      state.get(id) !== "visiting",
      "TASK_CYCLE",
      [...path, id].join(" -> "),
    );
    state.set(id, "visiting");
    for (const dependency of byId.get(id).dependencies)
      visit(dependency, [...path, id]);
    state.set(id, "done");
  };
  for (const id of ids) visit(id);
  return byId;
}

export function validateZeroWork(task, selected, executed) {
  assert(
    task.zeroWork !== "fail" || (selected > 0 && executed > 0),
    "ZERO_WORK",
    `${task.id} selected=${selected} executed=${executed}`,
  );
}

export function validateReportSubject(report, identity) {
  assert(
    report.subject === identity.subject && report.tree === identity.tree,
    "REPORT_SUBJECT",
    report.taskId,
  );
}

export function validateDeclaredWrites(before, after, task) {
  const changed = new Set([...before.keys(), ...after.keys()]);
  const undeclared = [];
  for (const path of changed) {
    if (JSON.stringify(before.get(path)) === JSON.stringify(after.get(path)))
      continue;
    const declared = task.outputs.some(
      (output) =>
        path === output ||
        path.startsWith(`${output.replace(/\/\*\*$/u, "")}/`) ||
        matchesAny(path, [output]),
    );
    if (!declared) undeclared.push(path);
  }
  assert(
    undeclared.length === 0,
    "UNDECLARED_WRITE",
    `${task.id}: ${undeclared.join(", ")}`,
  );
}

async function repositoryIdentity() {
  const explicitSubject = process.env.VERIFACTU_SUBJECT_SHA;
  const explicitTree = process.env.VERIFACTU_SUBJECT_TREE;
  const subjectResult = explicitSubject
    ? { code: 0, stdout: explicitSubject }
    : await run("git", ["rev-parse", "HEAD"], { cwd: ROOT });
  const treeResult = explicitTree
    ? { code: 0, stdout: explicitTree }
    : await run("git", ["rev-parse", "HEAD^{tree}"], { cwd: ROOT });
  assert(
    subjectResult.code === 0 && treeResult.code === 0,
    "SUBJECT_IDENTITY",
    "cannot derive commit/tree",
  );
  const dirty = await run("git", ["status", "--porcelain"], { cwd: ROOT });
  return {
    subject: subjectResult.stdout.trim(),
    tree: treeResult.stdout.trim(),
    dirty: dirty.stdout.trim().length > 0,
  };
}

async function selectedInputs(task) {
  const entries = await walk(ROOT, {
    exclude: [".git", "node_modules", "evidence/runs"],
  });
  return entries
    .filter(
      (entry) =>
        entry.type === "file" && matchesAny(entry.relative, task.inputs),
    )
    .map((entry) => entry.relative);
}

function reportPath(evidenceDir, taskId) {
  return resolve(ROOT, evidenceDir, `${taskId.replaceAll(":", "--")}.json`);
}

async function withDeclaredEnvironment(task, callback) {
  const original = { ...process.env };
  const platformRequired = new Set([
    "APPDATA",
    "ComSpec",
    "HOMEDRIVE",
    "HOMEPATH",
    "LOCALAPPDATA",
    "PATHEXT",
    "ProgramData",
    "SystemRoot",
    "TEMP",
    "TMP",
    "USERPROFILE",
    "WINDIR",
  ]);
  const allowed = new Set([...task.environment, ...platformRequired]);
  const allowedFolded = new Set([...allowed].map((key) => key.toLowerCase()));
  try {
    for (const key of Object.keys(process.env)) {
      if (
        process.platform === "win32"
          ? !allowedFolded.has(key.toLowerCase())
          : !allowed.has(key)
      )
        delete process.env[key];
    }
    process.env.LANG = "C.UTF-8";
    process.env.LC_ALL = "C.UTF-8";
    process.env.SOURCE_DATE_EPOCH = "0";
    process.env.TZ = "UTC";
    return await callback();
  } finally {
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, original);
  }
}

async function executeTask(task, context, completed) {
  if (completed.has(task.id)) return completed.get(task.id);
  const dependencyReports = [];
  for (const dependencyId of task.dependencies) {
    dependencyReports.push(
      await executeTask(context.byId.get(dependencyId), context, completed),
    );
  }
  const startedAt = new Date().toISOString();
  const inputs = await selectedInputs(task);
  const before = await snapshot(ROOT);
  let outcome;
  let operationError;
  try {
    outcome = await withDeclaredEnvironment(task, () =>
      Promise.race([
        operations[task.operation]({
          ...context,
          task,
          dependencyReports,
          inputs,
        }),
        new Promise((_, reject) => {
          const timer = setTimeout(
            () => reject(new Error(`TASK_TIMEOUT: ${task.id}`)),
            task.timeoutSeconds * 1000,
          );
          timer.unref();
        }),
      ]),
    );
  } catch (error) {
    operationError = error;
    outcome = {
      selected: inputs.length,
      executed: 0,
      passed: 0,
      diagnostics: [error.message],
    };
  }
  const selected = Number(outcome.selected ?? inputs.length);
  const executed = Number(outcome.executed ?? 0);
  if (!operationError) {
    try {
      validateZeroWork(task, selected, executed);
    } catch (error) {
      operationError = error;
      outcome.diagnostics = [
        ...(outcome.diagnostics ?? []),
        operationError.message,
      ];
    }
  }
  const afterOperation = await snapshot(ROOT);
  if (!operationError) {
    try {
      validateDeclaredWrites(before, afterOperation, task);
    } catch (error) {
      operationError = error;
      outcome.diagnostics = [
        ...(outcome.diagnostics ?? []),
        operationError.message,
      ];
    }
  }
  const identity = context.identity;
  const report = {
    schemaVersion: 1,
    taskId: task.id,
    taskVersion: task.version,
    status: operationError ? "failed" : "passed",
    subject: identity.subject,
    tree: identity.tree,
    toolProfile: task.toolProfile,
    selected,
    executed,
    passed: operationError
      ? Number(outcome.passed ?? 0)
      : Number(outcome.passed ?? executed),
    failed: operationError ? Math.max(1, Number(outcome.failed ?? 1)) : 0,
    skipped: Number(outcome.skipped ?? 0),
    startedAt,
    finishedAt: new Date().toISOString(),
    inputDigest:
      inputs.length > 0 ? await digestFiles(ROOT, inputs) : "0".repeat(64),
    outputDigest:
      outcome.outputDigest ??
      sha256(
        canonicalJson({
          taskId: task.id,
          selected,
          executed,
          passed: Number(outcome.passed ?? executed),
          diagnostics: outcome.diagnostics ?? [],
        }),
      ),
    diagnostics: [
      ...(identity.dirty
        ? ["working tree is dirty; this report is development evidence only"]
        : []),
      ...(outcome.diagnostics ?? []),
    ],
  };
  validateReportSubject(report, identity);
  const reportSchema = await readJson(resolve(ROOT, task.reportSchema));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validateReport = ajv.compile(reportSchema);
  assert(
    validateReport(report),
    "REPORT_SCHEMA",
    JSON.stringify(validateReport.errors),
  );
  await writeJsonAtomic(reportPath(context.evidenceDir, task.id), report);
  completed.set(task.id, report);
  if (operationError) throw operationError;
  return report;
}

async function selfTest(registry) {
  validateRegistry(registry);
  const clone = structuredClone(registry);
  clone.tasks.push(structuredClone(clone.tasks[0]));
  let duplicateRejected = false;
  try {
    validateRegistry(clone);
  } catch (error) {
    duplicateRejected = error.code === "TASK_DUPLICATE";
  }
  assert(duplicateRejected, "SELF_TEST", "duplicate task was accepted");
  const cycle = structuredClone(registry);
  cycle.tasks[0].dependencies = [cycle.tasks[1].id];
  cycle.tasks[1].dependencies = [cycle.tasks[0].id];
  let cycleRejected = false;
  try {
    validateRegistry(cycle);
  } catch (error) {
    cycleRejected = error.code === "TASK_CYCLE";
  }
  assert(cycleRejected, "SELF_TEST", "cycle was accepted");
  return { schemaVersion: 1, status: "passed", tests: 3 };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const registry = await readJson(resolve(ROOT, options.registry));
  const byId = validateRegistry(registry);
  if (options.list) {
    process.stdout.write(
      `${registry.tasks.map((task) => task.id).join("\n")}\n`,
    );
    return;
  }
  if (options.selfTest) {
    process.stdout.write(
      JSON.stringify(await selfTest(registry), null, 2) + "\n",
    );
    return;
  }
  assert(options.task, "TASK_REQUIRED", "use --task <id>");
  assert(byId.has(options.task), "TASK_UNKNOWN", options.task);
  await mkdir(resolve(ROOT, options.evidenceDir), {
    recursive: true,
    mode: 0o700,
  });
  const context = {
    root: ROOT,
    evidenceDir: options.evidenceDir,
    registry,
    byId,
    identity: await repositoryIdentity(),
  };
  const report = await executeTask(byId.get(options.task), context, new Map());
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(import.meta.filename)
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
