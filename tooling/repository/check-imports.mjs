#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";
import { assert, fail, main, sortedUnique, validateJsonFile } from "../lib/policy.mjs";

async function sourceFiles(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await sourceFiles(absolute)));
    else if (entry.isFile() && /\.(?:cts|mts|ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts"))
      output.push(absolute);
  }
  return output;
}

function externalPackage(specifier) {
  if (specifier.startsWith("@")) return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/", 1)[0];
}

function extractSpecifiers(source, file) {
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const found = [];
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      assert(ts.isStringLiteral(node.moduleSpecifier), "NON_LITERAL_IMPORT", `non-literal import/export in ${file}`);
      found.push(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      assert(
        node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]),
        "NON_LITERAL_IMPORT",
        `dynamic import must be one string literal in ${file}`,
      );
      found.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  return found;
}

function resolveRelative(file, specifier, known) {
  const base = path.resolve(path.dirname(file), specifier);
  const sourceBase = base.replace(/\.(?:mjs|cjs|js|jsx)$/i, "");
  const candidates = [
    base,
    sourceBase,
    `${sourceBase}.ts`,
    `${sourceBase}.tsx`,
    `${sourceBase}.mts`,
    `${sourceBase}.cts`,
    path.join(base, "index.ts"),
  ];
  return candidates.find((candidate) => known.has(candidate));
}

export function validateGraph(entries, policy, root) {
  const known = new Set(entries.map(({ file }) => path.resolve(root, file)));
  const graph = new Map([...known].map((file) => [file, []]));
  let edgeCount = 0;
  for (const entry of entries) {
    const absoluteFile = path.resolve(root, entry.file);
    const relativeFile = path.relative(root, absoluteFile).split(path.sep).join("/");
    const productionRoot = policy.productionRoots.find(
      (candidate) => relativeFile === candidate || relativeFile.startsWith(`${candidate}/`),
    );
    assert(productionRoot, "SOURCE_OUTSIDE_ROOT", `production source has no import rule: ${relativeFile}`);
    const rule = policy.packageRules[productionRoot];
    assert(rule, "MISSING_IMPORT_RULE", `missing package import rule: ${productionRoot}`);
    for (const specifier of extractSpecifiers(entry.source, relativeFile)) {
      edgeCount += 1;
      assert(
        !policy.globallyForbiddenSpecifiers.some((value) => specifier === value || specifier.startsWith(`${value}/`)),
        "FORBIDDEN_DEEP_IMPORT",
        `globally forbidden import ${specifier} in ${relativeFile}`,
      );
      assert(
        !policy.forbiddenProductionSegments.some((segment) => `/${specifier}/`.includes(segment)),
        "FORBIDDEN_IMPORT_SEGMENT",
        `forbidden import segment in ${specifier}`,
      );
      if (specifier.startsWith(".")) {
        assert(
          !(rule.forbiddenRelativePrefixes ?? []).some(
            (prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`),
          ),
          "BOUNDARY_ESCAPE",
          `forbidden relative boundary crossing ${specifier} in ${relativeFile}`,
        );
        const resolved = resolveRelative(absoluteFile, specifier, known);
        assert(resolved, "UNRESOLVED_RELATIVE_IMPORT", `cannot resolve ${specifier} from ${relativeFile}`);
        graph.get(absoluteFile).push(resolved);
      } else if (specifier.startsWith("node:")) {
        assert(
          (rule.allowedBuiltins ?? []).includes(specifier),
          "BUILTIN_NOT_ALLOWED",
          `builtin ${specifier} is not admitted in ${productionRoot}`,
        );
        assert(
          !(rule.forbiddenBuiltins ?? []).includes(specifier),
          "BUILTIN_FORBIDDEN",
          `builtin ${specifier} is forbidden in ${productionRoot}`,
        );
      } else {
        const packageName = externalPackage(specifier);
        assert(
          (rule.allowedExternal ?? []).includes(specifier) || (rule.allowedExternal ?? []).includes(packageName),
          "UNDECLARED_EXTERNAL_IMPORT",
          `external import ${specifier} is not admitted in ${productionRoot}`,
        );
      }
    }
  }
  const visiting = new Set();
  const visited = new Set();
  const visit = (node, trail) => {
    if (visiting.has(node))
      fail("IMPORT_CYCLE", `import cycle: ${[...trail, node].map((item) => path.relative(root, item)).join(" -> ")}`);
    if (visited.has(node)) return;
    visiting.add(node);
    for (const next of graph.get(node) ?? []) visit(next, [...trail, node]);
    visiting.delete(node);
    visited.add(node);
  };
  for (const node of graph.keys()) visit(node, []);
  return { sourceFileCount: entries.length, importEdgeCount: edgeCount };
}

export async function checkImports(root) {
  const policy = await validateJsonFile(
    root,
    "config/repository/import-rules.json",
    "config/repository/import-rules.schema.json",
  );
  const entries = [];
  for (const productionRoot of policy.productionRoots) {
    for (const file of await sourceFiles(path.join(root, productionRoot))) {
      entries.push({ file: path.relative(root, file), source: await readFile(file, "utf8") });
    }
  }
  const evidence = validateGraph(entries, policy, root);
  return { policyId: policy.policyId, ...evidence, productionRoots: sortedUnique(policy.productionRoots) };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main("architecture-imports", () => checkImports(root));
