#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { PolicyFailure, assert, main, validateJsonFile } from "../../tooling/lib/policy.mjs";
import {
  assertDeclaredWrites,
  assertDiscoveredInputs,
  assertFreshOutputs,
  commandFor,
} from "../../tooling/tasks/run-task.mjs";
import { validateTaskGraph } from "../../tooling/tasks/validate-graph.mjs";
import { validateClosureReports } from "../../tooling/tasks/validate-reports.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function task(id, dependencies = []) {
  return {
    id,
    dependencies,
    outputs: [],
    command: { executable: "node", arguments: ["fixture.mjs"] },
    environment: { passThrough: [], fixed: {} },
    network: "denied",
    secrets: "denied",
    zeroWork: "fail",
  };
}

async function expectCode(fixture, operation) {
  try {
    await operation();
  } catch (error) {
    assert(error instanceof PolicyFailure, "FIXTURE_WRONG_FAILURE", `${fixture.id} produced ${error}`);
    assert(
      error.code === fixture.expectedCode,
      "FIXTURE_WRONG_REASON",
      `${fixture.id} expected ${fixture.expectedCode}; observed ${error.code}`,
    );
    return fixture.id;
  }
  throw new PolicyFailure("FIXTURE_UNEXPECTED_PASS", `${fixture.id} unexpectedly passed`);
}

async function run() {
  const document = await validateJsonFile(
    root,
    "tests/policy/fixtures/task-runner-invalid.json",
    "tests/policy/fixtures/task-runner-invalid.schema.json",
  );
  const fixtures = new Map(document.fixtures.map((fixture) => [fixture.id, fixture]));
  const passed = [];
  passed.push(
    await expectCode(fixtures.get("duplicate-task"), () =>
      validateTaskGraph({ tasks: [task("test:a"), task("test:a")], profiles: {} }),
    ),
  );
  passed.push(
    await expectCode(fixtures.get("task-cycle"), () =>
      validateTaskGraph({ tasks: [task("test:a", ["test:b"]), task("test:b", ["test:a"])], profiles: {} }),
    ),
  );
  passed.push(
    await expectCode(fixtures.get("undeclared-tool"), () =>
      commandFor(root, { ...task("test:tool"), command: { executable: "curl", arguments: [] } }),
    ),
  );
  passed.push(await expectCode(fixtures.get("zero-work"), () => assertDiscoveredInputs([], task("test:empty"))));
  passed.push(
    await expectCode(fixtures.get("undeclared-write"), () =>
      assertDeclaredWrites(["packages/verifactu/src/injected.ts"], ["dist/**"], "test:write"),
    ),
  );
  passed.push(
    await expectCode(fixtures.get("stale-output"), () =>
      assertFreshOutputs(new Map([["input.ts", 20]]), new Map([["output.js", 10]]), "test:stale"),
    ),
  );
  passed.push(
    await expectCode(fixtures.get("missing-report"), () => validateClosureReports(task("gate:test", ["test:a"]), [])),
  );
  passed.push(
    await expectCode(fixtures.get("duplicate-report"), () =>
      validateClosureReports(task("gate:test", ["test:a"]), [
        { task: "test:a", result: "passed", subject: "a" },
        { task: "test:a", result: "passed", subject: "a" },
      ]),
    ),
  );
  const network = spawnSync(
    process.execPath,
    [
      "--import",
      pathToFileURL(path.join(root, "tooling/tasks/network-guard.mjs")).href,
      path.join(root, "tests/policy/fixtures/task-runner/network-attempt.mjs"),
    ],
    { encoding: "utf8", env: { ...process.env } },
  );
  assert(network.status !== 0, "FIXTURE_UNEXPECTED_PASS", "undeclared-network unexpectedly passed");
  assert(
    network.stderr.includes(fixtures.get("undeclared-network").expectedCode),
    "FIXTURE_WRONG_REASON",
    `undeclared-network did not fail with ${fixtures.get("undeclared-network").expectedCode}`,
  );
  passed.push("undeclared-network");
  assert(passed.length === document.fixtures.length, "FIXTURE_COVERAGE", "every task-runner fixture must execute");
  return { fixtureCount: document.fixtures.length, passed };
}

await main("task-runner-negative-fixtures", run);
