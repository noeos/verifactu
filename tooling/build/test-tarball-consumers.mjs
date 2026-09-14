#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

import { assert, main, stableJson, validateJsonFile } from "../lib/policy.mjs";

function install(root, consumer, tarballs) {
  const guard = path.join(root, "tooling/tasks/network-guard.mjs");
  const npm = path.join(root, "node_modules/npm/bin/npm-cli.js");
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      guard,
      npm,
      "install",
      "--ignore-scripts",
      "--omit=optional",
      "--offline",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
      ...tarballs,
    ],
    { cwd: consumer, encoding: "utf8", env: { ...process.env } },
  );
  assert(
    result.status === 0,
    "TARBALL_INSTALL_FAILED",
    `offline tarball install failed: ${result.stderr}\n${result.stdout}`,
  );
}

async function importPackage(consumer, name) {
  const manifestPath = path.join(consumer, "node_modules", ...name.split("/"), "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const target = manifest.exports?.["."]?.import ?? manifest.module ?? manifest.main;
  assert(typeof target === "string", "CONSUMER_EXPORT_MISSING", `${name} has no ESM consumer target`);
  return import(pathToFileURL(path.resolve(path.dirname(manifestPath), target)).href);
}

function typecheckConsumer(consumer) {
  const entry = path.join(consumer, "consumer.ts");
  const options = {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    target: ts.ScriptTarget.ES2024,
    strict: true,
    noEmit: true,
    skipLibCheck: false,
  };
  const program = ts.createProgram([entry], options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert(
    diagnostics.length === 0,
    "TARBALL_TYPES_FAILED",
    ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: () => consumer,
      getNewLine: () => "\n",
    }),
  );
}

export async function testTarballConsumers(root) {
  const content = await validateJsonFile(root, "config/packages/content.json", "config/packages/content.schema.json");
  const external = await validateJsonFile(
    root,
    "config/admission/external-inputs.json",
    "config/admission/external-inputs.schema.json",
  );
  const engine = external.inputs.find(({ id }) => id === "verification-engine-1.0.1");
  const tarballs = [
    path.join(root, ".cache/admission", engine.filename),
    ...content.packages.map(({ tarball }) => path.join(root, ".cache/packages", tarball)),
  ];
  const consumer = await mkdtemp(path.join(process.env.TMPDIR, "tarball-consumer-"));
  try {
    await writeFile(
      path.join(consumer, "package.json"),
      stableJson({ name: "verifactu-clean-consumer", version: "0.0.0", private: true, type: "module" }),
    );
    install(root, consumer, tarballs);
    const library = await importPackage(consumer, "@noeos/verifactu");
    const adapter = await importPackage(consumer, "@noeos/verifactu-adapter-kit");
    const cli = await importPackage(consumer, "@noeos/verifactu-cli");
    assert(
      Object.keys(library).length === 0 && Object.keys(adapter).length === 0 && Object.keys(cli).length === 0,
      "FAKE_PACKED_EXPORT",
      "P2 tarballs must expose zero public bindings",
    );
    const require = createRequire(path.join(consumer, "consumer.cjs"));
    assert(
      Object.keys(require("@noeos/verifactu")).length === 0,
      "CJS_CONSUMER_FAILED",
      "library CJS export surface must be empty in P2",
    );
    assert(
      Object.keys(require("@noeos/verifactu-adapter-kit")).length === 0,
      "CJS_CONSUMER_FAILED",
      "adapter CJS export surface must be empty in P2",
    );
    const bins = await readdir(path.join(consumer, "node_modules/.bin")).catch(() => []);
    assert(
      !bins.includes("noeos-verifactu") && !bins.includes("noeos-verifactu.cmd"),
      "FAKE_CLI_BINARY",
      "P2 consumer unexpectedly installed a CLI binary",
    );
    await writeFile(
      path.join(consumer, "consumer.ts"),
      "import '@noeos/verifactu';\nimport '@noeos/verifactu-adapter-kit';\nimport '@noeos/verifactu-cli';\n",
    );
    typecheckConsumer(consumer);
    return {
      consumerCount: 1,
      installedTarballCount: tarballs.length,
      esmPackages: 3,
      cjsPackages: 2,
      typePackages: 3,
      cliBinaryPresent: false,
      publicBindingCount: 0,
    };
  } finally {
    await rm(consumer, { recursive: true, force: true });
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main("tarball-consumers", () => testTarballConsumers(root));
}
