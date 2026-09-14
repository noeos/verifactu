#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateActionReference, validateDependencyMetadata } from "../../tooling/admission/check-supply-chain.mjs";
import { assertReproducible } from "../../tooling/build/check-reproducibility.mjs";
import { validateTarEntries } from "../../tooling/build/pack-packages.mjs";
import { PolicyFailure, assert, main, stableJson, validateJsonFile } from "../../tooling/lib/policy.mjs";
import { validateRegulatoryFiles } from "../../tooling/repository/check-regulatory-state.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

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
    "tests/policy/fixtures/supply-chain-invalid.json",
    "tests/policy/fixtures/supply-chain-invalid.schema.json",
  );
  const fixtures = new Map(document.fixtures.map((fixture) => [fixture.id, fixture]));
  const passed = [];
  passed.push(
    await expectCode(fixtures.get("mutable-action"), () =>
      validateActionReference("actions/checkout@v6", new Map(), "invalid fixture"),
    ),
  );
  passed.push(
    await expectCode(fixtures.get("mutable-dependency"), () =>
      validateDependencyMetadata(
        "node_modules/example",
        { resolved: "https://registry.npmjs.org/example/-/example-1.0.0.tgz" },
        { registry: "https://registry.npmjs.org/" },
      ),
    ),
  );
  const manifest = Buffer.from(stableJson({ name: "@noeos/example", private: true }));
  passed.push(
    await expectCode(fixtures.get("package-content-leak"), () =>
      validateTarEntries(
        [
          { name: "package/package.json", mode: 0o644, bytes: manifest },
          { name: "package/secret.txt", mode: 0o644, bytes: Buffer.from("leak") },
        ],
        { name: "@noeos/example", allowedFiles: ["package.json"] },
      ),
    ),
  );
  passed.push(
    await expectCode(fixtures.get("nonreproducible-output"), () =>
      assertReproducible({ "dist/index.js": "a" }, { "dist/index.js": "b" }),
    ),
  );
  passed.push(
    await expectCode(fixtures.get("unadmitted-regulatory-edition"), () =>
      validateRegulatoryFiles(["README.md", "2026-09.json"], ["README.md"]),
    ),
  );
  assert(passed.length === document.fixtures.length, "FIXTURE_COVERAGE", "every fixture must execute");
  return { fixtureCount: document.fixtures.length, passed };
}

await main("supply-chain-negative-fixtures", run);
