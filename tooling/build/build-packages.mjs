#!/usr/bin/env node
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { assert, main, stableJson, validateJsonFile } from "../lib/policy.mjs";

function safeOutputRoot(root, packageDirectory) {
  const packageRoot = path.resolve(root, packageDirectory);
  const output = path.resolve(packageRoot, "dist");
  assert(
    output.startsWith(`${packageRoot}${path.sep}`) && path.basename(output) === "dist",
    "UNSAFE_CLEAN_TARGET",
    `unsafe build root ${output}`,
  );
  return output;
}

function writeOutput(filename, content) {
  mkdirSync(path.dirname(filename), { recursive: true, mode: 0o755 });
  writeFileSync(filename, content, { encoding: "utf8", mode: 0o644 });
}

function normalizeSourceMap(text) {
  const map = JSON.parse(text);
  delete map.sourceRoot;
  delete map.sourcesContent;
  map.sources = map.sources.map((source) => source.replaceAll("\\", "/").split("/").at(-1));
  return stableJson(map);
}

function emitJavaScript(source, sourceName, output, moduleKind) {
  const result = ts.transpileModule(source, {
    fileName: sourceName,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2024,
      module: moduleKind,
      sourceMap: true,
      inlineSources: false,
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    },
  });
  const errors = (result.diagnostics ?? []).filter(({ category }) => category === ts.DiagnosticCategory.Error);
  assert(
    errors.length === 0,
    "BUILD_TRANSPILE_FAILED",
    ts.formatDiagnostics(errors, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: () => ".",
      getNewLine: () => "\n",
    }),
  );
  writeOutput(
    output,
    result.outputText.replace(/\/\/# sourceMappingURL=.*$/m, `//# sourceMappingURL=${path.basename(output)}.map`),
  );
  writeOutput(`${output}.map`, normalizeSourceMap(result.sourceMapText));
}

function emitDeclarations(entry, sourceRoot, outputRoot) {
  const options = {
    target: ts.ScriptTarget.ES2024,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    declaration: true,
    declarationMap: true,
    emitDeclarationOnly: true,
    strict: true,
    exactOptionalPropertyTypes: true,
    noUncheckedIndexedAccess: true,
    rootDir: sourceRoot,
    outDir: outputRoot,
    types: [],
    skipLibCheck: false,
    newLine: ts.NewLineKind.LineFeed,
  };
  const host = ts.createCompilerHost(options);
  host.writeFile = (filename, content) =>
    writeOutput(filename, filename.endsWith(".map") ? normalizeSourceMap(content) : content);
  const program = ts.createProgram([entry], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert(
    diagnostics.length === 0,
    "DECLARATION_BUILD_FAILED",
    ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: () => ".",
      getNewLine: () => "\n",
    }),
  );
  const emitted = program.emit(undefined, host.writeFile, undefined, true);
  assert(!emitted.emitSkipped, "DECLARATION_BUILD_SKIPPED", `declaration build skipped for ${entry}`);
}

export async function buildPackages(root) {
  const policy = await validateJsonFile(root, "config/packages/content.json", "config/packages/content.schema.json");
  const built = [];
  for (const contract of policy.packages) {
    const outputRoot = safeOutputRoot(root, contract.directory);
    rmSync(outputRoot, { recursive: true, force: true });
    const packageRoot = path.resolve(root, contract.directory);
    const entry = path.join(packageRoot, contract.entry);
    const source = await readFile(entry, "utf8");
    const relativeEntry = path.relative(path.join(packageRoot, "src"), entry);
    const javascriptName = relativeEntry.replace(/\.ts$/, ".js");
    if (contract.formats.includes("esm"))
      emitJavaScript(source, relativeEntry, path.join(outputRoot, "esm", javascriptName), ts.ModuleKind.ES2022);
    if (contract.formats.includes("cjs")) {
      emitJavaScript(source, relativeEntry, path.join(outputRoot, "cjs", javascriptName), ts.ModuleKind.CommonJS);
      writeOutput(path.join(outputRoot, "cjs/package.json"), stableJson({ type: "commonjs" }));
    }
    emitDeclarations(entry, path.join(packageRoot, "src"), path.join(outputRoot, "types"));
    built.push({ name: contract.name, formats: contract.formats, entry: contract.entry });
  }
  return { policyId: policy.policyId, packageCount: built.length, packages: built };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main("package-build", () => buildPackages(root));
