import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import ts from "typescript";

const operatorNames = [
  "conditional-boundary",
  "boolean-substitution",
  "arithmetic-operator",
  "equality-negation",
  "return-value",
  "optional-removal",
];

const swaps = new Map([
  ["<", ["<="]],
  ["<=", ["<"]],
  [">", [">="]],
  [">=", [">"]],
  ["&&", ["||"]],
  ["||", ["&&"]],
  ["and", ["or"]],
  ["or", ["and"]],
  ["+", ["-", "*"]],
  ["-", ["+", "/"]],
  ["*", ["/", "+"]],
  ["/", ["*", "-"]],
  ["%", ["*", "/"]],
  ["===", ["!=="]],
  ["!==", ["==="]],
  ["==", ["!="]],
  ["!=", ["=="]],
  ["true", ["false"]],
  ["false", ["true"]],
  ["True", ["False"]],
  ["False", ["True"]],
]);

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function mutationId(path, operator, start, before, after) {
  return `P4-OM-${digest(`${path}\0${operator}\0${start}\0${before}\0${after}`).slice(0, 20)}`;
}

function recordMutation(output, path, source, operator, start, end, after) {
  const before = source.slice(start, end);
  if (before === after) return;
  output.push({
    id: mutationId(path, operator, start, before, after),
    operator,
    module: path,
    start,
    end,
    line: source.slice(0, start).split("\n").length,
    before,
    after,
    sourceSha256: digest(source),
    mutatedSha256: digest(
      `${source.slice(0, start)}${after}${source.slice(end)}`,
    ),
  });
}

function operatorForToken(token) {
  if (["<", "<=", ">", ">="].includes(token)) return "conditional-boundary";
  if (
    ["&&", "||", "and", "or", "true", "false", "True", "False"].includes(token)
  )
    return "boolean-substitution";
  if (["+", "-", "*", "/", "%"].includes(token)) return "arithmetic-operator";
  if (["===", "!==", "==", "!="].includes(token)) return "equality-negation";
  return undefined;
}

function isTypePosition(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isTypeNode(current)) return true;
    if (ts.isExpression(current) || ts.isStatement(current)) return false;
  }
  return false;
}

function astMutations(path, source) {
  const kind = path.endsWith(".mjs") ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const file = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  const output = [];
  const visit = (node) => {
    if (ts.isBinaryExpression(node)) {
      const token = node.operatorToken.getText(file);
      const operator = operatorForToken(token);
      if (operator)
        for (const replacement of swaps.get(token) ?? [])
          recordMutation(
            output,
            path,
            source,
            operator,
            node.operatorToken.getStart(file),
            node.operatorToken.end,
            replacement,
          );
    }
    if (
      ts.isBooleanLiteral(node) &&
      !isTypePosition(node) &&
      node.parent &&
      ["true", "false"].includes(node.getText(file))
    )
      recordMutation(
        output,
        path,
        source,
        "boolean-substitution",
        node.getStart(file),
        node.end,
        node.kind === ts.SyntaxKind.TrueKeyword ? "false" : "true",
      );
    if (
      ts.isReturnStatement(node) &&
      node.expression &&
      (node.expression.kind === ts.SyntaxKind.TrueKeyword ||
        node.expression.kind === ts.SyntaxKind.FalseKeyword)
    )
      recordMutation(
        output,
        path,
        source,
        "return-value",
        node.expression.getStart(file),
        node.expression.end,
        node.expression.kind === ts.SyntaxKind.TrueKeyword ? "false" : "true",
      );
    if (
      (ts.isPropertyAccessExpression(node) ||
        ts.isElementAccessExpression(node)) &&
      node.questionDotToken
    )
      recordMutation(
        output,
        path,
        source,
        "optional-removal",
        node.questionDotToken.getStart(file),
        node.questionDotToken.end,
        ".",
      );
    ts.forEachChild(node, visit);
  };
  visit(file);
  return output;
}

