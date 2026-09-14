#!/usr/bin/env node
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateActionReference, validateDependencyMetadata } from "../../tooling/admission/check-supply-chain.mjs";
import { downloadAdmittedInput } from "../../tooling/admission/prepare-external-inputs.mjs";
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

  const payload = Buffer.from("digest-bound-payload");
  const input = {
    id: "bounded-retry-fixture",
    url: "https://example.invalid/input",
    mediaType: "application/octet-stream",
    maximumBytes: payload.length,
    sha256: createHash("sha256").update(payload).digest("hex"),
  };
  const response = (status) => ({
    ok: status === 200,
    status,
    url: "https://example.invalid/input?ephemeral=must-not-be-retained",
    headers: new Headers({ "content-length": String(payload.length) }),
    body: { cancel: async () => undefined },
    arrayBuffer: async () => payload,
  });
  let calls = 0;
  const delays = [];
  const recovered = await downloadAdmittedInput(input, {
    fetchImpl: async () => response(++calls < 3 ? 504 : 200),
    sleep: async (delay) => delays.push(delay),
  });
  assert(calls === 3, "FIXTURE_RETRY_COUNT", `expected three attempts; observed ${calls}`);
  assert(delays.join(",") === "500,1000", "FIXTURE_RETRY_DELAY", `unexpected retry delays ${delays}`);
  assert(recovered.attemptCount === 3, "FIXTURE_RETRY_EVIDENCE", "recovery attempt count was not retained");
  assert(
    recovered.finalUrl === "https://example.invalid/input",
    "FIXTURE_REDIRECT_REDACTION",
    "redirect query data was retained",
  );

  calls = 0;
  await expectCode({ id: "non-transient-download", expectedCode: "DOWNLOAD_FAILED" }, () =>
    downloadAdmittedInput(input, {
      fetchImpl: async () => {
        calls += 1;
        return response(404);
      },
      sleep: async () => assert(false, "FIXTURE_UNEXPECTED_RETRY", "404 was retried"),
    }),
  );
  assert(calls === 1, "FIXTURE_RETRY_COUNT", `404 used ${calls} attempts`);

  calls = 0;
  await expectCode({ id: "transient-download-exhaustion", expectedCode: "DOWNLOAD_FAILED" }, () =>
    downloadAdmittedInput(input, {
      fetchImpl: async () => {
        calls += 1;
        return response(503);
      },
      sleep: async () => undefined,
    }),
  );
  assert(calls === 3, "FIXTURE_RETRY_COUNT", `503 exhaustion used ${calls} attempts`);

  return {
    fixtureCount: document.fixtures.length,
    passed,
    resilienceFixtures: [
      "bounded-transient-retry-succeeds",
      "non-transient-no-retry",
      "transient-exhaustion-fails-closed",
      "redirect-query-redacted",
    ],
  };
}

await main("supply-chain-negative-fixtures", run);
