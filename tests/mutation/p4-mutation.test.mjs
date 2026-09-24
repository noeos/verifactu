import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../..");

test("P4-MUT-001..016 are killed by tests against mutated production code", () => {
  const execution = spawnSync(
    process.execPath,
    ["tooling/assurance/p4a-mutation.mjs"],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 120_000,
      env: { ...process.env, VERIFACTU_TEST_ENTRY: undefined },
    },
  );
  assert.equal(execution.error, undefined);
  assert.equal(execution.status, 0, `${execution.stdout}\n${execution.stderr}`);
  const report = JSON.parse(execution.stdout.trim().split(/\r?\n/u).at(-1));
  assert.equal(report.population, 16);
  assert.equal(report.killed, 16);
  assert.deepEqual(report.survivors, []);
  assert.equal(report.compileErrors, 0);
  assert.equal(report.testErrors, 0);
  assert.equal(report.timeouts, 0);
});

test("P4-MUT-017..022 are killed by tests against mutated production code", () => {
  const execution = spawnSync(
    process.execPath,
    ["tooling/assurance/p4b-mutation.mjs"],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 180_000,
      env: { ...process.env, VERIFACTU_TEST_ENTRY: undefined },
    },
  );
  assert.equal(execution.error, undefined);
  assert.equal(execution.status, 0, `${execution.stdout}\n${execution.stderr}`);
  const report = JSON.parse(execution.stdout.trim().split(/\r?\n/u).at(-1));
  assert.equal(report.population, 6);
  assert.equal(report.killed, 6);
  assert.deepEqual(report.survivors, []);
  assert.equal(report.compileErrors, 0);
  assert.equal(report.testErrors, 0);
  assert.equal(report.timeouts, 0);
});

test("P4-MUT-023..025 are killed by tests against mutated XML provider code", () => {
  const execution = spawnSync(
    process.execPath,
    ["tooling/assurance/p4c-mutation.mjs"],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 180_000,
      env: {
        ...process.env,
        VERIFACTU_TEST_ENTRY: undefined,
        VERIFACTU_XML_PROVIDER_ENTRY: undefined,
        VERIFACTU_XML_WORKER_ENTRY: undefined,
      },
    },
  );
  assert.equal(execution.error, undefined);
  assert.equal(execution.status, 0, `${execution.stdout}\n${execution.stderr}`);
  const report = JSON.parse(execution.stdout.trim().split(/\r?\n/u).at(-1));
  assert.equal(report.population, 3);
  assert.equal(report.killed, 3);
  assert.deepEqual(report.survivors, []);
  assert.equal(report.compileErrors, 0);
  assert.equal(report.testErrors, 0);
  assert.equal(report.timeouts, 0);
});

test("P4-MUT-030..031 and P4-MUT-037 are killed by QR production tests", () => {
  const execution = spawnSync(
    process.execPath,
    ["tooling/assurance/p4e-mutation.mjs"],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 60_000,
      env: { ...process.env, VERIFACTU_TEST_ENTRY: undefined },
    },
  );
  assert.equal(execution.error, undefined);
  assert.equal(execution.status, 0, `${execution.stdout}\n${execution.stderr}`);
  const report = JSON.parse(execution.stdout.trim().split(/\r?\n/u).at(-1));
  assert.equal(report.population, 3);
  assert.equal(report.killed, 3);
  assert.deepEqual(report.survivors, []);
  assert.equal(report.compileErrors, 0);
  assert.equal(report.testErrors, 0);
  assert.equal(report.timeouts, 0);
});
