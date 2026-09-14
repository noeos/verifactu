#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { lstat, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

import { assert, fail, main, readJson, sha256, stableJson, validateJsonFile } from "../lib/policy.mjs";
import { topologicalSelection, validateTaskGraph } from "./validate-graph.mjs";

const RUNNER_EXCLUSIONS = new Set([
  ".agents",
  ".codex",
  ".git",
  ".nyc_output",
  ".stryker-tmp",
  "coverage",
  "downloads",
  "node_modules",
  "tmp",
]);

function globRegex(pattern) {
  let output = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === "*" && pattern[index + 1] === "*") {
      index += 1;
      if (pattern[index + 1] === "/") {
        index += 1;
        output += "(?:.*/)?";
      } else output += ".*";
    } else if (character === "*") output += "[^/]*";
    else if (character === "?") output += "[^/]";
    else output += character.replace(/[|\\{}()[\]^$+?.-]/g, "\\$&");
  }
  return new RegExp(`${output}$`);
}

function matches(pathname, patterns) {
  return patterns.some((pattern) => globRegex(pattern).test(pathname));
}

async function inventory(directory, root = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (RUNNER_EXCLUSIONS.has(entry.name) || entry.name === ".DS_Store" || entry.name === "Thumbs.db") continue;
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (
      relative === "evidence/runs" ||
      relative.startsWith("evidence/runs/") ||
      relative === "evidence/tmp" ||
      relative.startsWith("evidence/tmp/")
    )
      continue;
    if (entry.isDirectory()) files.push(...(await inventory(absolute, root)));
    else if (
      entry.isFile() &&
      !entry.name.endsWith(".log") &&
      !entry.name.endsWith(".tsbuildinfo") &&
      !/\.pyc$/.test(entry.name)
    ) {
      files.push(relative);
    }
  }
  return files.sort();
}

async function digestFiles(root, files) {
  const hash = createHash("sha256");
  for (const file of files) {
    const bytes = await readFile(path.join(root, file));
    hash.update(`${file}\0${sha256(bytes)}\0`);
  }
  return hash.digest("hex");
}

async function modificationTimes(root, files) {
  return new Map(await Promise.all(files.map(async (file) => [file, (await lstat(path.join(root, file))).mtimeMs])));
}

async function snapshot(root, files) {
  const state = new Map();
  for (const file of files) {
    const absolute = path.join(root, file);
    const stat = await lstat(absolute);
    state.set(file, `${stat.mode}:${stat.size}:${sha256(await readFile(absolute))}`);
  }
  return state;
}

function changedPaths(before, after) {
  const all = new Set([...before.keys(), ...after.keys()]);
  return [...all].filter((file) => before.get(file) !== after.get(file)).sort();
}

export function assertDeclaredWrites(changed, outputPatterns, taskId) {
  const undeclared = changed.filter((file) => !matches(file, outputPatterns));
  assert(
    undeclared.length === 0,
    "UNDECLARED_WRITE",
    `task ${taskId} changed undeclared paths: ${undeclared.join(", ")}`,
  );
}

export function assertDiscoveredInputs(inputs, task) {
  assert(task.zeroWork !== "fail" || inputs.length > 0, "ZERO_WORK", `task ${task.id} discovered no declared input`);
}

export function assertFreshOutputs(inputTimes, outputTimes, taskId) {
  const newestInput = Math.max(...inputTimes.values());
  const stale = [...outputTimes].filter(([, modified]) => modified < newestInput).map(([file]) => file);
  assert(stale.length === 0, "STALE_OUTPUT", `task ${taskId} left stale outputs: ${stale.join(", ")}`);
}

async function resolveSubject(root) {
  const head = (await readFile(path.join(root, ".git/HEAD"), "utf8")).trim();
  if (/^[0-9a-f]{40}$/.test(head)) return head;
  if (!head.startsWith("ref: ")) return "uncommitted";
  const reference = head.slice(5);
  const loose = await readFile(path.join(root, ".git", reference), "utf8").catch(() => "");
  if (/^[0-9a-f]{40}\s*$/.test(loose)) return loose.trim();
  const packed = await readFile(path.join(root, ".git/packed-refs"), "utf8").catch(() => "");
  return (
    packed
      .split(/\r?\n/)
      .find((line) => line.endsWith(` ${reference}`))
      ?.split(" ", 1)[0] ?? "uncommitted"
  );
}

