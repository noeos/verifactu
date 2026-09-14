#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  expectPolicyCode,
  validateClosureSnapshot,
  validateRequiredRegistry,
} from "../../tooling/ci/check-required-registry.mjs";
import { assert, main, validateJsonFile } from "../../tooling/lib/policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function run() {
  const fixtures = await validateJsonFile(
    root,
    "tests/policy/fixtures/ci-invalid.json",
    "tests/policy/fixtures/ci-invalid.schema.json",
  );
  const registry = await validateJsonFile(
    root,
    "config/ci/required-checks.json",
    "config/ci/required-checks.schema.json",
  );
  const byId = new Map(fixtures.fixtures.map((fixture) => [fixture.id, fixture]));
  const contexts = registry.contexts.map(({ context }) => context);
  const passed = [];
  passed.push(
    await expectPolicyCode(byId.get("missing-required-job").expectedCode, () =>
      validateRequiredRegistry(registry, contexts.slice(1)),
    ),
  );
  passed.push(
    await expectPolicyCode(byId.get("missing-check-report").expectedCode, () =>
      validateClosureSnapshot(registry, [], "a".repeat(40)),
    ),
  );
  assert(passed.length === fixtures.fixtures.length, "FIXTURE_COVERAGE", "every CI fixture must execute");
  return { fixtureCount: fixtures.fixtures.length, passed };
}

await main("ci-negative-fixtures", run);
