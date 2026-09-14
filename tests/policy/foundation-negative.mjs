#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PolicyFailure, assert, main, readJson, validateJsonFile } from "../../tooling/lib/policy.mjs";
import { expectedToolchainSummary, validateGeneratedDocument } from "../../tooling/generation/check-generated.mjs";
import { validateP2Manifest } from "../../tooling/packages/check-shells.mjs";
import { validateGraph } from "../../tooling/repository/check-imports.mjs";
import { validatePaths } from "../../tooling/repository/check-tree.mjs";
import { assertExecutableResolution, assertRuntimeVersions } from "../../tooling/toolchain/check-profile.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function expectCode(id, expectedCode, operation) {
  try {
    await operation();
  } catch (error) {
    assert(error instanceof PolicyFailure, "FIXTURE_WRONG_FAILURE", `${id} produced a non-policy failure: ${error}`);
    assert(
      error.code === expectedCode,
      "FIXTURE_WRONG_REASON",
      `${id} expected ${expectedCode}; observed ${error.code}`,
    );
    return id;
  }
  throw new PolicyFailure("FIXTURE_UNEXPECTED_PASS", `${id} unexpectedly passed`);
}

async function run() {
  const fixtureDoc = await validateJsonFile(
    root,
    "tests/policy/fixtures/foundation-invalid.json",
    "tests/policy/fixtures/foundation-invalid.schema.json",
  );
  const fixtures = new Map(fixtureDoc.fixtures.map((fixture) => [fixture.id, fixture]));
  const tree = await readJson(path.join(root, "config/repository/tree.json"));
  const imports = await readJson(path.join(root, "config/repository/import-rules.json"));
  const packages = await readJson(path.join(root, "config/packages/packages.json"));
  const packageContract = packages.packages[0];
  const packageManifest = await readJson(path.join(root, packageContract.directory, "package.json"));
  const passed = [];
  passed.push(
    await expectCode("wrong-tree-unowned-root", fixtures.get("wrong-tree-unowned-root").expectedCode, () =>
      validatePaths(["surprise.txt"], tree),
    ),
  );
  passed.push(
    await expectCode("wrong-tree-case-collision", fixtures.get("wrong-tree-case-collision").expectedCode, () =>
      validatePaths(fixtures.get("wrong-tree-case-collision").paths, tree),
    ),
  );
  passed.push(
    await expectCode("wrong-import-deep-private", fixtures.get("wrong-import-deep-private").expectedCode, () =>
      validateGraph(
        [{ file: "packages/verifactu/src/index.ts", source: fixtures.get("wrong-import-deep-private").source }],
        imports,
        root,
      ),
    ),
  );
  passed.push(
    await expectCode("wrong-import-ambient-builtin", fixtures.get("wrong-import-ambient-builtin").expectedCode, () =>
      validateGraph(
        [{ file: "packages/verifactu/src/index.ts", source: fixtures.get("wrong-import-ambient-builtin").source }],
        imports,
        root,
      ),
    ),
  );
  passed.push(
    await expectCode("wrong-import-cycle", fixtures.get("wrong-import-cycle").expectedCode, () =>
      validateGraph(
        [
          { file: "packages/verifactu/src/a.ts", source: "import './b.js';" },
          { file: "packages/verifactu/src/b.ts", source: "import './a.js';" },
        ],
        imports,
        root,
      ),
    ),
  );
  passed.push(
    await expectCode("wrong-package-export", fixtures.get("wrong-package-export").expectedCode, () =>
      validateP2Manifest(
        packageManifest,
        packageContract,
        packages,
        fixtures.get("wrong-package-export").source,
        "wrong-package-export.ts",
      ),
    ),
  );
  passed.push(
    await expectCode("wrong-package-bin", fixtures.get("wrong-package-bin").expectedCode, () =>
      validateP2Manifest(
        { ...packageManifest, bin: fixtures.get("wrong-package-bin").bin },
        packageContract,
        packages,
        "export {};",
        "wrong-package-bin.ts",
      ),
    ),
  );
  const primaryProfile = (await readJson(path.join(root, "config/toolchain/profiles.json"))).profiles[
    "node-24-primary"
  ];
  passed.push(
    await expectCode("wrong-node-version", fixtures.get("wrong-node-version").expectedCode, () =>
      assertRuntimeVersions(
        "node-24-primary",
        primaryProfile,
        fixtures.get("wrong-node-version").version,
        primaryProfile.npm,
      ),
    ),
  );
  passed.push(
    await expectCode("path-shadow", fixtures.get("path-shadow").expectedCode, () =>
      assertExecutableResolution(fixtures.get("path-shadow").execPath, fixtures.get("path-shadow").resolved),
    ),
  );
  const expectedGenerated = await expectedToolchainSummary(root);
  passed.push(
    await expectCode("hand-edited-generated", fixtures.get("hand-edited-generated").expectedCode, () =>
      validateGeneratedDocument({ ...expectedGenerated, sourceSha256: "0".repeat(64) }, expectedGenerated),
    ),
  );
  assert(passed.length === fixtureDoc.fixtures.length, "FIXTURE_COVERAGE", "every declared fixture must execute");
  return { fixtureCount: fixtureDoc.fixtures.length, executableFixtureCount: passed.length, passed };
}

await main("foundation-negative-fixtures", run);
