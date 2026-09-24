#!/usr/bin/env node
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../..");
const build = resolve(root, "evidence/runs/artifacts/build/verifactu/dist");
const targetRelative = "application/qr.js";
const mutations = [
  {
    id: "P4-MUT-030",
    original:
      'profile.mode === "verifactu" ? "ValidarQR" : "ValidarQRNoVerifactu"',
    replacement:
      'profile.mode === "verifactu" ? "ValidarQRNoVerifactu" : "ValidarQR"',
  },
  {
    id: "P4-MUT-031",
    original: "canonicalQrText(profile, normalizedFacts) !== text",
    replacement: "false",
  },
  {
    id: "P4-MUT-037",
    original: "digestBytes.length !== 32",
    replacement: "false",
  },
];
const temporary = await mkdtemp(resolve(tmpdir(), "verifactu-p4e-mutants-"));
const isolatedEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) => !["NODE_TEST_CONTEXT", "VERIFACTU_TEST_ENTRY"].includes(name),
  ),
);
const results = [];
try {
  for (const mutation of mutations) {
    const mutantRoot = resolve(temporary, mutation.id);
    await cp(build, mutantRoot, { recursive: true });
    const target = resolve(mutantRoot, targetRelative);
    const source = await readFile(target, "utf8");
    const occurrences = source.split(mutation.original).length - 1;
    if (occurrences !== 1)
      throw new Error(
        `${mutation.id}: expected one site, found ${occurrences}`,
      );
    await writeFile(
      target,
      source.replace(mutation.original, mutation.replacement),
      "utf8",
    );
    const execution = spawnSync(
      process.execPath,
      ["--test", "tests/unit/p4-qr-payload.test.mjs"],
      {
        cwd: root,
        encoding: "utf8",
        env: {
          ...isolatedEnvironment,
          VERIFACTU_TEST_ENTRY: pathToFileURL(resolve(mutantRoot, "index.js"))
            .href,
        },
        timeout: 30_000,
      },
    );
    const killed = execution.status !== 0 && execution.error === undefined;
    results.push({
      ...mutation,
      killed,
      timedOut: execution.error?.code === "ETIMEDOUT",
    });
    if (!killed)
      throw new Error(
        `${mutation.id}: survived\n${execution.stdout}\n${execution.stderr}`,
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
    survivors: results.filter((result) => !result.killed),
    results,
  })}\n`,
);
