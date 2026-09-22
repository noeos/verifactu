#!/usr/bin/env node
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../..");
const build = resolve(root, "evidence/runs/artifacts/build/verifactu/dist");
const mutations = [
  [
    "P4-MUT-017",
    "application/operation-plan.js",
    "if (!validEffect(effect, plan))",
    "if (false && !validEffect(effect, plan))",
    "tests/unit/p4-plans-artifacts.test.mjs",
  ],
  [
    "P4-MUT-018",
    "application/record-planner.js",
    "planId: input.planId,",
    "planId: `${input.planId}-${Math.random()}`,",
    "tests/property/p4-properties.test.mjs",
  ],
  [
    "P4-MUT-019",
    "application/official-projection.js",
    "fields: Object.freeze(fields),",
    "fields: Object.freeze(fields.reverse()),",
    "tests/unit/p4-plans-artifacts.test.mjs",
  ],
  [
    "P4-MUT-020",
    "application/official-serialization.js",
    "const text = parts.join(descriptor.fieldSeparator);",
    'const text = parts.join(";");',
    "tests/unit/p4-plans-artifacts.test.mjs",
  ],
  [
    "P4-MUT-021",
    "application/fingerprint.js",
    "return succeeded(equalText(computed.value.value, supplied));",
    "return succeeded(true);",
    "tests/unit/p4-plans-artifacts.test.mjs",
  ],
  [
    "P4-MUT-022",
    "application/xml-artifacts.js",
    "byteLength: bytes.length,",
    "byteLength: 0,",
    "tests/unit/p4-plans-artifacts.test.mjs",
  ],
];

const temporary = await mkdtemp(resolve(tmpdir(), "verifactu-p4b-mutants-"));
const isolatedEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) => name !== "NODE_TEST_CONTEXT" && name !== "VERIFACTU_TEST_ENTRY",
  ),
);
const results = [];
try {
  for (const [id, relative, original, replacement, testFile] of mutations) {
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
    const execution = spawnSync(process.execPath, ["--test", testFile], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...isolatedEnvironment,
        VERIFACTU_TEST_ENTRY: pathToFileURL(resolve(mutantRoot, "index.js"))
          .href,
      },
      timeout: 30_000,
    });
    const killed = execution.status !== 0 && execution.error === undefined;
    results.push({ id, killed, test: testFile });
    if (!killed)
      throw new Error(
        `${id}: survived\n${execution.stdout}\n${execution.stderr}`,
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
    timeouts: 0,
    survivors: [],
    results,
  })}\n`,
);