export function commandFor(root, task) {
  const targets = {
    node: null,
    npm: "node_modules/npm/bin/npm-cli.js",
    typescript: "node_modules/typescript/bin/tsc",
    prettier: "node_modules/prettier/bin/prettier.cjs",
    eslint: "node_modules/eslint/bin/eslint.js",
  };
  if (task.command.executable === "python") {
    assert(process.env.VERIFACTU_PYTHON, "MISSING_PYTHON", `task ${task.id} requires VERIFACTU_PYTHON`);
    return { executable: process.env.VERIFACTU_PYTHON, arguments: task.command.arguments };
  }
  assert(
    Object.hasOwn(targets, task.command.executable),
    "UNDECLARED_TOOL",
    `task ${task.id} requests undeclared tool ${task.command.executable}`,
  );
  const target = targets[task.command.executable];
  const requested = target === null ? task.command.arguments : [target, ...task.command.arguments];
  const guard =
    task.network === "denied"
      ? ["--import", pathToFileURL(path.join(root, "tooling/tasks/network-guard.mjs")).href]
      : [];
  return { executable: process.execPath, arguments: [...guard, ...requested] };
}

function controlledEnvironment(root, taskDirectory, task) {
  const environment = {
    TZ: "UTC",
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    SOURCE_DATE_EPOCH: "0",
    NO_COLOR: "1",
    FORCE_COLOR: "0",
    CI: "true",
    PATH: path.dirname(process.execPath),
    HOME: taskDirectory,
    USERPROFILE: taskDirectory,
    TMPDIR: path.join(taskDirectory, "tmp"),
    TEMP: path.join(taskDirectory, "tmp"),
    TMP: path.join(taskDirectory, "tmp"),
    ...task.environment.fixed,
  };
  if (process.platform === "win32" && process.env.SystemRoot) environment.SystemRoot = process.env.SystemRoot;
  for (const name of task.environment.passThrough) {
    assert(
      process.env[name] !== undefined,
      "MISSING_DECLARED_ENVIRONMENT",
      `task ${task.id} requires environment ${name}`,
    );
    environment[name] = process.env[name];
  }
  environment.VERIFACTU_REPOSITORY_ROOT = root;
  environment.VERIFACTU_TASK_REPORT_DIRECTORY = path.dirname(taskDirectory);
  environment.VERIFACTU_TASK_DEPENDENCIES = JSON.stringify(task.dependencies);
  environment.VERIFACTU_ALLOWED_CHILD_ENTRYPOINTS = JSON.stringify(
    (task.command.childEntrypoints ?? []).map((entrypoint) => path.resolve(root, entrypoint)),
  );
  for (const name of ["GITHUB_RUN_ATTEMPT", "GITHUB_RUN_ID", "GITHUB_SHA"]) {
    if (process.env[name] !== undefined) environment[name] = process.env[name];
  }
  return environment;
}

function runChild(executable, arguments_, options, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, arguments_, {
      ...options,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let size = 0;
    const collect = (target) => (chunk) => {
      size += chunk.length;
      if (size > 16 * 1024 * 1024) {
        child.kill("SIGKILL");
        reject(new Error("TASK_OUTPUT_LIMIT: combined output exceeded 16 MiB"));
      } else target.push(chunk);
    };
    child.stdout.on("data", collect(stdout));
    child.stderr.on("data", collect(stderr));
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`TASK_TIMEOUT: exceeded ${timeoutMs} ms`));
    }, timeoutMs);
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      const result = { code, signal, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) };
      if (code !== 0)
        reject(Object.assign(new Error(`TASK_COMMAND_FAILED: exit=${code} signal=${signal ?? "none"}`), { result }));
      else resolve(result);
    });
  });
}

async function writeAtomicJson(destination, value) {
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  await writeFile(temporary, stableJson(value), { encoding: "utf8", mode: 0o600, flag: "wx" });
  await rename(temporary, destination);
}

async function validateReport(root, registry, report) {
  const schema = await readJson(path.join(root, registry.reportSchema));
  const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: false });
  const validate = ajv.compile(schema);
  assert(validate(report), "TASK_REPORT_INVALID", `task report violates ${registry.reportSchema}`, {
    errors: validate.errors,
  });
}

