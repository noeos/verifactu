#!/usr/bin/env node
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../..");
const build = resolve(root, "evidence/runs/artifacts/build/verifactu/dist");
const mutations = [
  [
    "P4-MUT-032",
    "verification/claims.js",
    'if (statuses.includes("invalid"))',
    "if (false)",
    ["tests/unit/p4-claims.test.mjs"],
  ],
  [
    "P4-MUT-033",
    "verification/engine-adapter.js",
    "officialArtifactDigests: digests,",
    "officialArtifactDigests: Object.freeze([]),",
    ["tests/integration/p4-engine-tarball.test.mjs"],
  ],
  [
    "P4-MUT-034",
    "verification/engine-adapter.js",
    'case "invalid":\n            case "indeterminate":\n                return succeeded(result.status);',
    'case "invalid":\n                return succeeded("valid");\n            case "indeterminate":\n                return succeeded(result.status);',
    ["tests/integration/p4-engine-tarball.test.mjs"],
  ],
  [
    "P4-MUT-035",
    "verification/engine-adapter.js",
    '    catch {\n        return succeeded("unavailable");\n    }\n}\nfunction sameInstalledEngine()',
    '    catch {\n        return succeeded("valid");\n    }\n}\nfunction sameInstalledEngine()',
    ["tests/integration/p4-engine-tarball.test.mjs"],
  ],
];

const temporary = await mkdtemp(join(root, ".p4f-mutants-"));
const isolatedEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) => name !== "NODE_TEST_CONTEXT" && name !== "VERIFACTU_TEST_ENTRY",
  ),
);
const results = [];
try {
  for (const [id, relative, original, replacement, tests] of mutations) {
    const mutantRoot = resolve(temporary, id);
    await cp(build, mutantRoot, { recursive: true });
    const target = resolve(mutantRoot, relative);
    const source = await readFile(target, "utf8");
    const occurrences = source.split(original).length - 1;
    if (occurrences !== 1)
      throw new Error(
        `${id}: expected one mutation site, found ${occurrences}`,
      );
    await writeFile(target, source.replace(original, replacement), "utf8");
    const execution = spawnSync(process.execPath, ["--test", ...tests], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...isolatedEnvironment,
        VERIFACTU_TEST_ENTRY: pathToFileURL(resolve(mutantRoot, "index.js"))
          .href,
      },
      timeout: 30_000,
    });
    const timedOut = execution.error?.code === "ETIMEDOUT";
    const killed =
      execution.status !== 0 &&
      execution.error === undefined &&
      /not ok|AssertionError/u.test(`${execution.stdout}\n${execution.stderr}`);
    results.push({ id, killed, timedOut });
    if (!killed)
      throw new Error(
        `${id}: ${timedOut ? "timed out" : "survived or failed for a non-assertion reason"}\n${execution.stdout}\n${execution.stderr}`,
      );
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}

process.stdout.write(
  `${JSON.stringify({
    schemaVersion: 1,
    population: results.length,
    killed: results.filter((result) => result.killed).length,
    killedPercent: 100,
    compileErrors: 0,
    testErrors: 0,
    timeouts: results.filter((result) => result.timedOut).length,
    survivors: [],
    results,
  })}\n`,
);
