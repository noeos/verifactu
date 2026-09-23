#!/usr/bin/env node
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../..");
const provider = resolve(root, "internal/xml-provider");
const mutations = [
  [
    "P4-MUT-023",
    "provider.mjs",
    "if (FORBIDDEN_MARKUP.test(xml))",
    "if (false && FORBIDDEN_MARKUP.test(xml))",
    "tests/security/p4-xml-attacks.test.mjs",
  ],
  [
    "P4-MUT-024",
    "provider.mjs",
    "if (request.xml.byteLength > limits.maximumXmlBytes)",
    "if (false && request.xml.byteLength > limits.maximumXmlBytes)",
    "tests/security/p4-resource-attacks.test.mjs",
  ],
  [
    "P4-MUT-025",
    "provider.mjs",
    'return outcome("valid", "valid", semantic, []);',
    'return outcome("valid", "valid", "valid", []);',
    "tests/integration/p4-offline-xsd.test.mjs",
  ],
];
const temporary = await mkdtemp(resolve(tmpdir(), "verifactu-p4c-mutants-"));
const isolatedEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) =>
      ![
        "NODE_TEST_CONTEXT",
        "VERIFACTU_TEST_ENTRY",
        "VERIFACTU_XML_PROVIDER_ENTRY",
        "VERIFACTU_XML_WORKER_ENTRY",
      ].includes(name),
  ),
);
const results = [];
try {
  for (const [id, relative, original, replacement, testFile] of mutations) {
    const mutantRoot = resolve(temporary, id);
    await cp(provider, mutantRoot, { recursive: true });
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
        VERIFACTU_XML_PROVIDER_ENTRY: pathToFileURL(
          resolve(mutantRoot, "provider.mjs"),
        ).href,
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