function tokenMutations(path, source) {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    true,
    ts.LanguageVariant.Standard,
    source,
  );
  const tokens = [];
  let kind = scanner.scan();
  while (kind !== ts.SyntaxKind.EndOfFileToken) {
    tokens.push({
      kind,
      text: scanner.getTokenText(),
      start: scanner.getTokenPos(),
      end: scanner.getTextPos(),
    });
    kind = scanner.scan();
  }
  const output = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const operator = operatorForToken(token.text);
    if (operator) {
      for (const replacement of swaps.get(token.text) ?? []) {
        if (operator === "arithmetic-operator") {
          const previous = tokens[index - 1];
          const next = tokens[index + 1];
          const canEndOperand =
            previous &&
            (previous.kind === ts.SyntaxKind.Identifier ||
              previous.kind === ts.SyntaxKind.NumericLiteral ||
              previous.kind === ts.SyntaxKind.StringLiteral ||
              [")", "]", "}"].includes(previous.text));
          const canStartOperand =
            next &&
            (next.kind === ts.SyntaxKind.Identifier ||
              next.kind === ts.SyntaxKind.NumericLiteral ||
              next.kind === ts.SyntaxKind.StringLiteral ||
              ["(", "[", "{"].includes(next.text));
          if (!canEndOperand || !canStartOperand) continue;
        }
        recordMutation(
          output,
          path,
          source,
          operator,
          token.start,
          token.end,
          replacement,
        );
      }
    }
    const isBoolean = ["true", "false", "True", "False"].includes(token.text);
    const isReturnedLiteral = tokens[index - 1]?.text === "return" && isBoolean;
    if (isReturnedLiteral)
      recordMutation(
        output,
        path,
        source,
        "return-value",
        token.start,
        token.end,
        swaps.get(token.text)[0],
      );
  }
  return output;
}

