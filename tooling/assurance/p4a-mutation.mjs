#!/usr/bin/env node
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../..");
const build = resolve(root, "evidence/runs/artifacts/build/verifactu/dist");
const mutations = [
  [
    "P4-MUT-001",
    "contracts/staged-codec.js",
    "return decoder.decode(value);",
    'return { status: "defect", diagnostics: [] };',
    "tests/unit/p4-codecs.test.mjs",
  ],
  [
    "P4-MUT-002",
    "contracts/staged-codec.js",
    "if (names.has(name))",
    "if (false && names.has(name))",
    "tests/unit/p4-codecs.test.mjs",
  ],
  [
    "P4-MUT-003",
    "domain/identities.js",
    "if (!IDENTITY_PATTERN.test(value))",
    "if (false && !IDENTITY_PATTERN.test(value))",
    "tests/unit/p4-values-identities.test.mjs",
  ],
  [
    "P4-MUT-004",
    "domain/context.js",
    "context[key] !== scope[key]",
    "false && context[key] !== scope[key]",
    "tests/security/p4-isolation-redaction.test.mjs",
  ],
  [
    "P4-MUT-005",
    "domain/decimal.js",
    "fraction.length > maximumScale",
    "fraction.length < maximumScale",
    "tests/unit/p4-values-identities.test.mjs",
  ],
  [
    "P4-MUT-006",
    "domain/date-time.js",
    "day < 1",
    "day < 0",
    "tests/unit/p4-values-identities.test.mjs",
  ],
  [
    "P4-MUT-007",
    "domain/records.js",
    "record.invoiceNumber.length === 0",
    "record.invoiceNumber.length < 0",
    "tests/unit/p4-records-corrections.test.mjs",
  ],
  [
    "P4-MUT-008",
    "domain/corrections.js",
    "entry.sequence !== history.length + 1",
    "entry.sequence === history.length + 1",
    "tests/unit/p4-records-corrections.test.mjs",
  ],
  [
    "P4-MUT-009",
    "domain/mode-tenure.js",
    "current === target",
    "current !== target",
    "tests/unit/p4-modes-events-states.test.mjs",
  ],
  [
    "P4-MUT-010",
    "domain/mode-tenure.js",
    "compareFiscalInstants(instant, tenure.endedAt) < 0",
    "compareFiscalInstants(instant, tenure.endedAt) <= 0",
    "tests/unit/p4-modes-events-states.test.mjs",
  ],
  [
    "P4-MUT-011",
    "domain/events.js",
    "compareFiscalInstants(previous.occurredAt, current.occurredAt) >= 0",
    "compareFiscalInstants(previous.occurredAt, current.occurredAt) > 0",
    "tests/unit/p4-modes-events-states.test.mjs",
  ],
  [
    "P4-MUT-012",
    "domain/states.js",
    'state.kind === "unconfigured"',
    'state.kind !== "unconfigured"',
    "tests/unit/p4-modes-events-states.test.mjs",
  ],
  [
    "P4-MUT-013",
    "domain/invariants.js",
    'result.status === "succeeded"',
    'result.status !== "succeeded"',
    "tests/unit/p4-records-corrections.test.mjs",
  ],
  [
    "P4-MUT-014",
    "domain/sequences.js",
    "position.value !== index + 1",
    "position.value === index + 1",
    "tests/unit/p4-sequences-chains.test.mjs",
  ],
  [
    "P4-MUT-015",
    "domain/chains.js",
    "const predecessor = previous === undefined",
    "const predecessor = previous !== undefined",
    "tests/unit/p4-sequences-chains.test.mjs",
  ],
  [
    "P4-MUT-016",
    "domain/chains.js",
    "expected !== entry.currentDigest",
    "expected === entry.currentDigest",
    "tests/unit/p4-sequences-chains.test.mjs",
  ],
];

const temporary = await mkdtemp(join(tmpdir(), "verifactu-p4a-mutants-"));
const results = [];
const isolatedEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) => name !== "NODE_TEST_CONTEXT" && name !== "VERIFACTU_TEST_ENTRY",
  ),
);
try {
  for (const [id, relative, original, replacement, testFile] of mutations) {
    const mutantRoot = resolve(temporary, id);
    await cp(build, mutantRoot, { recursive: true });
    const target = resolve(mutantRoot, relative);
    const source = await readFile(target, "utf8");
    const occurrences = source.split(original).length - 1;
    if (occurrences !== 1) {
      throw new Error(
        `${id}: expected one mutation site, found ${occurrences}`,
      );
    }
    await writeFile(target, source.replace(original, replacement), "utf8");
    const execution = spawnSync(process.execPath, ["--test", testFile], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...isolatedEnvironment,
        VERIFACTU_TEST_ENTRY: pathToFileURL(resolve(mutantRoot, "index.js"))
          .href,
      },
      timeout: 10_000,
    });
    const killed = execution.status !== 0 && execution.error === undefined;
    results.push({ id, killed, test: testFile });
    if (!killed) {
      throw new Error(
        `${id}: survived\n${execution.stdout}\n${execution.stderr}`,
      );
    }
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
