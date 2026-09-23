#!/usr/bin/env node
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../..");
const source = resolve(root, "internal/xades-provider");
const mutants = [
  [
    "P4-MUT-026",
    "provider.mjs",
    "if len(ids) != len(set(ids)):",
    "if False:",
    "tests/security/p4-xades-attacks.test.mjs",
    "VERIFACTU_XADES_PROVIDER_ENTRY",
  ],
  [
    "P4-MUT-027",
    "provider.mjs",
    "if len(references) != 2:",
    "if False:",
    "tests/security/p4-xades-attacks.test.mjs",
    "VERIFACTU_XADES_PROVIDER_ENTRY",
  ],
  [
    "P4-MUT-028",
    "pki.mjs",
    "if (fingerprint !== request.certificateFingerprintSha256)",
    "if (false)",
    "tests/security/p4-pki-attacks.test.mjs",
    "VERIFACTU_PKI_PROVIDER_ENTRY",
  ],
  [
    "P4-MUT-029",
    "pki.mjs",
    "if (request.requireRevocationEvidence)",
    "if (false)",
    "tests/security/p4-pki-attacks.test.mjs",
    "VERIFACTU_PKI_PROVIDER_ENTRY",
  ],
];
const temporary = await mkdtemp(resolve(tmpdir(), "verifactu-p4d-mutants-"));
const results = [];
try {
  for (const [id, file, from, to, test, environment] of mutants) {
    const directory = resolve(temporary, id);
    await cp(source, directory, { recursive: true });
    const target = resolve(directory, file);
    const text = await readFile(target, "utf8");
    if (text.split(from).length - 1 !== 1)
      throw new Error(`${id}: mutation site`);
    await writeFile(target, text.replace(from, to), "utf8");
    const run = spawnSync(process.execPath, ["--test", test], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, [environment]: pathToFileURL(target).href },
      timeout: 30_000,
    });
    const killed = run.status !== 0 && run.error === undefined;
    results.push({ id, killed, test });
    if (!killed)
      throw new Error(`${id}: survived\n${run.stdout}\n${run.stderr}`);
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write(
  `${JSON.stringify({ schemaVersion: 1, population: results.length, killed: results.length, killedPercent: 100, compileErrors: 0, testErrors: 0, timeouts: 0, survivors: [], results })}\n`,
);