function pythonTokens(path, source) {
  const tokenize = String.raw`
import io, json, sys, tokenize
source = sys.stdin.buffer.read().decode("utf-8")
lines = source.splitlines(keepends=True)
starts = [0]
for line in lines: starts.append(starts[-1] + len(line.encode('utf-16-le')) // 2)
tokens = []
for item in tokenize.generate_tokens(io.StringIO(source).readline):
    if item.type in (tokenize.OP, tokenize.NAME, tokenize.NUMBER, tokenize.STRING):
        start_line = lines[item.start[0] - 1]
        end_line = lines[item.end[0] - 1]
        start = starts[item.start[0] - 1] + len(start_line[:item.start[1]].encode('utf-16-le')) // 2
        end = starts[item.end[0] - 1] + len(end_line[:item.end[1]].encode('utf-16-le')) // 2
        tokens.append({"text": item.string, "type": tokenize.tok_name[item.type], "start": start, "end": end})
sys.stdout.buffer.write(json.dumps(tokens, separators=(",", ":")).encode("ascii"))
`;
  const result = spawnSync(
    process.env.VERIFACTU_PYTHON ?? "python3",
    ["-I", "-c", tokenize],
    {
      input: source,
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  if (result.status !== 0)
    throw new Error(`P4_MUTATION_PYTHON_TOKENIZE: ${path}: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

export function pythonMutations(path, source) {
  const tokens = pythonTokens(path, source);
  const output = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (source.slice(token.start, token.end) !== token.text)
      throw new Error(
        `P4_MUTATION_PYTHON_TOKEN_SPAN: ${path}:${token.start}-${token.end}`,
      );
    const operator = operatorForToken(token.text);
    if (
      operator &&
      (token.type === "OP" ||
        (token.type === "NAME" && ["and", "or"].includes(token.text)))
    ) {
      for (const replacement of swaps.get(token.text) ?? []) {
        if (operator === "arithmetic-operator") {
          const previous = tokens[index - 1];
          const next = tokens[index + 1];
          const canEndOperand =
            (previous &&
              ["NAME", "NUMBER", "STRING"].includes(previous.type)) ||
            [")", "]", "}"].includes(previous?.text);
          const canStartOperand =
            (next && ["NAME", "NUMBER", "STRING"].includes(next.type)) ||
            ["(", "[", "{"].includes(next?.text);
          if (!canEndOperand || !canStartOperand) continue;
        }
        recordMutation(
          output,
          path,
          source,
          operator,
          token.start,
          token.end,
          replacement,
        );
      }
    }
    if (token.type === "NAME" && ["True", "False"].includes(token.text))
      recordMutation(
        output,
        path,
        source,
        "boolean-substitution",
        token.start,
        token.end,
        token.text === "True" ? "False" : "True",
      );
    if (
      token.type === "NAME" &&
      ["True", "False"].includes(token.text) &&
      tokens[index - 1]?.text === "return"
    )
      recordMutation(
        output,
        path,
        source,
        "return-value",
        token.start,
        token.end,
        token.text === "True" ? "False" : "True",
      );
  }
  return output;
}

async function javaAstMutations(root, path, source) {
  const temporary = await mkdtemp(join(tmpdir(), "verifactu-p4-javacatalog-"));
  const retainedCandidateDirs = new Set();
  try {
    const helperPath = resolve(
      root,
      "tooling/assurance/P4JavaMutationCatalog.java",
    );
    const classes = join(temporary, "classes");
    await mkdir(classes, { recursive: true });
    const javac =
      process.env.VERIFACTU_JAVAC ??
      (process.env.JAVA_HOME
        ? resolve(
            process.env.JAVA_HOME,
            "bin",
            process.platform === "win32" ? "javac.exe" : "javac",
          )
        : "javac");
    const java =
      process.env.VERIFACTU_JAVA ??
      (process.env.JAVA_HOME
        ? resolve(
            process.env.JAVA_HOME,
            "bin",
            process.platform === "win32" ? "java.exe" : "java",
          )
        : "java");
    const compile = spawnSync(
      javac,
      ["--release", "21", "-d", classes, helperPath],
      {
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024,
        timeout: 60_000,
      },
    );
    if (compile.status !== 0)
      throw new Error(`P4_JAVA_MUTATION_CATALOG_COMPILE: ${compile.stderr}`);
    const execute = spawnSync(
      java,
      ["-cp", classes, "P4JavaMutationCatalog", resolve(root, path)],
      {
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024,
        timeout: 30_000,
      },
    );
    if (execute.status !== 0)
      throw new Error(`P4_JAVA_MUTATION_CATALOG_PARSE: ${execute.stderr}`);
    const mutations = JSON.parse(execute.stdout.trim()).map((mutation) => {
      const result = { ...mutation };
      result.id = mutationId(
        path,
        result.operator,
        result.start,
        result.before,
        result.after,
      );
      result.module = path;
      result.line = source.slice(0, result.start).split("\n").length;
      result.sourceSha256 = digest(source);
      result.mutatedSha256 = digest(
        `${source.slice(0, result.start)}${result.after}${source.slice(result.end)}`,
      );
      return result;
    });
    const exclusions = [];
    const compilable = [];
    const compiledClasses = new Map();
    for (const mutation of mutations) {
      const candidateDir = await mkdtemp(
        join(tmpdir(), "verifactu-p4-java-preflight-"),
      );
      try {
        const classes = join(candidateDir, "classes");
        await mkdir(classes, { recursive: true });
        const javaSource = join(candidateDir, "DssBridge.java");
        await writeFile(
          javaSource,
          `${source.slice(0, mutation.start)}${mutation.after}${source.slice(mutation.end)}`,
        );
        const javac =
          process.env.VERIFACTU_JAVAC ??
          (process.env.JAVA_HOME
            ? resolve(
                process.env.JAVA_HOME,
                "bin",
                process.platform === "win32" ? "javac.exe" : "javac",
              )
            : "javac");
        const jar =
          process.env.VERIFACTU_DSS_JAR ??
          resolve(
            root,
            "internal/xades-provider/dss/target/verifactu-xades-provider-0.0.0-development.jar",
          );
        const preflight = spawnSync(
          javac,
          ["--release", "21", "-cp", jar, "-d", classes, javaSource],
          {
            encoding: "utf8",
            maxBuffer: 4 * 1024 * 1024,
            timeout: 60_000,
          },
        );
        if (preflight.error || preflight.signal || preflight.status === null)
          throw new Error(
            `P4_JAVA_MUTATION_PREFLIGHT: ${preflight.error?.message ?? preflight.signal ?? "no compiler status"}`,
          );
        if (preflight.status === 0) {
          compilable.push(mutation);
          compiledClasses.set(mutation.id, classes);
          retainedCandidateDirs.add(candidateDir);
          continue;
        }
        const diagnostic = preflight.stderr
          .replaceAll(candidateDir, "<temporary>")
          .trim();
        if (!/\berror:/u.test(diagnostic))
          throw new Error(
            `P4_JAVA_MUTATION_PREFLIGHT_FAILURE ${mutation.id}: ${diagnostic.slice(0, 3000)}`,
          );
        exclusions.push({
          ...mutation,
          reason:
            "This operator application does not produce compilable Java under the admitted JDK 21 and pinned DSS classpath.",
          compilerDiagnostic: diagnostic.slice(0, 3000),
        });
      } finally {
        if (!retainedCandidateDirs.has(candidateDir))
          await rm(candidateDir, { recursive: true, force: true });
      }
    }
    return {
      mutations: compilable,
      exclusions,
      compiledClasses,
      cleanup: async () => {
        await Promise.all(
          [...retainedCandidateDirs].map((directory) =>
            rm(directory, { recursive: true, force: true }),
          ),
        );
      },
    };
  } catch (error) {
    await Promise.all(
      [...retainedCandidateDirs].map((directory) =>
        rm(directory, { recursive: true, force: true }),
      ),
    );
    throw error;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

export async function discoverOverallMutationCatalog(root, plan) {
  const catalog = [];
  const excludedApplications = [];
  const modulePopulation = [];
  const sourceDigests = new Map();
  const precompiledJavaClasses = new Map();
  const cleanupJavaPreflights = [];
  for (const module of plan.productionModules) {
    const source = await readFile(resolve(root, module), "utf8");
    const digestValue = digest(source);
    sourceDigests.set(module, digestValue);
    let mutations;
    if (/\.(?:ts|mjs)$/u.test(module)) mutations = astMutations(module, source);
    else if (module.endsWith(".py"))
      mutations = pythonMutations(module, source);
    else if (module.endsWith(".java")) {
      const javaCatalog = await javaAstMutations(root, module, source);
      mutations = javaCatalog.mutations;
      excludedApplications.push(...javaCatalog.exclusions);
      for (const [id, classes] of javaCatalog.compiledClasses)
        precompiledJavaClasses.set(id, classes);
      cleanupJavaPreflights.push(javaCatalog.cleanup);
    } else mutations = tokenMutations(module, source);
    const unique = new Map(
      mutations.map((mutation) => [mutation.id, mutation]),
    );
    const moduleMutations = [...unique.values()].sort(
      (left, right) =>
        left.start - right.start || left.operator.localeCompare(right.operator),
    );
    catalog.push(...moduleMutations);
    modulePopulation.push({
      module,
      sourceSha256: digestValue,
      applications: moduleMutations.length,
      discoveredApplications:
        moduleMutations.length +
        excludedApplications.filter((mutation) => mutation.module === module)
          .length,
      excludedApplications: excludedApplications.filter(
        (mutation) => mutation.module === module,
      ).length,
    });
  }
  return {
    operators: [...operatorNames],
    discoveredModules: [...plan.productionModules].sort(),
    modulePopulation,
    excludedApplications,
    mutants: catalog,
    sourceDigests,
    precompiledJavaClasses,
    cleanup: async () => {
      await Promise.all(cleanupJavaPreflights.map((cleanup) => cleanup()));
    },
  };
}

export function applyOverallMutation(source, mutation) {
  if (
    source.slice(mutation.start, mutation.end) !== mutation.before ||
    digest(source) !== mutation.sourceSha256
  )
    throw new Error(`P4_MUTATION_SOURCE_DRIFT: ${mutation.id}`);
  return `${source.slice(0, mutation.start)}${mutation.after}${source.slice(mutation.end)}`;
}
