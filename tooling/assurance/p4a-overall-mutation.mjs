#!/usr/bin/env node
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import ts from "typescript";

const root = resolve(import.meta.dirname, "../..");
const build = resolve(root, "evidence/runs/artifacts/build/verifactu/dist");
const testMap = [
  [
    /contracts\/staged-codec|contracts\/limits/u,
    ["tests/unit/p4-codecs.test.mjs"],
  ],
  [
    /contracts\/configuration/u,
    ["tests/contract/p4-edition-contract.test.mjs"],
  ],
  [
    /contracts\/results|domain\/diagnostics/u,
    [
      "tests/unit/p4-codecs.test.mjs",
      "tests/unit/p4-modes-events-states.test.mjs",
    ],
  ],
  [
    /domain\/date-time/u,
    [
      "tests/unit/p4-values-identities.test.mjs",
      "tests/property/p4-properties.test.mjs",
    ],
  ],
  [
    /domain\/(?:identities|decimal)/u,
    ["tests/unit/p4-values-identities.test.mjs"],
  ],
  [/domain\/context/u, ["tests/security/p4-isolation-redaction.test.mjs"]],
  [
    /domain\/(?:records|corrections|invariants)/u,
    ["tests/unit/p4-records-corrections.test.mjs"],
  ],
  [
    /domain\/(?:mode-tenure|events|states)/u,
    ["tests/unit/p4-modes-events-states.test.mjs"],
  ],
  [
    /domain\/(?:sequences|chains)/u,
    ["tests/unit/p4-sequences-chains.test.mjs"],
  ],
  [/index\.js$/u, ["tests/contract/p4-public-contract.test.mjs"]],
];
const binaryMutations = new Map([
  [ts.SyntaxKind.EqualsEqualsEqualsToken, ["!==", "equality-negation"]],
  [ts.SyntaxKind.ExclamationEqualsEqualsToken, ["===", "equality-negation"]],
  [ts.SyntaxKind.LessThanToken, ["<=", "conditional-boundary"]],
  [ts.SyntaxKind.LessThanEqualsToken, ["<", "conditional-boundary"]],
  [ts.SyntaxKind.GreaterThanToken, [">=", "conditional-boundary"]],
  [ts.SyntaxKind.GreaterThanEqualsToken, [">", "conditional-boundary"]],
  [ts.SyntaxKind.AmpersandAmpersandToken, ["||", "boolean-substitution"]],
  [ts.SyntaxKind.BarBarToken, ["&&", "boolean-substitution"]],
  [ts.SyntaxKind.PlusToken, ["-", "arithmetic-operator"]],
  [ts.SyntaxKind.MinusToken, ["+", "arithmetic-operator"]],
  [ts.SyntaxKind.AsteriskToken, ["/", "arithmetic-operator"]],
  [ts.SyntaxKind.SlashToken, ["*", "arithmetic-operator"]],
  [ts.SyntaxKind.PercentToken, ["*", "arithmetic-operator"]],
]);

async function javascriptFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await javascriptFiles(path)));
    else if (entry.isFile() && entry.name.endsWith(".js")) files.push(path);
  }
  return files.sort();
}

function testsFor(path) {
  const normalized = path.replaceAll("\\", "/");
  const match = testMap.find(([pattern]) => pattern.test(normalized));
  if (match === undefined)
    throw new Error(`P4A_MUTATION_TEST_MAP: ${normalized}`);
  return match[1];
}