export async function executeTask(root, registry, task, runDirectory) {
  const allBefore = await inventory(root);
  const inputs = allBefore.filter((file) => matches(file, task.inputs));
  assertDiscoveredInputs(inputs, task);
  const before = await snapshot(root, allBefore);
  const inputDigest = await digestFiles(root, inputs);
  const inputTimes = await modificationTimes(root, inputs);
  const command = commandFor(root, task);
  const taskDirectory = path.join(runDirectory, task.id.replaceAll(":", "-"));
  await mkdir(path.join(taskDirectory, "tmp"), { recursive: true });
  const environment = controlledEnvironment(root, taskDirectory, task);
  const startedAt = new Date().toISOString();
  const started = performance.now();
  let result;
  try {
    result = await runChild(
      command.executable,
      command.arguments,
      { cwd: path.join(root, task.workingDirectory), env: environment },
      task.timeoutMs,
    );
  } catch (error) {
    const stdout = error.result?.stdout?.toString("utf8") ?? "";
    const stderr = error.result?.stderr?.toString("utf8") ?? "";
    fail("TASK_COMMAND_FAILED", `${task.id} failed: ${error.message}`, { stdout, stderr });
  }
  const allAfter = await inventory(root);
  const after = await snapshot(root, allAfter);
  const changed = changedPaths(before, after);
  assertDeclaredWrites(changed, task.outputs, task.id);
  const outputs = allAfter.filter((file) => matches(file, task.outputs));
  if (task.outputs.length > 0)
    assert(outputs.length > 0, "MISSING_TASK_OUTPUT", `task ${task.id} declared outputs but produced none`);
  const outputTimes = await modificationTimes(root, outputs);
  if (outputs.length > 0) assertFreshOutputs(inputTimes, outputTimes, task.id);
  const report = {
    schemaVersion: 1,
    registryId: registry.registryId,
    task: task.id,
    taskVersion: task.version,
    result: "passed",
    subject: await resolveSubject(root),
    startedAt,
    durationMs: Math.round(performance.now() - started),
    inputCount: inputs.length,
    inputDigest,
    outputCount: outputs.length,
    outputDigest: await digestFiles(root, outputs),
    commandDigest: sha256(stableJson({ executable: command.executable, arguments: command.arguments })),
    stdoutSha256: sha256(result.stdout),
    stderrSha256: sha256(result.stderr),
    network: task.network,
    environmentNames: Object.keys(environment).sort(),
  };
  await validateReport(root, registry, report);
  await writeAtomicJson(path.join(runDirectory, `${task.id.replaceAll(":", "-")}.json`), report);
  if (result.stdout.length > 0) process.stdout.write(result.stdout);
  if (result.stderr.length > 0) process.stderr.write(result.stderr);
  return report;
}

export async function runSelected(root, taskId, evidenceDirectory) {
  const registry = await validateJsonFile(root, "config/tasks/tasks.json", "config/tasks/tasks.schema.json");
  const tasks = validateTaskGraph(registry);
  const selected = topologicalSelection(tasks, taskId);
  const runDirectory = path.resolve(root, evidenceDirectory ?? path.join("evidence/runs", `local-${process.pid}`));
  assert(
    runDirectory === root || runDirectory.startsWith(`${root}${path.sep}`),
    "EVIDENCE_PATH_ESCAPE",
    "evidence directory must remain inside the repository",
  );
  await mkdir(runDirectory, { recursive: true });
  const reports = [];
  for (const task of selected) reports.push(await executeTask(root, registry, task, runDirectory));
  return {
    registryId: registry.registryId,
    requestedTask: taskId,
    executedTaskCount: reports.length,
    reportFiles: reports.map(({ task }) => `${task.replaceAll(":", "-")}.json`),
  };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const taskIndex = process.argv.indexOf("--task");
  if (taskIndex < 0 || !process.argv[taskIndex + 1])
    fail("TASK_ARGUMENT", "usage: run-task.mjs --task <task-id> [--evidence-dir <relative-path>]");
  const evidenceIndex = process.argv.indexOf("--evidence-dir");
  await main("canonical-task-runner", () =>
    runSelected(root, process.argv[taskIndex + 1], evidenceIndex >= 0 ? process.argv[evidenceIndex + 1] : undefined),
  );
}