function discoverMutants(path, source) {
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const mutants = [];
  const add = (
    node,
    replacement,
    operator,
    start = node.getStart(sourceFile),
    end = node.end,
  ) => {
    if (source.slice(start, end) === replacement) return;
    mutants.push({
      path,
      start,
      end,
      original: source.slice(start, end),
      replacement,
      operator,
      line: sourceFile.getLineAndCharacterOfPosition(start).line + 1,
    });
  };
  const visit = (node) => {
    if (ts.isBinaryExpression(node)) {
      const mutation = binaryMutations.get(node.operatorToken.kind);
      if (mutation !== undefined)
        add(
          node.operatorToken,
          mutation[0],
          mutation[1],
          node.operatorToken.getStart(sourceFile),
          node.operatorToken.end,
        );
      if (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
        add(
          node,
          source.slice(node.left.getStart(sourceFile), node.left.end),
          "optional-removal",
        );
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword)
      add(node, "false", "boolean-substitution");
    if (node.kind === ts.SyntaxKind.FalseKeyword)
      add(node, "true", "boolean-substitution");
    if (
      ts.isReturnStatement(node) &&
      node.expression !== undefined &&
      node.expression.kind !== ts.SyntaxKind.TrueKeyword &&
      node.expression.kind !== ts.SyntaxKind.FalseKeyword
    )
      add(node.expression, "undefined", "return-value");
    if (
      (ts.isPropertyAccessExpression(node) ||
        ts.isElementAccessExpression(node)) &&
      node.questionDotToken !== undefined
    )
      add(
        node.questionDotToken,
        ".",
        "optional-removal",
        node.questionDotToken.getStart(sourceFile),
        node.questionDotToken.end,
      );
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return mutants;
}

const files = await javascriptFiles(build);
const sources = new Map();
const mutants = [];
for (const path of files) {
  const source = await readFile(path, "utf8");
  sources.set(path, source);
  mutants.push(...discoverMutants(path, source));
}
const deduplicated = [
  ...new Map(
    mutants.map((mutant) => [
      `${mutant.path}:${mutant.start}:${mutant.end}:${mutant.replacement}`,
      mutant,
    ]),
  ).values(),
];
const temporary = await mkdtemp(join(tmpdir(), "verifactu-p4a-overall-"));
const isolatedEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) => name !== "NODE_TEST_CONTEXT" && name !== "VERIFACTU_TEST_ENTRY",
  ),
);
const results = [];
try {
  for (const [index, mutant] of deduplicated.entries()) {
    const mutantRoot = resolve(temporary, String(index).padStart(4, "0"));
    await cp(build, mutantRoot, { recursive: true });
    const relativePath = relative(build, mutant.path);
    const target = resolve(mutantRoot, relativePath);
    const source = sources.get(mutant.path);
    if (source === undefined)
      throw new Error(`P4A_MUTATION_SOURCE: ${mutant.path}`);
    await writeFile(
      target,
      `${source.slice(0, mutant.start)}${mutant.replacement}${source.slice(mutant.end)}`,
      "utf8",
    );
    const tests = testsFor(relativePath);
    const execution = spawnSync(process.execPath, ["--test", ...tests], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...isolatedEnvironment,
        VERIFACTU_TEST_ENTRY: pathToFileURL(resolve(mutantRoot, "index.js"))
          .href,
      },
      timeout: 10_000,
    });
    const timedOut = execution.error?.code === "ETIMEDOUT";
    const killed = execution.status !== 0 && execution.error === undefined;
    results.push({
      id: `P4-OVERALL-${String(index + 1).padStart(4, "0")}`,
      path: relativePath.replaceAll("\\", "/"),
      line: mutant.line,
      operator: mutant.operator,
      original: mutant.original,
      replacement: mutant.replacement,
      killed,
      timedOut,
    });
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}

const killed = results.filter((result) => result.killed).length;
const timeouts = results.filter((result) => result.timedOut).length;
const survivors = results.filter(
  (result) => !result.killed && !result.timedOut,
);
const killedPercent =
  results.length === 0 ? 0 : (killed * 100) / results.length;
const report = {
  schemaVersion: 1,
  productionFiles: files.length,
  operators: [...new Set(results.map((result) => result.operator))].sort(),
  population: results.length,
  killed,
  killedPercent: Number(killedPercent.toFixed(2)),
  survivors,
  compileErrors: 0,
  testErrors: 0,
  timeouts,
  noCoverage: 0,
};
process.stdout.write(`${JSON.stringify(report)}\n`);
if (results.length === 0 || killedPercent < 95 || timeouts !== 0)
  throw new Error(
    `P4A_OVERALL_MUTATION_THRESHOLD: killed=${killedPercent.toFixed(2)} timeouts=${timeouts}`,
  );
