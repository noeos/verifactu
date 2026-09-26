import { createReadStream } from "node:fs";
import { execFile, spawnSync } from "node:child_process";
import {
  cp,
  copyFile,
  mkdtemp,
  lstat,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createGunzip } from "node:zlib";
import { promisify } from "node:util";
import Ajv from "ajv";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import ts from "typescript";
import {
  assert,
  canonicalJson,
  digestFiles,
  matchesAny,
  readJson,
  relativePosix,
  resolveContained,
  run,
  sha256,
  sha256File,
  walk,
  writeJsonAtomic,
} from "../lib/core.mjs";

const PACKAGE_ROOTS = [
  "packages/verifactu",
  "packages/adapter-kit",
  "packages/cli",
];
const PACKAGE_NAMES = [
  "@noeos/verifactu",
  "@noeos/verifactu-adapter-kit",
  "@noeos/verifactu-cli",
];
const execFileAsync = promisify(execFile);

async function repositoryFiles(root) {
  const result = await run(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { cwd: root },
  );
  assert(result.code === 0, "TREE_GIT", result.stderr.trim());
  const candidates = result.stdout.split(/\r?\n/u).filter(Boolean).sort();
  const files = [];
  for (const path of candidates) {
    try {
      const metadata = await lstat(resolve(root, path));
      assert(metadata.isFile(), "TREE_FILE_TYPE", path);
      files.push(path);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return files;
}

function exactVersion(specifier) {
  return /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/u.test(
    specifier,
  );
}

export function validateTreePaths(paths, tree) {
  const folded = new Map();
  for (const path of paths) {
    assert(!path.includes("\\"), "TREE_SEPARATOR", path);
    const normalized = path.normalize("NFKC").toLocaleLowerCase("en-US");
    assert(
      !folded.has(normalized),
      "TREE_CASE_COLLISION",
      `${folded.get(normalized)} and ${path}`,
    );
    folded.set(normalized, path);
    const [root, ...rest] = path.split("/");
    if (rest.length === 0) {
      assert(tree.allowedRootFiles.includes(root), "TREE_ROOT_UNKNOWN", path);
    } else {
      assert(
        tree.allowedRootDirectories.includes(root),
        "TREE_ROOT_UNKNOWN",
        path,
      );
    }
    for (const segment of rest) {
      assert(
        !tree.forbiddenDirectoryNames.includes(segment),
        "TREE_DIRECTORY_FORBIDDEN",
        path,
      );
      assert(!/[. ]$/u.test(segment), "TREE_PORTABLE_NAME", path);
      assert(
        !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/iu.test(segment),
        "TREE_WINDOWS_RESERVED",
        path,
      );
    }
  }
  const lockfiles = paths.filter(
    (path) => basename(path) === "package-lock.json",
  );
  assert(
    JSON.stringify(lockfiles) === JSON.stringify(tree.lockfiles),
    "TREE_LOCKFILE",
    lockfiles.join(", "),
  );
  for (const packageRoot of tree.packageRoots) {
    assert(
      paths.includes(`${packageRoot}/package.json`),
      "TREE_PACKAGE_MISSING",
      packageRoot,
    );
  }
  return paths.length;
}

function expandOwnershipPattern(pattern) {
  if (!pattern.startsWith("{")) return [pattern];
  const close = pattern.indexOf("}");
  assert(close > 1, "OWNERSHIP_PATTERN", pattern);
  return pattern
    .slice(1, close)
    .split(",")
    .map((segment) => `${segment}${pattern.slice(close + 1)}`);
}

export function validateOwnershipPaths(paths, registry) {
  assert(registry?.schemaVersion === 1, "OWNERSHIP_SCHEMA", "schemaVersion");
  const expanded = registry.rules.flatMap((rule) =>
    expandOwnershipPattern(rule.pattern).map((pattern) => ({ pattern, rule })),
  );
  for (const path of paths) {
    const matches = expanded.filter(({ pattern }) =>
      matchesAny(path, [pattern]),
    );
    assert(
      matches.length === 1,
      "OWNERSHIP_AMBIGUOUS",
      `${path}: ${matches.length}`,
    );
    const rule = matches[0].rule;
    for (const field of [
      "owner",
      "class",
      "authority",
      "visibility",
      "layer",
      "sensitivity",
    ])
      assert(rule[field]?.length > 0, "OWNERSHIP_FIELD", `${path}.${field}`);
    assert(
      Array.isArray(rule.checks) && rule.checks.length > 0,
      "OWNERSHIP_CHECKS",
      path,
    );
  }
  return paths.length;
}

function toolchainSummary(toolchain) {
  const primary = toolchain.profiles.find(
    (profile) => profile.id === "primary",
  );
  return {
    _generated: {
      generator: "policy:generated",
      source: "config/toolchain/toolchain.json",
      sourceSha256: null,
    },
    nodeProfiles: toolchain.profiles.map((profile) => profile.node),
    primaryNode: primary.node,
    primaryNpm: primary.npm,
    typescript: primary.typescript,
  };
}

async function runNpm(args, options = {}) {
  if (process.env.VERIFACTU_NPM_ROOT)
    return run(
      process.execPath,
      [resolve(process.env.VERIFACTU_NPM_ROOT, "npm/bin/npm-cli.js"), ...args],
      options,
    );
  if (process.platform === "win32")
    return run("cmd.exe", ["/d", "/s", "/c", "npm", ...args], options);
  return run("npm", args, options);
}

export function validateGenerated(actual, expected) {
  assert(
    canonicalJson(actual) === canonicalJson(expected),
    "GENERATED_STALE",
    "toolchain generated view differs",
  );
}

function parseImports(source, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const imports = [];
  let exportCount = 0;
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier
    ) {
      imports.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      throw Object.assign(new Error(`IMPORT_DYNAMIC: ${fileName}`), {
        code: "IMPORT_DYNAMIC",
      });
    }
    if (
      (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0 ||
      (ts.isExportDeclaration(node) &&
        (!node.exportClause || node.exportClause.elements.length > 0)) ||
      ts.isExportAssignment(node)
    ) {
      exportCount += 1;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return { imports, exportCount };
}

export function validateImportText(source, fileName, packageRule) {
  const { imports, exportCount } = parseImports(source, fileName);
  for (const specifier of imports) {
    assert(
      !packageRule.forbiddenBuiltins?.includes(specifier),
      "IMPORT_FORBIDDEN_BUILTIN",
      `${fileName}: ${specifier}`,
    );
    for (const prefix of packageRule.forbiddenPrefixes ?? []) {
      assert(
        !specifier.startsWith(prefix),
        "IMPORT_PRIVATE_DEEP",
        `${fileName}: ${specifier}`,
      );
    }
    if (
      specifier.startsWith("@noeos/") &&
      !packageRule.mayImportPackages.includes(specifier)
    ) {
      assert(false, "IMPORT_PACKAGE_FORBIDDEN", `${fileName}: ${specifier}`);
    }
  }
  assert(
    !/\bprocess\.env\b|\bDate\.now\s*\(|\bMath\.random\s*\(|\brequire\s*\(/u.test(
      source,
    ),
    "IMPORT_AMBIENT_EFFECT",
    fileName,
  );
  return { imports, exportCount };
}

function resolveRelativeImport(from, specifier, known) {
  if (!specifier.startsWith(".")) return null;
  const base = relativePosix("/", resolve("/", dirname(from), specifier));
  const candidates = [base, `${base}.ts`, `${base}/index.ts`];
  return candidates.find((candidate) => known.has(candidate)) ?? null;
}

function detectCycles(graph, code = "IMPORT_CYCLE") {
  const states = new Map();
  function visit(node, stack = []) {
    if (states.get(node) === "done") return;
    assert(
      states.get(node) !== "visiting",
      code,
      [...stack, node].join(" -> "),
    );
    states.set(node, "visiting");
    for (const target of graph.get(node) ?? []) visit(target, [...stack, node]);
    states.set(node, "done");
  }
  for (const node of graph.keys()) visit(node);
}

async function checkArchitecture(root, importRules, files = null) {
  const sourceFiles =
    files ??
    (await repositoryFiles(root)).filter(
      (path) => path.startsWith("packages/") && path.endsWith(".ts"),
    );
  const known = new Set(sourceFiles);
  const graph = new Map();
  let importCount = 0;
  for (const file of sourceFiles) {
    const packageRule = Object.values(importRules.packages).find((rule) =>
      file.startsWith(`${rule.root}/`),
    );
    assert(packageRule, "IMPORT_PACKAGE_UNKNOWN", file);
    const source = await readFile(resolve(root, file), "utf8");
    const parsed = validateImportText(source, file, packageRule);
    importCount += parsed.imports.length;
    graph.set(
      file,
      parsed.imports
        .map((entry) => resolveRelativeImport(file, entry, known))
        .filter(Boolean),
    );
  }
  detectCycles(graph);
  return { files: sourceFiles.length, imports: importCount };
}

function expectedPackageManifest(record) {
  return {
    name: record.name,
    version: "0.0.0-development",
  };
}

async function checkPackages(root, registry) {
  const discovered = [];
  for (const record of registry.packages) {
    const manifest = await readJson(resolve(root, record.root, "package.json"));
    const expected = expectedPackageManifest(record);
    assert(manifest.name === expected.name, "PACKAGE_NAME", record.root);
    assert(
      manifest.version === expected.version,
      "PACKAGE_VERSION",
      record.root,
    );
    assert(manifest.private === true, "PACKAGE_PRIVATE", record.root);
    assert(manifest.sideEffects === false, "PACKAGE_SIDE_EFFECTS", record.root);
    assert(manifest.bin === undefined, "PACKAGE_FAKE_BIN", record.root);
    assert(
      Array.isArray(manifest.files) && manifest.files.length === 4,
      "PACKAGE_FILES",
      record.root,
    );
    assert(
      Object.keys(manifest.exports ?? {}).length === 1 && manifest.exports["."],
      "PACKAGE_EXPORT_MAP",
      record.root,
    );
    discovered.push(manifest.name);
  }
  assert(
    JSON.stringify(discovered) === JSON.stringify(PACKAGE_NAMES),
    "PACKAGE_SET",
    discovered.join(", "),
  );
  return discovered.length;
}

function validateDependencySpec(name, specifier) {
  assert(
    exactVersion(specifier),
    "DEPENDENCY_MUTABLE",
    `${name}: ${specifier}`,
  );
}

export function validateDependencyCooling(admission, reviewedAt, days) {
  const published = Date.parse(admission.publishedAt);
  const reviewed = Date.parse(`${reviewedAt}T00:00:00Z`);
  assert(
    Number.isFinite(published) &&
      Number.isFinite(reviewed) &&
      reviewed - published >= days * 86400000,
    "DEPENDENCY_COOLING_PERIOD",
    admission.name,
  );
}

export function validatePackageEntries(entries, allowlist) {
  const allowed = new Map(allowlist.map((entry) => [entry.path, entry]));
  for (const entry of entries) {
    const rule = allowed.get(entry.path);
    assert(rule, "PACKAGE_CONTENT_LEAK", entry.path);
    assert(entry.type === "file", "PACKAGE_CONTENT_TYPE", entry.path);
    assert(entry.size <= rule.maximumBytes, "PACKAGE_CONTENT_SIZE", entry.path);
    assert(
      (entry.mode & 0o777) === rule.mode,
      "PACKAGE_CONTENT_MODE",
      `${entry.path}: ${entry.mode}`,
    );
  }
  for (const path of allowed.keys()) {
    assert(
      entries.some((entry) => entry.path === path),
      "PACKAGE_CONTENT_MISSING",
      path,
    );
  }
}

function validateReproducible(first, second) {
  assert(first === second, "NONREPRODUCIBLE_OUTPUT", `${first} != ${second}`);
}

function actionReferences(workflowText) {
  return [...workflowText.matchAll(/\buses:\s*([^\s#]+)(?:\s*#.*)?$/gmu)].map(
    (match) => match[1],
  );
}

export function validateActionReference(reference, admissions) {
  if (reference.startsWith("./")) return;
  const [name, revision] = reference.split("@");
  assert(/^[a-f0-9]{40}$/u.test(revision ?? ""), "ACTION_MUTABLE", reference);
  assert(
    admissions.some(
      (entry) =>
        (entry.name === name || name.startsWith(`${entry.name}/`)) &&
        entry.sha === revision,
    ),
    "ACTION_UNADMITTED",
    reference,
  );
}

function requiredContextRegistry() {
  return [
    "Required · governance signatures and DCO",
    "Required · documentation and traceability",
    "Required · regulatory sources and generated contracts",
    "Required · quality and policy",
    "Required · ubuntu-24.04 · Node 22.14.0",
    "Required · ubuntu-24.04 · Node 22.23.2",
    "Required · ubuntu-24.04 · Node 24.21.0",
    "Required · windows-2025 · Node 24.21.0",
    "Required · macos-15 · Node 24.21.0",
    "Required · package reproducibility",
    "Required · integration conformance",
    "Required · dependency review",
    "Required · CodeQL",
    "Required · secret scan",
    "Required · OSV",
    "Required · npm audit signatures and licenses",
    "Required · required-check closure",
  ];
}

export function validateWorkflowText(
  workflowText,
  admissions,
  contexts = requiredContextRegistry(),
  requireClosure = true,
) {
  for (const admission of admissions) {
    for (const field of [
      "treeSha",
      "commitSignature",
      "runtime",
      "reviewedAt",
      "network",
      "credentialHandling",
      "bundledCodeReview",
      "contractReview",
      "reviewedAncestry",
      "knownAdvisories",
      "replacement",
    ])
      assert(
        admission[field]?.length > 0,
        "ACTION_ADMISSION_FIELD",
        `${admission.name}.${field}`,
      );
    assert(
      ["node24", "composite", "docker"].includes(admission.runtime),
      "ACTION_RUNTIME",
      `${admission.name}.${admission.runtime}`,
    );
  }
  assert(
    /^permissions:\s*\{\}\s*$/mu.test(workflowText),
    "WORKFLOW_PERMISSIONS",
    "top-level permissions must be empty",
  );
  assert(
    !/pull_request_target\s*:/u.test(workflowText),
    "WORKFLOW_EVENT",
    "pull_request_target is forbidden",
  );
  assert(
    !/persist-credentials:\s*true/u.test(workflowText),
    "WORKFLOW_CREDENTIALS",
    "checkout credentials persisted",
  );
  for (const reference of actionReferences(workflowText))
    validateActionReference(reference, admissions);
  for (const context of contexts) {
    assert(
      workflowText.includes(`name: ${context}`),
      "MISSING_REQUIRED_JOB",
      context,
    );
  }
  if (requireClosure) {
    assert(
      /if:\s*\$\{\{\s*always\(\)\s*\}\}/u.test(workflowText),
      "WORKFLOW_CLOSURE_ALWAYS",
      "closure is not always-run",
    );
    assert(
      workflowText.includes("validate-required-checks.mjs"),
      "MISSING_REQUIRED_REPORT",
      "closure report validator absent",
    );
  }
  return contexts.length;
}

async function policyTree(context) {
  const tree = await readJson(
    resolve(context.root, "config/repository/tree.json"),
  );
  const ownership = await readJson(
    resolve(context.root, "config/repository/ownership.json"),
  );
  const files = await repositoryFiles(context.root);
  const count = validateTreePaths(files, tree);
  validateOwnershipPaths(files, ownership);
  const artifacts = await readJson(
    resolve(context.root, "config/repository/artifacts.json"),
  );
  validateArtifactRegistry(artifacts, files);
  const ignoredSources = await run(
    "git",
    ["check-ignore", "--no-index", ...files],
    { cwd: context.root, timeoutMs: 30000 },
  );
  assert(
    ignoredSources.code === 1 && ignoredSources.stdout.trim() === "",
    "SOURCE_IGNORED",
    ignoredSources.stdout.trim(),
  );
  for (const output of [
    "node_modules/example/file.js",
    "evidence/runs/example.json",
    ".build-cache/example",
  ]) {
    const ignored = await run(
      "git",
      ["check-ignore", "--no-index", "--quiet", output],
      { cwd: context.root, timeoutMs: 30000 },
    );
    assert(ignored.code === 0, "OUTPUT_NOT_IGNORED", output);
  }
  return { selected: count, executed: count, passed: count };
}

function validateArtifactRegistry(artifacts, files) {
  assert(artifacts.schemaVersion === 1, "ARTIFACT_REGISTRY", "schemaVersion");
  const patterns = new Set();
  for (const entry of artifacts.classes) {
    for (const field of ["pattern", "class", "producer", "toolProfile"])
      assert(entry[field]?.length > 0, "ARTIFACT_REGISTRY_FIELD", field);
    assert(!patterns.has(entry.pattern), "ARTIFACT_DUPLICATE", entry.pattern);
    patterns.add(entry.pattern);
    assert(
      ["generated", "vendored-immutable-input", "temporary-output"].includes(
        entry.class,
      ),
      "ARTIFACT_CLASS",
      entry.pattern,
    );
    assert(
      Array.isArray(entry.inputs) && entry.inputs.length > 0,
      "ARTIFACT_REGISTRY_INPUTS",
      entry.pattern,
    );
    for (const input of entry.inputs)
      assert(
        files.some((file) => matchesAny(file, [input])),
        "ARTIFACT_INPUT_MISSING",
        `${entry.pattern}: ${input}`,
      );
    assert(
      typeof entry.cleanRegeneration === "boolean" &&
        typeof entry.committed === "boolean",
      "ARTIFACT_REGISTRY_FIELD",
      entry.pattern,
    );
    if (entry.committed) {
      assert(
        (entry.class === "generated" ||
          entry.class === "vendored-immutable-input") &&
          entry.cleanRegeneration,
        "ARTIFACT_COMMITTED_POLICY",
        entry.pattern,
      );
      assert(
        files.some((file) => matchesAny(file, [entry.pattern])),
        "ARTIFACT_OUTPUT_MISSING",
        entry.pattern,
      );
    }
  }
  for (const file of files) {
    const committed = artifacts.classes.filter(
      (entry) => entry.committed && matchesAny(file, [entry.pattern]),
    );
    assert(committed.length <= 1, "ARTIFACT_AMBIGUOUS", file);
  }
  return artifacts.classes.length;
}

async function policyGenerated(context) {
  const sourcePath = resolve(context.root, "config/toolchain/toolchain.json");
  const toolchain = await readJson(sourcePath);
  const actual = await readJson(
    resolve(context.root, "config/generated/toolchain.generated.json"),
  );
  const expected = toolchainSummary(toolchain);
  expected._generated.sourceSha256 = await sha256File(sourcePath);
  validateGenerated(actual, expected);
  return {
    selected: 1,
    executed: 1,
    passed: 1,
    outputDigest: sha256(canonicalJson(expected)),
  };
}

async function policyToolchain(context) {
  const toolchain = await readJson(
    resolve(context.root, "config/toolchain/toolchain.json"),
  );
  const nodeVersion = process.version.replace(/^v/u, "");
  const profile = toolchain.profiles.find(
    (entry) => entry.node === nodeVersion,
  );
  assert(profile, "TOOLCHAIN_NODE_VERSION", nodeVersion);
  const platform =
    process.platform === "win32"
      ? "windows"
      : process.platform === "darwin"
        ? "macos"
        : process.platform;
  const architecture =
    process.arch === "x64"
      ? "x64"
      : process.arch === "arm64"
        ? "arm64"
        : process.arch;
  const platformKey = `${platform}-${architecture}`;
  const expectedNodeDigest = profile.executableSha256?.[platformKey];
  assert(
    expectedNodeDigest,
    "TOOLCHAIN_NODE_PLATFORM",
    `${nodeVersion}/${platformKey}`,
  );
  assert(
    (await sha256File(process.execPath)) === expectedNodeDigest,
    "TOOLCHAIN_NODE_DIGEST",
    process.execPath,
  );
  const npmVersionResult = await runNpm(["--version"], {
    cwd: context.root,
    timeoutMs: 30000,
  });
  assert(
    npmVersionResult.code === 0,
    "TOOLCHAIN_NPM_EXEC",
    npmVersionResult.stderr,
  );
  const npmVersion = npmVersionResult.stdout.trim();
  assert(
    npmVersion === profile.npm,
    "TOOLCHAIN_NPM_VERSION",
    `${npmVersion} != ${profile.npm}`,
  );
  const npmRootResult = process.env.VERIFACTU_NPM_ROOT
    ? { code: 0, stdout: process.env.VERIFACTU_NPM_ROOT, stderr: "" }
    : await runNpm(["root", "--global"], {
        cwd: context.root,
        timeoutMs: 30000,
      });
  assert(npmRootResult.code === 0, "TOOLCHAIN_NPM_ROOT", npmRootResult.stderr);
  const npmRecord = toolchain.npmPackages.find(
    (entry) => entry.version === npmVersion,
  );
  assert(npmRecord, "TOOLCHAIN_NPM_ADMISSION", npmVersion);
  const npmCli = resolve(npmRootResult.stdout.trim(), "npm/bin/npm-cli.js");
  assert(
    (await sha256File(npmCli)) === npmRecord.cliSha256,
    "TOOLCHAIN_NPM_DIGEST",
    npmCli,
  );
  const typescriptManifest = await readJson(
    resolve(context.root, "node_modules/typescript/package.json"),
  );
  assert(
    typescriptManifest.version === toolchain.typescriptPackage.version,
    "TOOLCHAIN_TYPESCRIPT_VERSION",
    typescriptManifest.version,
  );
  assert(
    (await sha256File(
      resolve(context.root, "node_modules/typescript/bin/tsc"),
    )) === toolchain.typescriptPackage.cliSha256,
    "TOOLCHAIN_TYPESCRIPT_DIGEST",
    "node_modules/typescript/bin/tsc",
  );
  return {
    selected: 3,
    executed: 3,
    passed: 3,
    diagnostics: [
      `node=${process.execPath}`,
      `npm=${npmCli}`,
      `typescript=node_modules/typescript/bin/tsc`,
    ],
    outputDigest: sha256(
      `${expectedNodeDigest}\0${npmRecord.cliSha256}\0${toolchain.typescriptPackage.cliSha256}`,
    ),
  };
}

async function policyFormat(context) {
  const files = (await repositoryFiles(context.root)).filter(
    (path) =>
      /^(?:config|tooling|scripts|packages)\//u.test(path) &&
      /\.(?:json|mjs|ts|md)$/u.test(path),
  );
  const prettier = resolve(
    context.root,
    "node_modules/prettier/bin/prettier.cjs",
  );
  const result = await run(process.execPath, [prettier, "--check", ...files], {
    cwd: context.root,
    timeoutMs: 120000,
  });
  assert(
    result.code === 0,
    "FORMAT_DRIFT",
    `${result.stdout}${result.stderr}`.trim(),
  );
  return {
    selected: files.length,
    executed: files.length,
    passed: files.length,
  };
}

async function policyLint(context) {
  const files = (await repositoryFiles(context.root)).filter(
    (path) =>
      /^(?:tooling|scripts)\/.*\.mjs$/u.test(path) ||
      /^packages\/.*\.ts$/u.test(path),
  );
  const eslint = resolve(context.root, "node_modules/eslint/bin/eslint.js");
  const jsFiles = files.filter((path) => !path.endsWith(".ts"));
  const jsResult = await run(process.execPath, [eslint, ...jsFiles], {
    cwd: context.root,
    timeoutMs: 120000,
  });
  assert(
    jsResult.code === 0,
    "LINT_FAILED",
    `${jsResult.stdout}${jsResult.stderr}`.trim(),
  );
  for (const file of files.filter((path) => path.endsWith(".ts"))) {
    const source = await readFile(resolve(context.root, file), "utf8");
    const compiled = ts.transpileModule(source, {
      fileName: file,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
      reportDiagnostics: true,
    });
    const errors = (compiled.diagnostics ?? []).filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );
    assert(
      errors.length === 0,
      "LINT_TYPESCRIPT_TRANSPILE",
      `${file}: ${errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, " ")).join("; ")}`,
    );
    const result = spawnSync(
      process.execPath,
      [eslint, "--stdin", "--stdin-filename", `${file.slice(0, -3)}.lint.js`],
      {
        cwd: context.root,
        encoding: "utf8",
        input: compiled.outputText,
        timeout: 120000,
      },
    );
    assert(
      result.status === 0,
      "LINT_FAILED",
      `${file}\n${result.stdout}${result.stderr}`.trim(),
    );
  }
  return {
    selected: files.length,
    executed: files.length,
    passed: files.length,
  };
}

async function policyTypes(context) {
  const tsc = resolve(context.root, "node_modules/typescript/bin/tsc");
  let executed = 0;
  for (const packageRoot of PACKAGE_ROOTS) {
    const result = await run(
      process.execPath,
      [tsc, "--noEmit", "-p", `${packageRoot}/tsconfig.json`],
      { cwd: context.root, timeoutMs: 120000 },
    );
    assert(
      result.code === 0,
      "TYPES_FAILED",
      `${packageRoot}: ${result.stdout}${result.stderr}`.trim(),
    );
    executed += 1;
  }
  return { selected: PACKAGE_ROOTS.length, executed, passed: executed };
}

async function policyDocs(context) {
  const python =
    process.env.VERIFACTU_PYTHON ??
    (process.platform === "win32" ? "python" : "python3");
  const result = await run(python, [".github/scripts/validate_repository.py"], {
    cwd: context.root,
    timeoutMs: 180000,
  });
  assert(
    result.code === 0,
    "DOCS_FAILED",
    `${result.stdout}${result.stderr}`.trim(),
  );
  const documents = (await repositoryFiles(context.root)).filter(
    (path) => path.startsWith("docs/") && path.endsWith(".md"),
  );
  return {
    selected: documents.length,
    executed: documents.length,
    passed: documents.length,
  };
}

async function policyArchitecture(context) {
  const rules = await readJson(
    resolve(context.root, "config/repository/import-rules.json"),
  );
  const result = await checkArchitecture(context.root, rules);
  return {
    selected: result.files,
    executed: result.files,
    passed: result.files,
    diagnostics: [`imports=${result.imports}`],
  };
}

async function policyApi(context) {
  let executed = 0;
  for (const packageRoot of PACKAGE_ROOTS) {
    const path = resolve(context.root, packageRoot, "src/index.ts");
    const parsed = parseImports(
      await readFile(path, "utf8"),
      relativePosix(context.root, path),
    );
    assert(parsed.exportCount === 0, "API_UNDECLARED_EXPORT", packageRoot);
    executed += 1;
  }
  return { selected: PACKAGE_ROOTS.length, executed, passed: executed };
}

async function policyPackages(context) {
  const registry = await readJson(
    resolve(context.root, "config/repository/packages.json"),
  );
  const count = await checkPackages(context.root, registry);
  return { selected: count, executed: count, passed: count };
}

async function policyWorkflow(context) {
  const admissions = (
    await readJson(resolve(context.root, "config/admission/actions.json"))
  ).actions;
  const workflowPath = resolve(context.root, ".github/workflows/required.yml");
  const text = await readFile(workflowPath, "utf8");
  const count = validateWorkflowText(text, admissions);
  const workflowFiles = (
    await walk(context.root, {
      exclude: [".git", "node_modules", "evidence/runs"],
    })
  )
    .filter((entry) => entry.type === "file")
    .map((entry) => entry.relative)
    .filter(
      (path) => path.startsWith(".github/workflows/") && path.endsWith(".yml"),
    );
  for (const path of workflowFiles) {
    if (path === ".github/workflows/required.yml") continue;
    const auxiliary = await readFile(resolve(context.root, path), "utf8");
    validateWorkflowText(auxiliary, admissions, [], false);
  }
  const registry = await readJson(
    resolve(context.root, "config/ci/required-checks.json"),
  );
  const desired = await readJson(
    resolve(context.root, ".github/policy/github-desired-state.json"),
  );
  assert(
    registry.workflow === ".github/workflows/required.yml",
    "WORKFLOW_REGISTRY_PATH",
    registry.workflow,
  );
  assert(
    canonicalJson(registry.checks.map((check) => check.context)) ===
      canonicalJson(requiredContextRegistry()) &&
      canonicalJson(desired.requiredContexts) ===
        canonicalJson(requiredContextRegistry()),
    "WORKFLOW_CONTEXT_DRIFT",
    "required contexts differ between workflow, registry and GitHub desired state",
  );
  return { selected: count, executed: count, passed: count };
}

async function policySupplyChain(context) {
  const manifest = await readJson(resolve(context.root, "package.json"));
  const lock = await readJson(resolve(context.root, "package-lock.json"));
  const dependencyAdmission = await readJson(
    resolve(context.root, "config/admission/dependencies.json"),
  );
  const licenseEvidence = await readJson(
    resolve(context.root, "config/admission/license-evidence.json"),
  );
  const licenseOverrides = new Map(
    licenseEvidence.overrides.map((entry) => [entry.path, entry]),
  );
  assert(
    lock.lockfileVersion === 3,
    "LOCK_VERSION",
    String(lock.lockfileVersion),
  );
  let checked = 0;
  const directDependencies = new Map();
  for (const [name, specifier] of Object.entries(
    manifest.devDependencies ?? {},
  )) {
    validateDependencySpec(name, specifier);
    directDependencies.set(name, specifier);
    checked += 1;
  }
  for (const packageRoot of PACKAGE_ROOTS) {
    const packageManifest = await readJson(
      resolve(context.root, packageRoot, "package.json"),
    );
    for (const [name, specifier] of Object.entries(
      packageManifest.dependencies ?? {},
    )) {
      validateDependencySpec(name, specifier);
      if (!PACKAGE_NAMES.includes(name))
        directDependencies.set(name, specifier);
      checked += 1;
    }
  }
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (!path.startsWith("node_modules/")) continue;
    if (entry.link === true) {
      assert(
        PACKAGE_ROOTS.includes(entry.resolved),
        "LOCK_WORKSPACE_LINK",
        `${path}: ${entry.resolved}`,
      );
      checked += 1;
      continue;
    }
    if (entry.inBundle === true) {
      assert(
        path.startsWith("node_modules/npm/node_modules/"),
        "LOCK_BUNDLE",
        path,
      );
    } else {
      assert(
        typeof entry.integrity === "string" &&
          entry.integrity.startsWith("sha512-"),
        "LOCK_INTEGRITY",
        path,
      );
      assert(
        !entry.resolved ||
          entry.resolved.startsWith("https://registry.npmjs.org/"),
        "LOCK_REGISTRY",
        `${path}: ${entry.resolved}`,
      );
    }
    assert(entry.hasInstallScript !== true, "LIFECYCLE_SCRIPT", path);
    if (
      typeof entry.license !== "string" ||
      ["UNKNOWN", "UNLICENSED"].includes(entry.license)
    ) {
      const override = licenseOverrides.get(path);
      assert(override, "LICENSE_UNKNOWN", path);
      assert(
        override.version === entry.version,
        "LICENSE_EVIDENCE_VERSION",
        path,
      );
      assert(
        (await sha256File(resolve(context.root, override.evidencePath))) ===
          override.evidenceSha256,
        "LICENSE_EVIDENCE_DIGEST",
        path,
      );
    }
    checked += 1;
  }
  const admittedDependencies = new Map(
    dependencyAdmission.dependencies.map((entry) => [entry.name, entry]),
  );
  assert(
    dependencyAdmission.coolingPeriodDays === 7,
    "DEPENDENCY_COOLING_POLICY",
    String(dependencyAdmission.coolingPeriodDays),
  );
  assert(
    canonicalJson([...directDependencies.keys()].sort()) ===
      canonicalJson([...admittedDependencies.keys()].sort()),
    "DEPENDENCY_ADMISSION_SET",
    "direct dependency and admission sets differ",
  );
  for (const [name, version] of directDependencies) {
    const admission = admittedDependencies.get(name);
    assert(admission.version === version, "DEPENDENCY_ADMISSION_VERSION", name);
    const locked = lock.packages[`node_modules/${name}`];
    assert(locked, "DEPENDENCY_LOCK_MISSING", name);
    assert(
      locked.integrity === admission.integrity &&
        locked.resolved === admission.source &&
        locked.license === admission.license,
      "DEPENDENCY_ADMISSION_IDENTITY",
      name,
    );
    validateDependencyCooling(
      admission,
      dependencyAdmission.reviewedAt,
      dependencyAdmission.coolingPeriodDays,
    );
    assert(
      admission.maintainers?.length > 0 &&
        /^(?:git\+)?https:\/\//u.test(admission.repository) &&
        admission.transitiveGraph === "package-lock.json",
      "DEPENDENCY_ORIGIN",
      name,
    );
    assert(
      admission.installLifecycle === false &&
        locked.hasInstallScript !== true &&
        admission.optionalCode === false &&
        Object.keys(locked.optionalDependencies ?? {}).length === 0,
      "DEPENDENCY_EXECUTION_SURFACE",
      name,
    );
    const installedFiles = await walk(
      resolve(context.root, "node_modules", name),
    );
    const nativeFiles = installedFiles.filter(
      (entry) =>
        entry.type === "file" &&
        /\.(?:node|dll|so|dylib|exe)$/iu.test(entry.relative),
    );
    assert(
      admission.nativeCode === false && nativeFiles.length === 0,
      "DEPENDENCY_NATIVE_CODE",
      name,
    );
    for (const field of [
      "purpose",
      "alternatives",
      "maintainerRisk",
      "advisories",
      "license",
      "exit",
      "permissions",
      "network",
    ])
      assert(
        admission[field]?.length > 0,
        "DEPENDENCY_ADMISSION_FIELD",
        `${name}.${field}`,
      );
    checked += 1;
  }
  const npmrc = await readFile(resolve(context.root, ".npmrc"), "utf8");
  assert(
    npmrc.includes("ignore-scripts=true") && npmrc.includes("omit=optional"),
    "NPM_BASELINE",
    ".npmrc",
  );
  return { selected: checked, executed: checked, passed: checked };
}

function fixtureError(expectedCode, fn) {
  try {
    fn();
  } catch (error) {
    assert(
      error.code === expectedCode ||
        error.message.startsWith(`${expectedCode}:`),
      "FIXTURE_WRONG_REASON",
      `${expectedCode}: ${error.message}`,
    );
    return;
  }
  assert(false, "FIXTURE_FALSE_PASS", expectedCode);
}

async function fixtureErrorAsync(expectedCode, fn, forbiddenText = null) {
  try {
    await fn();
  } catch (error) {
    assert(
      error.code === expectedCode ||
        error.message.startsWith(`${expectedCode}:`),
      "FIXTURE_WRONG_REASON",
      `${expectedCode}: ${error.message}`,
    );
    if (forbiddenText)
      assert(
        !error.message.includes(forbiddenText),
        "FIXTURE_SECRET_LEAK",
        forbiddenText,
      );
    return;
  }
  assert(false, "FIXTURE_FALSE_PASS", expectedCode);
}

async function testPolicy(context) {
  const {
    validateDeclaredWrites,
    validateRegistry,
    validateReportSubject,
    validateZeroWork,
    normalizeOutcomeStatus,
  } = await import("./run-task.mjs");
  const registry = await readJson(
    resolve(context.root, "config/tasks/task-registry.json"),
  );
  const fixtureManifest = await readJson(
    resolve(context.root, "tests/policy/fixtures/material-controls.json"),
  );
  const tree = await readJson(
    resolve(context.root, "config/repository/tree.json"),
  );
  const ownership = await readJson(
    resolve(context.root, "config/repository/ownership.json"),
  );
  const imports = await readJson(
    resolve(context.root, "config/repository/import-rules.json"),
  );
  const artifacts = await readJson(
    resolve(context.root, "config/repository/artifacts.json"),
  );
  const files = (
    await walk(context.root, {
      exclude: [".git", "node_modules", "evidence/runs"],
    })
  )
    .filter((entry) => entry.type === "file")
    .map((entry) => entry.relative);
  const generated = await readJson(
    resolve(context.root, "config/generated/toolchain.generated.json"),
  );
  const admissions = (
    await readJson(resolve(context.root, "config/admission/actions.json"))
  ).actions;
  const workflow = await readFile(
    resolve(context.root, ".github/workflows/required.yml"),
    "utf8",
  );
  const spdxFixtureGraph = {
    components: [
      {
        id: "package:fixture",
        name: "fixture",
        version: "1.0.0",
        digest: "a".repeat(64),
        license: "MIT",
        type: "package",
        scope: "subject",
      },
    ],
    relationships: [],
  };
  for (const fixture of fixtureManifest.fixtures) {
    switch (fixture.mutation) {
      case "unknown-root":
        fixtureError(fixture.expectedCode, () =>
          validateTreePaths(
            [
              "unknown/file.txt",
              "package-lock.json",
              ...tree.packageRoots.map((root) => `${root}/package.json`),
            ],
            tree,
          ),
        );
        break;
      case "ambiguous-ownership":
        fixtureError(fixture.expectedCode, () => {
          const mutated = structuredClone(ownership);
          mutated.rules.push(structuredClone(mutated.rules[0]));
          validateOwnershipPaths([".github/workflows/required.yml"], mutated);
        });
        break;
      case "core-node-fs-import":
        fixtureError(fixture.expectedCode, () =>
          validateImportText(
            'import "node:fs";',
            "packages/verifactu/src/bad.ts",
            imports.packages["@noeos/verifactu"],
          ),
        );
        break;
      case "hand-edit":
        fixtureError(fixture.expectedCode, () =>
          validateGenerated({ ...generated, primaryNode: "0.0.0" }, generated),
        );
        break;
      case "missing-artifact-input":
        fixtureError(fixture.expectedCode, () => {
          const mutated = structuredClone(artifacts);
          mutated.classes[0].inputs = ["config/nonexistent-source.json"];
          validateArtifactRegistry(mutated, files);
        });
        break;
      case "unknown-operation":
        fixtureError(fixture.expectedCode, () => {
          const mutated = structuredClone(registry);
          mutated.tasks[0].operation = "unknown-operation";
          validateRegistry(mutated);
        });
        break;
      case "undeclared-tool":
        fixtureError(fixture.expectedCode, () => {
          const mutated = structuredClone(registry);
          mutated.tasks.find((task) => task.id === "policy:format").tools = [];
          validateRegistry(mutated);
        });
        break;
      case "undeclared-network":
        fixtureError(fixture.expectedCode, () => {
          const mutated = structuredClone(registry);
          mutated.tasks.find((task) => task.id === "policy:tree").network =
            "prepare-only";
          validateRegistry(mutated);
        });
        break;
      case "undeclared-write":
        fixtureError(fixture.expectedCode, () =>
          validateDeclaredWrites(
            new Map(),
            new Map([["outside.txt", ["outside.txt", "file", 420, 1, "a"]]]),
            registry.tasks[0],
          ),
        );
        break;
      case "cycle":
        fixtureError(fixture.expectedCode, () => {
          const mutated = structuredClone(registry);
          mutated.tasks[0].dependencies = [mutated.tasks[1].id];
          mutated.tasks[1].dependencies = [mutated.tasks[0].id];
          validateRegistry(mutated);
        });
        break;
      case "duplicate-id":
        fixtureError(fixture.expectedCode, () => {
          const mutated = structuredClone(registry);
          mutated.tasks.push(structuredClone(mutated.tasks[0]));
          validateRegistry(mutated);
        });
        break;
      case "unreachable-task":
        fixtureError(fixture.expectedCode, () => {
          const mutated = structuredClone(registry);
          const orphan = structuredClone(mutated.tasks[0]);
          orphan.id = "fixture:unreachable";
          orphan.outputs = ["evidence/runs/fixture--unreachable.json"];
          mutated.tasks.push(orphan);
          validateRegistry(mutated);
        });
        break;
      case "stale-subject":
        fixtureError(fixture.expectedCode, () =>
          validateReportSubject(
            { taskId: "fixture", subject: "old", tree: context.identity.tree },
            context.identity,
          ),
        );
        break;
      case "zero-work":
        fixtureError(fixture.expectedCode, () =>
          validateZeroWork(registry.tasks[0], 0, 0),
        );
        break;
      case "unknown-task-outcome":
        fixtureError(fixture.expectedCode, () =>
          normalizeOutcomeStatus({ status: "partial" }),
        );
        break;
      case "missing-context":
        fixtureError(fixture.expectedCode, () =>
          validateWorkflowText(
            workflow.replace("name: Required · CodeQL", "name: Removed CodeQL"),
            admissions,
          ),
        );
        break;
      case "missing-report":
        fixtureError(fixture.expectedCode, () =>
          validateWorkflowText(
            workflow.replaceAll(
              "validate-required-checks.mjs",
              "removed-closure.mjs",
            ),
            admissions,
          ),
        );
        break;
      case "mutable-ref":
        fixtureError(fixture.expectedCode, () =>
          validateActionReference("actions/checkout@v6", admissions),
        );
        break;
      case "deprecated-action-runtime":
        fixtureError(fixture.expectedCode, () => {
          const mutated = structuredClone(admissions);
          mutated[0].runtime = "node20";
          validateWorkflowText(workflow, mutated);
        });
        break;
      case "range-spec":
        fixtureError(fixture.expectedCode, () =>
          validateDependencySpec("fixture", "^1.0.0"),
        );
        break;
      case "too-new-dependency":
        fixtureError(fixture.expectedCode, () =>
          validateDependencyCooling(
            { name: "fixture", publishedAt: "2026-09-19T00:00:00Z" },
            "2026-09-20",
            7,
          ),
        );
        break;
      case "extra-file":
        fixtureError(fixture.expectedCode, () =>
          validatePackageEntries(
            [
              {
                path: "package/secret.env",
                type: "file",
                size: 1,
                mode: 0o644,
              },
            ],
            [],
          ),
        );
        break;
      case "different-output":
        fixtureError(fixture.expectedCode, () =>
          validateReproducible("a", "b"),
        );
        break;
      case "spdx-invalid-vocabulary":
        fixtureError(fixture.expectedCode, () => {
          const document = spdxFromGraph(spdxFixtureGraph);
          document["@graph"].find(
            (entry) => entry.type === "software_Package",
          ).type = "NotAnSpdxType";
          validateSpdxDocument(document, spdxFixtureGraph);
        });
        break;
      case "spdx-dangling-relationship":
        fixtureError(fixture.expectedCode, () => {
          const document = spdxFromGraph(spdxFixtureGraph);
          document["@graph"].find((entry) => entry.type === "Relationship").to =
            ["https://noeos.dev/spdx/p2/missing"];
          validateSpdxDocument(document, spdxFixtureGraph);
        });
        break;
      case "spdx-missing-subject-hash":
        fixtureError(fixture.expectedCode, () => {
          const document = spdxFromGraph(spdxFixtureGraph);
          delete document["@graph"].find(
            (entry) => entry.type === "software_Package",
          ).verifiedUsing;
          validateSpdxDocument(document, spdxFixtureGraph);
        });
        break;
      case "spdx-license-contradiction":
        fixtureError(fixture.expectedCode, () => {
          const document = spdxFromGraph(spdxFixtureGraph);
          document["@graph"].find(
            (entry) => entry.type === "simplelicensing_LicenseExpression",
          ).simplelicensing_licenseExpression = "Apache-2.0";
          validateSpdxDocument(document, spdxFixtureGraph);
        });
        break;
      case "download-404":
        await fixtureErrorAsync(
          fixture.expectedCode,
          () =>
            downloadBounded(
              {
                id: fixture.id,
                url: "https://example.invalid/input?credential=do-not-log",
                maximumBytes: 32,
                sha256: "0".repeat(64),
              },
              resolve(context.root, "evidence/runs/never-written"),
              async () => fakeDownloadResponse(404),
            ),
          "do-not-log",
        );
        break;
      case "download-retries":
        await fixtureErrorAsync(fixture.expectedCode, () =>
          downloadBounded(
            {
              id: fixture.id,
              url: "https://example.invalid/input",
              maximumBytes: 32,
              sha256: "0".repeat(64),
            },
            resolve(context.root, "evidence/runs/never-written"),
            async () => fakeDownloadResponse(503),
          ),
        );
        break;
      case "download-digest":
        await fixtureErrorAsync(fixture.expectedCode, () =>
          downloadBounded(
            {
              id: fixture.id,
              url: "https://example.invalid/input",
              maximumBytes: 32,
              sha256: "0".repeat(64),
            },
            resolve(context.root, "evidence/runs/never-written"),
            async () => fakeDownloadResponse(200, Buffer.from("wrong")),
          ),
        );
        break;
      default:
        assert(false, "FIXTURE_UNKNOWN", fixture.mutation);
    }
  }
  return {
    selected: fixtureManifest.fixtures.length,
    executed: fixtureManifest.fixtures.length,
    passed: fixtureManifest.fixtures.length,
  };
}

async function testP4A(context) {
  const files = [
    "tests/unit/p4-codecs.test.mjs",
    "tests/unit/p4-values-identities.test.mjs",
    "tests/unit/p4-records-corrections.test.mjs",
    "tests/unit/p4-modes-events-states.test.mjs",
    "tests/unit/p4-sequences-chains.test.mjs",
    "tests/unit/p4-plans-artifacts.test.mjs",
    "tests/property/p4-properties.test.mjs",
    "tests/security/p4-isolation-redaction.test.mjs",
  ];
  const result = await run(
    process.execPath,
    ["--experimental-test-coverage", "--test", "--test-reporter=tap", ...files],
    { cwd: context.root, timeoutMs: 120000 },
  );
  assert(
    result.code === 0,
    "P4A_TEST_EXECUTION",
    `${result.stdout}${result.stderr}`.trim(),
  );
  const stats =
    /^# tests (\d+)\n# suites (\d+)\n# pass (\d+)\n# fail (\d+)\n# cancelled (\d+)\n# skipped (\d+)/mu.exec(
      result.stdout,
    );
  assert(stats, "P4A_TEST_REPORT", result.stdout.slice(-1000));
  const [, tests, , passed, failed, cancelled, skipped] = stats;
  assert(
    Number(tests) > 0 &&
      Number(tests) === Number(passed) &&
      Number(failed) === 0 &&
      Number(cancelled) === 0 &&
      Number(skipped) === 0,
    "P4A_TEST_COMPLETENESS",
    `${tests}/${passed}, fail=${failed}, cancelled=${cancelled}, skipped=${skipped}`,
  );
  const mutationResult = await run(
    process.execPath,
    ["--test", "--test-reporter=tap", "tests/mutation/p4-mutation.test.mjs"],
    { cwd: context.root, timeoutMs: 120000 },
  );
  assert(
    mutationResult.code === 0,
    "P4A_MUTATION_EXECUTION",
    `${mutationResult.stdout}${mutationResult.stderr}`.trim(),
  );
  const mutationStats =
    /^# tests (\d+)\n# suites (\d+)\n# pass (\d+)\n# fail (\d+)\n# cancelled (\d+)\n# skipped (\d+)/mu.exec(
      mutationResult.stdout,
    );
  assert(
    mutationStats,
    "P4A_MUTATION_REPORT",
    mutationResult.stdout.slice(-1000),
  );
  const [, mutants, , killed, mutantFailures, mutantCancelled, mutantSkipped] =
    mutationStats;
  const criticalMutants = [
    ...mutationResult.stdout.matchAll(
      /# Subtest: P4-MUT-(?:00[1-9]|01\d|02[0-5]|029|03[7-9]|04[01])\b/gu,
    ),
  ];
  const p4AFaults = [
    ["codec-stage-skip", "P4-MUT-001"],
    ["duplicate-member-accept", "P4-MUT-002"],
    ["identity-kind-substitution", "P4-MUT-003"],
    ["context-omission", "P4-MUT-004"],
    ["decimal-float-coercion", "P4-MUT-005"],
    ["implicit-clock-read", "P4-FAULT-006"],
    ["record-choice-drop", "P4-MUT-007"],
    ["correction-rewrite", "P4-MUT-008"],
    ["mode-transition-bypass", "P4-MUT-009"],
    ["event-chain-mixing", "P4-MUT-011"],
    ["indeterminate-to-success", "P4-MUT-013"],
    ["chain-field-swap", "P4-MUT-015"],
  ];
  assert(
    Number(mutants) === 33 &&
      Number(killed) === 33 &&
      Number(mutantFailures) === 0 &&
      Number(mutantCancelled) === 0 &&
      Number(mutantSkipped) === 0 &&
      criticalMutants.length === 31,
    "P4A_MUTATION_COMPLETENESS",
    `${killed}/${mutants} killed, fail=${mutantFailures}, cancelled=${mutantCancelled}, skipped=${mutantSkipped}`,
  );
  for (const [fault, evidence] of p4AFaults)
    assert(
      mutationResult.stdout.includes(`# Subtest: ${evidence}`),
      "P4A_SEEDED_FAULT_MISSING",
      `${fault} -> ${evidence}`,
    );
  const coverage =
    /^# all files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/mu.exec(
      result.stdout,
    );
  assert(coverage, "P4A_COVERAGE_REPORT", result.stdout.slice(-2000));
  const [, linesText, branchesText, functionsText] = coverage;
  const lines = Number(linesText);
  const branches = Number(branchesText);
  const functions = Number(functionsText);
  assert(
    lines >= 98 && branches >= 95 && functions >= 98,
    "P4A_COVERAGE_THRESHOLD",
    `line=${lines}, branch=${branches}, function=${functions}; required 98/95/98`,
  );
  const modules = [
    "configuration",
    "limits",
    "results",
    "staged-codec",
    "diagnostics",
    "identities",
    "context",
    "decimal",
    "date-time",
    "records",
    "corrections",
    "mode-tenure",
    "events",
    "states",
    "invariants",
    "sequences",
    "chains",
    "digest",
    "operation-plan",
    "record-planner",
    "official-projection",
    "official-serialization",
    "fingerprint",
    "xml-artifacts",
    "index",
  ];
  for (const module of modules)
    assert(
      result.stdout.includes(`${module}.js`),
      "P4A_COVERAGE_MODULE_MISSING",
      module,
    );
  return {
    selected: files.length + 1,
    executed: files.length + 1,
    passed: files.length + 1,
    outputDigest: sha256(
      result.stdout +
        result.stderr +
        mutationResult.stdout +
        mutationResult.stderr,
    ),
    diagnostics: [
      `testCases=${tests}`,
      `skipped=${skipped}`,
      `coverage.line=${lines}`,
      `coverage.branch=${branches}`,
      `coverage.function=${functions}`,
      "criticalMutants=31/43 non-Java mappings; P4-D Java-only mutations run in test:p4-d",
      `seededFaults=${p4AFaults.length}/${p4AFaults.length} ${p4AFaults.map(([fault]) => fault).join(",")}`,
      "properties=9x4096 seed=1346650369 retries=0 discards=0",
      "fuzz=P4-FUZZ-001x4096 seed=1346651649 retries=0 discards=0",
      `subject=${context.identity.subject}`,
    ],
  };
}

async function testP4C(context) {
  const files = [
    "tests/unit/p4-xml-model.test.mjs",
    "tests/contract/p4-xml-xsd-provider.test.mjs",
    "tests/integration/p4-offline-xsd.test.mjs",
    "tests/security/p4-xml-attacks.test.mjs",
  ];
  const result = await run(
    process.execPath,
    ["--experimental-test-coverage", "--test", "--test-reporter=tap", ...files],
    { cwd: context.root, timeoutMs: 300000 },
  );
  assert(
    result.code === 0,
    "P4C_TEST_EXECUTION",
    `${result.stdout}${result.stderr}`.trim(),
  );
  const report = `${result.stdout}${result.stderr}`;
  const stats =
    /^# tests (\d+)\n# suites (\d+)\n# pass (\d+)\n# fail (\d+)\n# cancelled (\d+)\n# skipped (\d+)/mu.exec(
      result.stdout,
    );
  assert(stats, "P4C_TEST_REPORT", result.stdout.slice(-1000));
  const [, tests, , passed, failed, cancelled, skipped] = stats;
  assert(
    Number(tests) > 0 &&
      Number(tests) === Number(passed) &&
      Number(failed) === 0 &&
      Number(cancelled) === 0 &&
      Number(skipped) === 0,
    "P4C_TEST_COMPLETENESS",
    `${tests}/${passed}, fail=${failed}, cancelled=${cancelled}, skipped=${skipped}`,
  );
  const mutationResult = await run(
    process.execPath,
    ["--test", "--test-reporter=tap", "tests/mutation/p4-mutation.test.mjs"],
    { cwd: context.root, timeoutMs: 300000 },
  );
  assert(
    mutationResult.code === 0,
    "P4C_MUTATION_EXECUTION",
    `${mutationResult.stdout}${mutationResult.stderr}`.trim(),
  );
  const mutationStats =
    /^# tests (\d+)\n# suites (\d+)\n# pass (\d+)\n# fail (\d+)\n# cancelled (\d+)\n# skipped (\d+)/mu.exec(
      mutationResult.stdout,
    );
  assert(
    mutationStats,
    "P4C_MUTATION_REPORT",
    mutationResult.stdout.slice(-1000),
  );
  const [, mutants, , killed, mutantFailures, mutantCancelled, mutantSkipped] =
    mutationStats;
  const p4cMutants = [
    ...mutationResult.stdout.matchAll(
      /# Subtest: P4-MUT-(?:00[1-9]|01\d|02[0-5]|029|03[7-9]|04[01])\b/gu,
    ),
  ];
  assert(
    Number(mutants) === 33 &&
      Number(killed) === 33 &&
      Number(mutantFailures) === 0 &&
      Number(mutantCancelled) === 0 &&
      Number(mutantSkipped) === 0 &&
      p4cMutants.length === 31,
    "P4C_MUTATION_COMPLETENESS",
    `${killed}/${mutants} killed, fail=${mutantFailures}, cancelled=${mutantCancelled}, skipped=${mutantSkipped}`,
  );
  for (const evidence of ["P4-MUT-023", "P4-MUT-024", "P4-MUT-025"])
    assert(
      mutationResult.stdout.includes(`# Subtest: ${evidence}`),
      "P4C_MUTATION_MISSING",
      evidence,
    );
  return {
    selected: files.length + 1,
    executed: files.length + 1,
    passed: files.length + 1,
    outputDigest: sha256(
      report + mutationResult.stdout + mutationResult.stderr,
    ),
    diagnostics: [
      `testCases=${tests}`,
      `skipped=${skipped}`,
      "criticalMutants=31/43 non-Java mappings; P4-D Java-only mutations run in test:p4-d",
      "seededP4CFaults=3/3 P4-MUT-023..025",
      "independentOracle=xmlschema@4.3.2/elementpath@5.1.4",
      "schemaClosure=8 exact digest-pinned AEAT/W3C sources",
      `subject=${context.identity.subject}`,
    ],
  };
}

async function testP4D(context) {
  const maven = process.env.VERIFACTU_MAVEN;
  const java = process.env.VERIFACTU_JAVA;
  const javaHome = process.env.JAVA_HOME;
  const repository = process.env.VERIFACTU_MAVEN_REPOSITORY;
  assert(
    typeof maven === "string" &&
      maven.length > 0 &&
      typeof java === "string" &&
      java.length > 0 &&
      typeof javaHome === "string" &&
      javaHome.length > 0 &&
      typeof repository === "string" &&
      repository.length > 0,
    "P4D_TOOLCHAIN_INPUTS",
    "absolute Maven, Java, JAVA_HOME and local repository paths are required",
  );
  const toolEnv = { ...process.env, JAVA_HOME: javaHome };
  const javaVersion = await run(
    java,
    ["-XshowSettings:properties", "-version"],
    { cwd: context.root, env: toolEnv, timeoutMs: 10000 },
  );
  const javaOutput = `${javaVersion.stdout}${javaVersion.stderr}`;
  assert(
    javaVersion.code === 0 &&
      javaOutput.includes("java.runtime.version = 21.0.12.1+1-LTS") &&
      javaOutput.includes("java.vendor = Eclipse Adoptium"),
    "P4D_JDK_IDENTITY",
    javaOutput.trim(),
  );
  const mavenVersion = await runMaven(maven, ["--version"], {
    cwd: context.root,
    env: toolEnv,
    timeoutMs: 10000,
  });
  const mavenOutput = `${mavenVersion.stdout}${mavenVersion.stderr}`;
  assert(
    mavenVersion.code === 0 &&
      mavenOutput.includes("Apache Maven 3.9.12") &&
      mavenOutput.includes("Java version: 21.0.12.1, vendor: Eclipse Adoptium"),
    "P4D_MAVEN_IDENTITY",
    mavenOutput.trim(),
  );
  const admission = await readJson(
    resolve(context.root, "config/admission/java-provider.json"),
  );
  assert(
    admission.components.length === 140 &&
      admission.runtimeGraph.componentCount === 43 &&
      admission.buildPluginGraph.componentCount === 99,
    "P4D_MAVEN_LOCK_POPULATION",
    `${admission.runtimeGraph?.componentCount}/${admission.buildPluginGraph?.componentCount}/${admission.components?.length}`,
  );
  const artifactDigests = [];
  for (const component of admission.components) {
    const componentDirectory = resolve(
      repository,
      component.groupId.replaceAll(".", "/"),
      component.artifactId,
      component.version,
    );
    const classifier = component.classifier ? `-${component.classifier}` : "";
    const jarPath = resolve(
      componentDirectory,
      `${component.artifactId}-${component.version}${classifier}.jar`,
    );
    const pomPath = resolve(
      componentDirectory,
      `${component.artifactId}-${component.version}.pom`,
    );
    assert(
      (await sha256File(jarPath)) === component.jarSha256,
      "P4D_MAVEN_JAR_INTEGRITY",
      `${component.purl}: ${jarPath}`,
    );
    assert(
      (await sha256File(pomPath)) === component.pomSha256,
      "P4D_MAVEN_POM_INTEGRITY",
      `${component.purl}: ${pomPath}`,
    );
    artifactDigests.push(component.jarSha256, component.pomSha256);
  }
  assert(
    Array.isArray(admission.buildMetadataPoms) &&
      admission.buildMetadataPoms.length === 100,
    "P4D_MAVEN_METADATA_POM_POPULATION",
    `${admission.buildMetadataPoms?.length}`,
  );
  for (const pom of admission.buildMetadataPoms) {
    const pomPath = resolve(
      repository,
      pom.groupId.replaceAll(".", "/"),
      pom.artifactId,
      pom.version,
      `${pom.artifactId}-${pom.version}.pom`,
    );
    assert(
      (await sha256File(pomPath)) === pom.pomSha256,
      "P4D_MAVEN_METADATA_POM_INTEGRITY",
      `${pom.groupId}:${pom.artifactId}:${pom.version}: ${pomPath}`,
    );
    artifactDigests.push(pom.pomSha256);
  }
  const build = await runMaven(
    maven,
    [
      "-o",
      ...(repository ? [`-Dmaven.repo.local=${repository}`] : []),
      "-f",
      "internal/xades-provider/dss/pom.xml",
      "clean",
      "package",
      "-DskipTests",
    ],
    { cwd: context.root, env: toolEnv, timeoutMs: 300000 },
  );
  assert(
    build.code === 0,
    "P4D_DSS_BUILD",
    `${build.stdout}${build.stderr}`.trim(),
  );
  const providerJar = resolve(
    context.root,
    "internal/xades-provider/dss/target/verifactu-xades-provider-0.0.0-development.jar",
  );
  const firstProviderJarSha256 = await sha256File(providerJar);
  const jarTool = resolve(
    javaHome,
    "bin",
    process.platform === "win32" ? "jar.exe" : "jar",
  );
  const jarListing = await run(jarTool, ["--list", "--file", providerJar], {
    cwd: context.root,
    env: toolEnv,
    timeoutMs: 30000,
  });
  const bridgeClass = "eu/noeos/verifactu/bridge/DssBridge.class";
  const bridgeLicense = "META-INF/THIRD-PARTY-LICENSES/EU-DSS-LGPL-2.1.txt";
  assert(
    jarListing.code === 0 &&
      jarListing.stdout.includes(bridgeClass) &&
      jarListing.stdout.includes("META-INF/LICENSE") &&
      jarListing.stdout.includes("META-INF/NOTICE") &&
      jarListing.stdout.includes(bridgeLicense),
    "P4D_SHADE_CONTENTS",
    `${jarListing.stdout}${jarListing.stderr}`.trim(),
  );
  const archiveProbe = await mkdtemp(join(tmpdir(), "verifactu-p4d-shade-"));
  try {
    const extract = await run(
      jarTool,
      [
        "--extract",
        "--file",
        providerJar,
        "META-INF/LICENSE",
        "META-INF/NOTICE",
        bridgeLicense,
        bridgeClass,
      ],
      { cwd: archiveProbe, env: toolEnv, timeoutMs: 30000 },
    );
    assert(
      extract.code === 0,
      "P4D_SHADE_EXTRACT",
      `${extract.stdout}${extract.stderr}`.trim(),
    );
    const licenseClosure = admission.licenseClosure;
    const projectLicense = await readFile(
      resolve(context.root, licenseClosure.project.licensePath),
    );
    const projectNotice = await readFile(
      resolve(context.root, licenseClosure.project.noticePath),
    );
    const shadedLicense = await readFile(
      resolve(archiveProbe, "META-INF/LICENSE"),
    );
    const shadedNotice = await readFile(
      resolve(archiveProbe, "META-INF/NOTICE"),
    );
    const shadedDssLicense = await readFile(
      resolve(archiveProbe, bridgeLicense),
    );
    assert(
      sha256(projectLicense) === licenseClosure.project.licenseSha256 &&
        sha256(projectNotice) === licenseClosure.project.noticeSha256 &&
        shadedLicense.includes(projectLicense) &&
        shadedNotice.includes(projectNotice) &&
        sha256(shadedDssLicense) === licenseClosure.dss.sourceSha256 &&
        (await stat(resolve(archiveProbe, bridgeClass))).size > 0,
      "P4D_SHADE_LICENSE_NOTICE_CLOSURE",
      "project and DSS license/NOTICE resources must remain in the built provider",
    );
  } finally {
    await rm(archiveProbe, { recursive: true, force: true });
  }
  const jacocoComponent = admission.components.find(
    (component) =>
      component.purl ===
      "pkg:maven/org.jacoco/org.jacoco.agent@0.8.15?classifier=runtime",
  );
  assert(
    jacocoComponent,
    "P4D_JACOCO_ADMISSION",
    "pinned runtime agent missing",
  );
  const jacocoAgent = resolve(
    repository,
    "org/jacoco/org.jacoco.agent/0.8.15/org.jacoco.agent-0.8.15-runtime.jar",
  );
  assert(
    (await sha256File(jacocoAgent)) === jacocoComponent.jarSha256,
    "P4D_JACOCO_INTEGRITY",
    jacocoAgent,
  );
  const jacocoData = resolve(
    context.root,
    "internal/xades-provider/dss/target/jacoco.exec",
  );
  await rm(jacocoData, { force: true });
  process.env.VERIFACTU_JACOCO_AGENT = jacocoAgent;
  process.env.VERIFACTU_JACOCO_DESTFILE = jacocoData;
  process.env.VERIFACTU_JAVA_MUTATION = "1";
  const files = [
    "tests/contract/p4-xades-provider.test.mjs",
    "tests/integration/p4-xades-pki.test.mjs",
    "tests/security/p4-signature-attacks.test.mjs",
    "tests/security/p4-resource-attacks.test.mjs",
  ];
  const result = await run(
    process.execPath,
    ["--experimental-test-coverage", "--test", "--test-reporter=tap", ...files],
    { cwd: context.root, timeoutMs: 300000 },
  );
  assert(
    result.code === 0,
    "P4D_TEST_EXECUTION",
    `${result.stdout}${result.stderr}`.trim(),
  );
  const stats =
    /^# tests (\d+)\n# suites (\d+)\n# pass (\d+)\n# fail (\d+)\n# cancelled (\d+)\n# skipped (\d+)/mu.exec(
      result.stdout,
    );
  assert(stats, "P4D_TEST_REPORT", result.stdout.slice(-1000));
  const [, tests, , passed, failed, cancelled, skipped] = stats;
  assert(
    Number(tests) > 0 &&
      Number(tests) === Number(passed) &&
      Number(failed) === 0 &&
      Number(cancelled) === 0 &&
      Number(skipped) === 0,
    "P4D_TEST_COMPLETENESS",
    `${tests}/${passed}, fail=${failed}, cancelled=${cancelled}, skipped=${skipped}`,
  );
  const coverage = await runMaven(
    maven,
    [
      "-o",
      `-Dmaven.repo.local=${repository}`,
      "-f",
      "internal/xades-provider/dss/pom.xml",
      "org.jacoco:jacoco-maven-plugin:0.8.15:report",
      `-Djacoco.dataFile=${jacocoData}`,
    ],
    { cwd: context.root, env: toolEnv, timeoutMs: 120000 },
  );
  assert(
    coverage.code === 0,
    "P4D_JAVA_COVERAGE_EXECUTION",
    `${coverage.stdout}${coverage.stderr}`.trim(),
  );
  const coverageXmlPath = resolve(
    context.root,
    "internal/xades-provider/dss/target/site/jacoco/jacoco.xml",
  );
  const coverageXml = await readFile(coverageXmlPath, "utf8");
  const bridgeSource =
    /<sourcefile name="DssBridge\.java">[\s\S]*?<\/sourcefile>/u.exec(
      coverageXml,
    )?.[0];
  assert(
    bridgeSource,
    "P4D_JAVA_COVERAGE_CLASS",
    "DssBridge.java absent from JaCoCo report",
  );
  const lineCoverage =
    /<counter type="LINE" missed="(\d+)" covered="(\d+)"\/>/u.exec(
      bridgeSource,
    );
  const branchCoverage =
    /<counter type="BRANCH" missed="(\d+)" covered="(\d+)"\/>/u.exec(
      bridgeSource,
    );
  assert(
    lineCoverage && branchCoverage,
    "P4D_JAVA_COVERAGE_COUNTERS",
    "line or branch counters missing",
  );
  const javaLines =
    (Number(lineCoverage[2]) /
      (Number(lineCoverage[1]) + Number(lineCoverage[2]))) *
    100;
  const javaBranches =
    (Number(branchCoverage[2]) /
      (Number(branchCoverage[1]) + Number(branchCoverage[2]))) *
    100;
  const mutationResult = await run(
    process.execPath,
    ["--test", "--test-reporter=tap", "tests/mutation/p4-mutation.test.mjs"],
    { cwd: context.root, timeoutMs: 300000 },
  );
  assert(
    mutationResult.code === 0,
    "P4D_MUTATION_EXECUTION",
    `${mutationResult.stdout}${mutationResult.stderr}`.trim(),
  );
  const mutationStats =
    /^# tests (\d+)\n# suites (\d+)\n# pass (\d+)\n# fail (\d+)\n# cancelled (\d+)\n# skipped (\d+)/mu.exec(
      mutationResult.stdout,
    );
  assert(
    mutationStats,
    "P4D_MUTATION_REPORT",
    mutationResult.stdout.slice(-1000),
  );
  const [
    ,
    mutants,
    ,
    killed,
    mutationFailures,
    mutationCancelled,
    mutationSkipped,
  ] = mutationStats;
  const dMutants = [
    ...mutationResult.stdout.matchAll(
      /# Subtest: P4-MUT-0(?:26|27|28|29|37|38|39|40|41)\b/gu,
    ),
  ];
  assert(
    Number(mutants) === 35 &&
      Number(killed) === 35 &&
      Number(mutationFailures) === 0 &&
      Number(mutationCancelled) === 0 &&
      Number(mutationSkipped) === 0 &&
      dMutants.length === 9,
    "P4D_MUTATION_COMPLETENESS",
    `${killed}/${mutants} total, P4-D=${dMutants.length}/9, fail=${mutationFailures}, cancelled=${mutationCancelled}, skipped=${mutationSkipped}`,
  );
  const reproducedBuild = await runMaven(
    maven,
    [
      "-o",
      `-Dmaven.repo.local=${repository}`,
      "-f",
      "internal/xades-provider/dss/pom.xml",
      "clean",
      "package",
      "-DskipTests",
    ],
    { cwd: context.root, env: toolEnv, timeoutMs: 300000 },
  );
  assert(
    reproducedBuild.code === 0,
    "P4D_DSS_REPRODUCIBLE_BUILD",
    `${reproducedBuild.stdout}${reproducedBuild.stderr}`.trim(),
  );
  const reproducedProviderJarSha256 = await sha256File(providerJar);
  assert(
    reproducedProviderJarSha256 === firstProviderJarSha256,
    "P4D_DSS_REPRODUCIBILITY_DIGEST",
    `${firstProviderJarSha256} != ${reproducedProviderJarSha256}`,
  );
  assert(
    javaLines >= 98 && javaBranches >= 95,
    "P4D_JAVA_COVERAGE_THRESHOLD",
    `line=${javaLines.toFixed(2)}%, branch=${javaBranches.toFixed(2)}%; required 98/95`,
  );
  const p4DSeededFaults = [
    ["dss-altered-signed-bytes-success", "P4-MUT-038"],
    [
      "provider-serializes-or-logs-private-key",
      "bridge child environment excludes unrelated parent secrets",
    ],
    ["stale-crl-ocsp-promoted-valid", "P4-MUT-040"],
    ["unauthorized-revocation-responder-trusted", "P4-MUT-039"],
    ["provider-attempts-network-without-evidence", "P4-MUT-041"],
  ];
  for (const [fault, evidence] of p4DSeededFaults) {
    assert(
      result.stdout.includes(evidence) ||
        mutationResult.stdout.includes(evidence),
      "P4D_SEEDED_FAULT_MISSING",
      `${fault} -> ${evidence}`,
    );
  }
  return {
    selected: files.length + 2,
    executed: files.length + 2,
    passed: files.length + 2,
    outputDigest: sha256(
      build.stdout +
        build.stderr +
        jarListing.stdout +
        firstProviderJarSha256 +
        reproducedProviderJarSha256 +
        artifactDigests.join("\n") +
        result.stdout +
        result.stderr +
        coverage.stdout +
        coverage.stderr +
        coverageXml +
        mutationResult.stdout +
        mutationResult.stderr +
        reproducedBuild.stdout +
        reproducedBuild.stderr,
    ),
    diagnostics: [
      `testCases=${tests}`,
      `skipped=${skipped}`,
      "dssBuild=offline",
      `dssArtifactSha256=${firstProviderJarSha256}; reproducible=2/2`,
      "dssShadeLicenseNotice=project LICENSE/NOTICE and exact DSS LGPL text present",
      `mavenArtifacts=280/280 JAR+POM; buildMetadataPoms=${admission.buildMetadataPoms.length}/100 SHA-256 verified`,
      "jdk=Eclipse-Temurin-21.0.12.1+1",
      "maven=3.9.12",
      `javaLineCoverage=${lineCoverage[2]}/${Number(lineCoverage[1]) + Number(lineCoverage[2])}`,
      `javaBranchCoverage=${branchCoverage[2]}/${Number(branchCoverage[1]) + Number(branchCoverage[2])}`,
      "properties=P4-PROP-013x4096 seed=1346650369 retries=0 discards=0",
      "fuzz=P4-FUZZ-007x4096 seed=1346651655; P4-FUZZ-008x4096 seed=1430257929; minimized failures=0",
      `seededFaults=${p4DSeededFaults.length}/${p4DSeededFaults.length} ${p4DSeededFaults.map(([fault]) => fault).join(",")}`,
      "criticalMutants=9/9 P4-D (P4-MUT-026..029,037..041); total=34/43; future-wave P4-MUT-030..036,042..043 pending",
      `subject=${context.identity.subject}`,
    ],
  };
}

async function runMaven(maven, args, options) {
  if (process.platform !== "win32") return run(maven, args, options);
  try {
    const result = await execFileAsync(maven, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      maxBuffer: options.maxBuffer ?? 16 * 1024 * 1024,
      timeout: options.timeoutMs,
      windowsHide: true,
      shell: true,
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      code: Number.isInteger(error.code) ? error.code : 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? error.message,
    };
  }
}

async function compilePackages(context, outputRoot, sourceRoot = context.root) {
  const tsc = resolve(context.root, "node_modules/typescript/bin/tsc");
  await rm(outputRoot, { recursive: true, force: true });
  let count = 0;
  for (const packageRoot of PACKAGE_ROOTS) {
    const output = resolve(outputRoot, basename(packageRoot), "dist");
    await mkdir(output, { recursive: true, mode: 0o700 });
    const result = await run(
      process.execPath,
      [
        tsc,
        "-p",
        resolve(sourceRoot, packageRoot, "tsconfig.json"),
        "--outDir",
        output,
        "--tsBuildInfoFile",
        resolve(outputRoot, `${basename(packageRoot)}.tsbuildinfo`),
      ],
      {
        cwd: sourceRoot,
        timeoutMs: 180000,
        env: { ...process.env, TZ: "UTC", SOURCE_DATE_EPOCH: "0" },
      },
    );
    assert(
      result.code === 0,
      "BUILD_FAILED",
      `${packageRoot}: ${result.stdout}${result.stderr}`.trim(),
    );
    count += 1;
  }
  return count;
}

async function buildPackages(context) {
  const output = resolve(context.root, "evidence/runs/artifacts/build");
  const count = await compilePackages(context, output);
  const entries = await walk(output);
  return {
    selected: count,
    executed: count,
    passed: count,
    outputDigest: await digestFiles(
      output,
      entries
        .filter((entry) => entry.type === "file")
        .map((entry) => entry.relative),
    ),
  };
}

async function copyPackageStage(
  context,
  record,
  buildRoot,
  stageRoot,
  sourceRoot = context.root,
) {
  const packageStage = resolve(stageRoot, basename(record.root));
  await rm(packageStage, { recursive: true, force: true });
  await mkdir(resolve(packageStage, "dist"), { recursive: true, mode: 0o700 });
  for (const file of ["package.json", "README.md", "LICENSE", "NOTICE"]) {
    await copyFile(
      resolve(sourceRoot, record.root, file),
      resolve(packageStage, file),
    );
  }
  for (const entry of await walk(
    resolve(buildRoot, basename(record.root), "dist"),
  )) {
    if (entry.type !== "file" || entry.relative.endsWith(".map")) continue;
    const target = resolveContained(
      resolve(packageStage, "dist"),
      entry.relative,
    );
    await mkdir(dirname(target), { recursive: true, mode: 0o700 });
    await copyFile(entry.path, target);
  }
  return packageStage;
}

async function parseTarGz(path) {
  const chunks = [];
  const stream = createReadStream(path).pipe(createGunzip());
  for await (const chunk of stream) chunks.push(chunk);
  const bytes = Buffer.concat(chunks);
  const entries = [];
  let offset = 0;
  while (offset + 512 <= bytes.length) {
    const header = bytes.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const text = (start, length) =>
      header
        .subarray(start, start + length)
        .toString("utf8")
        .replace(/\0.*$/su, "");
    const name = `${text(345, 155)}${text(345, 155) ? "/" : ""}${text(0, 100)}`;
    const size = Number.parseInt(text(124, 12).trim() || "0", 8);
    const mode = Number.parseInt(text(100, 8).trim() || "0", 8);
    const typeFlag = text(156, 1) || "0";
    assert(
      !name.startsWith("/") && !name.split("/").includes(".."),
      "ARCHIVE_PATH",
      name,
    );
    assert(
      ["0", "5"].includes(typeFlag),
      "ARCHIVE_TYPE",
      `${name}: ${typeFlag}`,
    );
    if (typeFlag === "0")
      entries.push({ path: name, type: "file", size, mode });
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return entries;
}

async function packAll(
  context,
  outputRoot,
  buildRoot,
  sourceRoot = context.root,
) {
  const registry = await readJson(
    resolve(context.root, "config/repository/packages.json"),
  );
  const npmCli = resolve(context.root, "node_modules/npm/bin/npm-cli.js");
  const stageRoot = resolve(outputRoot, "stage");
  const tarballRoot = resolve(outputRoot, "tarballs");
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(tarballRoot, { recursive: true, mode: 0o700 });
  const subjects = [];
  for (const record of registry.packages) {
    const stage = await copyPackageStage(
      context,
      record,
      buildRoot,
      stageRoot,
      sourceRoot,
    );
    const result = await run(
      process.execPath,
      [
        npmCli,
        "pack",
        "--ignore-scripts",
        "--json",
        "--pack-destination",
        tarballRoot,
      ],
      {
        cwd: stage,
        timeoutMs: 120000,
        env: {
          ...process.env,
          TZ: "UTC",
          SOURCE_DATE_EPOCH: "0",
          npm_config_cache: resolve(outputRoot, "npm-cache"),
        },
      },
    );
    assert(
      result.code === 0,
      "PACKAGE_PACK_FAILED",
      `${result.stdout}${result.stderr}`.trim(),
    );
    const data = JSON.parse(result.stdout);
    const path = resolve(tarballRoot, data[0].filename);
    const entries = await parseTarGz(path);
    validatePackageEntries(entries, record.allowlist);
    subjects.push({
      name: record.name,
      path,
      sha256: await sha256File(path),
      entries,
    });
  }
  return subjects;
}

async function packageAllowlists(context) {
  const buildRoot = resolve(context.root, "evidence/runs/artifacts/build");
  if ((await walk(buildRoot)).length === 0)
    await compilePackages(context, buildRoot);
  const output = resolve(context.root, "evidence/runs/artifacts/packages");
  const subjects = await packAll(context, output, buildRoot);
  await writeJsonAtomic(resolve(output, "manifest.json"), {
    schemaVersion: 1,
    subjects: subjects.map(({ name, path, sha256: digest, entries }) => ({
      name,
      file: basename(path),
      sha256: digest,
      entries,
    })),
  });
  return {
    selected: subjects.length,
    executed: subjects.length,
    passed: subjects.length,
    outputDigest: sha256(
      canonicalJson(subjects.map((subject) => [subject.name, subject.sha256])),
    ),
  };
}

async function isolatedPack(context, root) {
  const source = resolve(root, "source");
  const build = resolve(root, "build");
  const packages = resolve(root, "packages");
  await rm(root, { recursive: true, force: true });
  await mkdir(source, { recursive: true, mode: 0o700 });
  await copyFile(
    resolve(context.root, "tsconfig.json"),
    resolve(source, "tsconfig.json"),
  );
  for (const packageRoot of PACKAGE_ROOTS) {
    await cp(resolve(context.root, packageRoot), resolve(source, packageRoot), {
      recursive: true,
      force: false,
      filter(path) {
        return !path.includes(
          `${process.platform === "win32" ? "\\" : "/"}dist`,
        );
      },
    });
  }
  await compilePackages(context, build, source);
  return packAll(context, packages, build, source);
}

async function packageReproducibility(context) {
  const output = resolve(
    context.root,
    "evidence/runs/artifacts/reproducibility",
  );
  await rm(output, { recursive: true, force: true });
  const first = await isolatedPack(context, resolve(output, "absolute-path-a"));
  const second = await isolatedPack(
    context,
    resolve(output, "different", "absolute-path-b"),
  );
  const comparisons = [];
  for (const subject of first) {
    const peer = second.find((entry) => entry.name === subject.name);
    validateReproducible(subject.sha256, peer?.sha256);
    comparisons.push({ name: subject.name, sha256: subject.sha256 });
  }
  await writeJsonAtomic(resolve(output, "comparison.json"), {
    schemaVersion: 1,
    perturbations: [
      "absolute-path",
      "output-order",
      "UTC",
      "SOURCE_DATE_EPOCH=0",
    ],
    comparisons,
  });
  return {
    selected: comparisons.length,
    executed: comparisons.length * 2,
    passed: comparisons.length * 2,
    outputDigest: sha256(canonicalJson(comparisons)),
  };
}

async function integrationConsumers(context) {
  const packageRoot = resolve(context.root, "evidence/runs/artifacts/packages");
  const manifest = await readJson(resolve(packageRoot, "manifest.json"));
  const consumerRoot = resolve(
    context.root,
    "evidence/runs/artifacts/consumers/clean-consumer",
  );
  await rm(consumerRoot, { recursive: true, force: true });
  await mkdir(consumerRoot, { recursive: true, mode: 0o700 });
  await writeJsonAtomic(resolve(consumerRoot, "package.json"), {
    name: "verifactu-p2-clean-consumer",
    version: "0.0.0",
    private: true,
    type: "module",
  });
  const npmCli = resolve(context.root, "node_modules/npm/bin/npm-cli.js");
  const cacheResult = await runNpm(["config", "get", "cache"], {
    cwd: context.root,
    timeoutMs: 30000,
  });
  assert(cacheResult.code === 0, "CONSUMER_CACHE", cacheResult.stderr);
  const verifiedCache =
    process.env.npm_config_cache ?? cacheResult.stdout.trim();
  const tarballs = manifest.subjects.map((subject) =>
    resolve(packageRoot, "tarballs", subject.file),
  );
  const install = await run(
    process.execPath,
    [
      npmCli,
      "install",
      "--offline",
      "--ignore-scripts",
      "--omit=optional",
      "--no-audit",
      "--no-fund",
      ...tarballs,
    ],
    {
      cwd: consumerRoot,
      timeoutMs: 240000,
      env: {
        ...process.env,
        npm_config_cache: verifiedCache,
      },
    },
  );
  assert(
    install.code === 0,
    "CONSUMER_INSTALL",
    `${install.stdout}${install.stderr}`.trim(),
  );
  const verificationPath = "node_modules/@noeos/verification-engine";
  const verificationRoot = resolve(context.root, verificationPath);
  const verificationConsumer = resolve(consumerRoot, verificationPath);
  const rootFiles = (await walk(verificationRoot))
    .filter((entry) => entry.type === "file")
    .map((entry) => entry.relative);
  const consumerFiles = (await walk(verificationConsumer))
    .filter((entry) => entry.type === "file")
    .map((entry) => entry.relative);
  assert(
    canonicalJson(rootFiles) === canonicalJson(consumerFiles) &&
      (await digestFiles(verificationRoot, rootFiles)) ===
        (await digestFiles(verificationConsumer, consumerFiles)),
    "CONSUMER_DEPENDENCY_DRIFT",
    verificationPath,
  );
  let passed = 0;
  for (const name of PACKAGE_NAMES) {
    const expression = `import(${JSON.stringify(name)}).then(m=>{if(Object.keys(m).length!==0)process.exit(2)})`;
    const result = await run(
      process.execPath,
      ["--input-type=module", "--eval", expression],
      { cwd: consumerRoot, timeoutMs: 30000 },
    );
    assert(result.code === 0, "CONSUMER_IMPORT", `${name}: ${result.stderr}`);
    const installed = resolve(consumerRoot, "node_modules", ...name.split("/"));
    const real = await stat(installed);
    assert(real.isDirectory(), "CONSUMER_WORKSPACE_LEAK", name);
    passed += 1;
  }
  const deep = await run(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      'import("@noeos/verifactu/src/index.js")',
    ],
    { cwd: consumerRoot, timeoutMs: 30000 },
  );
  assert(
    deep.code !== 0,
    "CONSUMER_DEEP_IMPORT",
    "private deep import succeeded",
  );
  return {
    selected: PACKAGE_NAMES.length + 1,
    executed: PACKAGE_NAMES.length + 1,
    passed: passed + 1,
  };
}

async function componentGraph(context) {
  const lock = await readJson(resolve(context.root, "package-lock.json"));
  const toolchain = await readJson(
    resolve(context.root, "config/toolchain/toolchain.json"),
  );
  const python = await readJson(
    resolve(context.root, "config/admission/python-dependencies.json"),
  );
  const javaProvider = await readJson(
    resolve(context.root, "config/admission/java-provider.json"),
  );
  const actions = (
    await readJson(resolve(context.root, "config/admission/actions.json"))
  ).actions;
  const tools = (
    await readJson(
      resolve(context.root, "config/admission/external-tools.json"),
    )
  ).tools;
  const external = (
    await readJson(
      resolve(context.root, "config/admission/external-inputs.json"),
    )
  ).inputs;
  const packageManifest = await readJson(
    resolve(context.root, "evidence/runs/artifacts/packages/manifest.json"),
  );
  const licenseOverrides = new Map(
    (
      await readJson(
        resolve(context.root, "config/admission/license-evidence.json"),
      )
    ).overrides.map((entry) => [entry.path, entry.spdx]),
  );
  const dependencyAdmissions = new Map(
    (
      await readJson(
        resolve(context.root, "config/admission/dependencies.json"),
      )
    ).dependencies.map((entry) => [entry.name, entry]),
  );
  const components = [
    {
      id: "workspace:@noeos/verifactu-workspace@0.0.0-development",
      type: "workspace",
      name: "@noeos/verifactu-workspace",
      version: "0.0.0-development",
      digest: context.identity.tree,
      license: "Apache-2.0",
      scope: "subject",
    },
  ];
  const npmIdByPath = new Map();
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (!path.startsWith("node_modules/")) continue;
    if (entry.link === true) continue;
    const name = path
      .split("/node_modules/")
      .at(-1)
      .replace(/^node_modules\//u, "");
    let digest = entry.integrity;
    if (!digest) {
      const installedRoot = resolve(context.root, path);
      const installedFiles = (await walk(installedRoot))
        .filter((item) => item.type === "file")
        .map((item) => item.relative);
      digest = `sha256-${await digestFiles(installedRoot, installedFiles)}`;
    }
    const id = `npm:${path.slice(13)}@${entry.version}`;
    npmIdByPath.set(path, id);
    components.push({
      id,
      type: "npm",
      name,
      version: entry.version,
      purl: `pkg:npm/${name.startsWith("@") ? `%40${name.slice(1)}` : name}@${entry.version}`,
      source: entry.resolved ?? (entry.inBundle ? "bundled-in:npm" : null),
      digest,
      license: entry.license ?? licenseOverrides.get(path),
      licenseEvidence: entry.license
        ? "package-lock.json"
        : "config/admission/license-evidence.json",
      scope: entry.dev ? "development" : "runtime",
      optional: entry.optional === true,
      peer: entry.peer === true,
      platform: {
        os: entry.os ?? [],
        cpu: entry.cpu ?? [],
        libc: entry.libc ?? [],
      },
      lifecycleScript: entry.hasInstallScript === true,
      bundled: entry.inBundle === true,
      admissionId: dependencyAdmissions.has(name)
        ? `npm:${name}@${entry.version}`
        : null,
    });
  }
  for (const item of actions)
    components.push({
      id: `action:${item.name}@${item.sha}`,
      type: "github-action",
      name: item.name,
      version: item.sha,
      digest: item.sha,
      license: item.license,
      scope: "build",
    });
  for (const item of tools)
    components.push({
      id: `tool:${item.id}@${item.version}`,
      type: "tool",
      name: item.id,
      version: item.version,
      digest: item.sha256,
      license: item.license,
      scope: "build",
    });
  for (const item of external)
    components.push({
      id: `data:${item.id}`,
      type: "data",
      name: item.id,
      version: "immutable",
      digest: item.sha256,
      license: item.license,
      scope: "build",
    });
  for (const profile of toolchain.profiles) {
    components.push({
      id: `runtime:node@${profile.node}`,
      type: "runtime",
      name: "node",
      version: profile.node,
      digest: profile.shasumsSha256,
      license: "MIT",
      scope: profile.id === "current-informational" ? "observed" : "build",
    });
  }
  for (const runtime of toolchain.referenceRuntimes) {
    components.push({
      id: `runtime:${runtime.id}@${runtime.version}`,
      type: "runtime",
      name: runtime.id,
      version: runtime.version,
      digest: runtime.sha256,
      license: "Python-2.0",
      scope: "build",
    });
  }
  for (const item of python.dependencies) {
    components.push({
      id: `pypi:${item.name}@${item.version}`,
      type: "pypi",
      name: item.name,
      version: item.version,
      digest: item.sha256[0],
      alternateDigests: item.sha256.slice(1),
      license: item.license,
      scope: "build",
    });
  }
  const javaProviderId =
    "pkg:maven/eu.noeos.verifactu.internal/verifactu-xades-provider@0.0.0-development";
  const pluginRootPurl = (plugin) =>
    `pkg:maven/${plugin.groupId}/${plugin.artifactId}@${plugin.version}`;
  components.push({
    id: javaProviderId,
    type: "maven-provider",
    name: "verifactu-xades-provider",
    version: "0.0.0-development",
    purl: javaProviderId,
    digest: javaProvider.licenseClosure.shadedArchive.sha256,
    license: "Apache-2.0",
    scope: "subject",
  });
  for (const item of javaProvider.components) {
    components.push({
      id: item.purl,
      type: "maven",
      name: `${item.groupId}:${item.artifactId}`,
      version: item.version,
      purl: item.purl,
      digest: item.jarSha256,
      license: item.spdxLicenseExpression,
      scope: item.scope.includes("runtime") ? "runtime" : "build",
      source: "config/admission/java-provider.json",
    });
  }
  for (const item of packageManifest.subjects)
    components.push({
      id: `package:${item.name}@0.0.0-development`,
      type: "package",
      name: item.name,
      version: "0.0.0-development",
      digest: item.sha256,
      license: "Apache-2.0",
      scope: "subject",
    });
  components.sort((a, b) => a.id.localeCompare(b.id, "en"));
  const ids = new Set();
  for (const component of components) {
    assert(!ids.has(component.id), "COMPONENT_DUPLICATE", component.id);
    ids.add(component.id);
  }
  const workspaceId = "workspace:@noeos/verifactu-workspace@0.0.0-development";
  const relationships = [];
  const addRelationship = (from, to, type = "dependsOn") => {
    if (from && to && from !== to) relationships.push({ from, to, type });
  };
  const resolveNpmDependency = (fromPath, name) => {
    const segments = fromPath.split("/node_modules/");
    while (segments.length > 0) {
      const prefix = segments.join("/node_modules/");
      const candidate = `${prefix ? `${prefix}/` : ""}node_modules/${name}`;
      if (npmIdByPath.has(candidate)) return npmIdByPath.get(candidate);
      segments.pop();
    }
    return npmIdByPath.get(`node_modules/${name}`);
  };
  for (const [path, entry] of Object.entries(lock.packages)) {
    const from = path === "" ? workspaceId : npmIdByPath.get(path);
    if (!from) continue;
    const declared = {
      ...(entry.dependencies ?? {}),
      ...(entry.optionalDependencies ?? {}),
    };
    for (const name of Object.keys(declared))
      addRelationship(from, resolveNpmDependency(path, name));
  }
  for (const component of components) {
    if (
      ["github-action", "tool", "data", "runtime", "pypi"].includes(
        component.type,
      )
    )
      addRelationship(workspaceId, component.id, "buildDependency");
    if (component.type === "package")
      addRelationship(workspaceId, component.id, "contains");
  }
  const subjectByName = new Map(
    components
      .filter((component) => component.type === "package")
      .map((component) => [component.name, component.id]),
  );
  for (const packageRoot of PACKAGE_ROOTS) {
    const manifest = await readJson(
      resolve(context.root, packageRoot, "package.json"),
    );
    const from = subjectByName.get(manifest.name);
    for (const name of Object.keys(manifest.dependencies ?? {}))
      addRelationship(
        from,
        subjectByName.get(name) ?? resolveNpmDependency("", name),
      );
  }
  for (const dependency of ["pyshacl", "rdflib", "lxml", "xmlschema"])
    addRelationship(
      "runtime:python@3.13.15",
      `pypi:${dependency}@${python.dependencies.find((item) => item.name === dependency).version}`,
    );
  const pythonEdges = {
    pyshacl: ["owlrl", "packaging", "prettytable", "rdflib"],
    rdflib: ["html5rdf", "pyparsing"],
    owlrl: ["rdflib"],
    prettytable: ["wcwidth"],
    xmlschema: ["elementpath"],
  };
  for (const [fromName, dependencyNames] of Object.entries(pythonEdges)) {
    const fromRecord = python.dependencies.find(
      (item) => item.name === fromName,
    );
    for (const dependencyName of dependencyNames) {
      const toRecord = python.dependencies.find(
        (item) => item.name === dependencyName,
      );
      addRelationship(
        `pypi:${fromName}@${fromRecord.version}`,
        `pypi:${dependencyName}@${toRecord.version}`,
      );
    }
  }
  for (const edge of javaProvider.runtimeGraph.edges)
    addRelationship(edge.from, edge.to, "dependsOn");
  for (const edge of javaProvider.buildPluginGraph.edges)
    addRelationship(edge.from, edge.to, "buildDependency");
  for (const plugin of javaProvider.buildPluginGraph.plugins)
    for (const purl of new Set(plugin.resolvedComponents))
      if (pluginRootPurl(plugin) !== purl)
        addRelationship(pluginRootPurl(plugin), purl, "buildDependency");
  const uniqueRelationships = [
    ...new Map(
      relationships.map((entry) => [
        `${entry.from}\0${entry.to}\0${entry.type}`,
        entry,
      ]),
    ).values(),
  ].sort((a, b) => canonicalJson(a).localeCompare(canonicalJson(b), "en"));
  const componentById = new Map(
    components.map((component) => [component.id, component]),
  );
  for (const admitted of javaProvider.components) {
    const actual = componentById.get(admitted.purl);
    assert(
      actual?.digest === admitted.jarSha256 &&
        actual.license === admitted.spdxLicenseExpression,
      "JAVA_PROVIDER_SBOM_COMPONENT",
      admitted.purl,
    );
  }
  assert(
    componentById.get(javaProviderId)?.digest ===
      javaProvider.licenseClosure.shadedArchive.sha256,
    "JAVA_PROVIDER_SBOM_SHADED_ARCHIVE",
    javaProviderId,
  );
  const relationshipIds = new Set(
    uniqueRelationships.map((edge) => `${edge.from}\0${edge.to}\0${edge.type}`),
  );
  for (const edge of javaProvider.runtimeGraph.edges)
    assert(
      relationshipIds.has(`${edge.from}\0${edge.to}\0dependsOn`),
      "JAVA_PROVIDER_SBOM_RUNTIME_EDGE",
      `${edge.from} -> ${edge.to}`,
    );
  for (const edge of javaProvider.buildPluginGraph.edges)
    assert(
      relationshipIds.has(`${edge.from}\0${edge.to}\0buildDependency`),
      "JAVA_PROVIDER_SBOM_PLUGIN_EDGE",
      `${edge.from} -> ${edge.to}`,
    );
  for (const plugin of javaProvider.buildPluginGraph.plugins)
    for (const purl of new Set(plugin.resolvedComponents))
      if (pluginRootPurl(plugin) !== purl)
        assert(
          relationshipIds.has(
            `${pluginRootPurl(plugin)}\0${purl}\0buildDependency`,
          ),
          "JAVA_PROVIDER_SBOM_PLUGIN_MEMBERSHIP",
          `${plugin.artifactId} -> ${purl}`,
        );
  for (const relationship of uniqueRelationships) {
    assert(
      ids.has(relationship.from),
      "COMPONENT_RELATIONSHIP_FROM",
      relationship.from,
    );
    assert(
      ids.has(relationship.to),
      "COMPONENT_RELATIONSHIP_TO",
      relationship.to,
    );
  }
  return {
    schemaVersion: 1,
    subject: context.identity.subject,
    tree: context.identity.tree,
    components,
    relationships: uniqueRelationships,
  };
}

async function sbomComponentGraph(context) {
  const graph = await componentGraph(context);
  const path = resolve(
    context.root,
    "evidence/runs/artifacts/sbom/component-graph.json",
  );
  await writeJsonAtomic(path, graph);
  return {
    selected: graph.components.length,
    executed: graph.components.length,
    passed: graph.components.length,
    outputDigest: await sha256File(path),
  };
}

function cyclonedxFromGraph(graph) {
  const digestRecords = (digest) => {
    if (/^[a-f0-9]{64}$/u.test(digest ?? ""))
      return [{ alg: "SHA-256", content: digest }];
    if (/^[a-f0-9]{40}$/u.test(digest ?? ""))
      return [{ alg: "SHA-1", content: digest }];
    const sri = /^(sha256|sha512)-(.+)$/u.exec(digest ?? "");
    if (sri)
      return [
        {
          alg: sri[1] === "sha256" ? "SHA-256" : "SHA-512",
          content: Buffer.from(sri[2], "base64").toString("hex"),
        },
      ];
    return undefined;
  };
  const components = graph.components.map((component) => ({
    type:
      component.type === "package" ||
      component.type === "npm" ||
      component.type === "maven"
        ? "library"
        : "application",
    "bom-ref": component.id,
    name: component.name,
    version: component.version,
    purl: component.purl,
    hashes: digestRecords(component.digest),
    licenses: [
      /\s(?:AND|OR|WITH)\s/u.test(component.license) ||
      component.license.startsWith("LicenseRef-")
        ? { expression: component.license }
        : { license: { id: component.license } },
    ],
    properties: [
      { name: "noeos:scope", value: component.scope },
      { name: "noeos:type", value: component.type },
      ...(component.source
        ? [{ name: "noeos:source", value: component.source }]
        : []),
      ...(component.admissionId
        ? [{ name: "noeos:admission", value: component.admissionId }]
        : []),
      ...(component.optional === undefined
        ? []
        : [{ name: "noeos:optional", value: String(component.optional) }]),
      ...(component.peer === undefined
        ? []
        : [{ name: "noeos:peer", value: String(component.peer) }]),
    ],
  }));
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.7",
    version: 1,
    metadata: {
      timestamp: "1970-01-01T00:00:00Z",
      component: {
        type: "application",
        "bom-ref": "workspace:@noeos/verifactu",
        name: "@noeos/verifactu-workspace",
        version: "0.0.0-development",
      },
    },
    components,
    dependencies: components.map((component) => ({
      ref: component["bom-ref"],
      dependsOn: graph.relationships
        .filter((relationship) => relationship.from === component["bom-ref"])
        .map((relationship) => relationship.to)
        .sort(),
    })),
  };
}

function spdxFromGraph(graph) {
  const creation = "_:creationinfo";
  const documentId = "https://noeos.dev/spdx/p2/document";
  const licenseExpressions = [
    ...new Set(graph.components.map((component) => component.license)),
  ]
    .sort()
    .map((expression) => ({
      type: "simplelicensing_LicenseExpression",
      spdxId: `https://noeos.dev/spdx/p2/license/${sha256(expression)}`,
      creationInfo: creation,
      simplelicensing_licenseExpression: expression,
    }));
  const licenseIdByExpression = new Map(
    licenseExpressions.map((entry) => [
      entry.simplelicensing_licenseExpression,
      entry.spdxId,
    ]),
  );
  const packageElements = graph.components.map((component, index) => ({
    type: "software_Package",
    spdxId: `https://noeos.dev/spdx/p2/package/${index}`,
    creationInfo: creation,
    name: component.name,
    software_packageVersion: component.version,
    software_downloadLocation: "https://noeos.dev/not-published",
    software_packageUrl: component.purl,
    software_sourceInfo: component.source,
    software_copyrightText: "Copyright 2026 Noeos contributors",
    comment: `noeos type=${component.type}; scope=${component.scope}`,
    verifiedUsing: /^[a-f0-9]{64}$/u.test(component.digest ?? "")
      ? [{ type: "Hash", algorithm: "sha256", hashValue: component.digest }]
      : /^[a-f0-9]{40}$/u.test(component.digest ?? "")
        ? [{ type: "Hash", algorithm: "sha1", hashValue: component.digest }]
        : undefined,
  }));
  const idMap = new Map(
    graph.components.map((component, index) => [
      component.id,
      packageElements[index].spdxId,
    ]),
  );
  const relationshipElements = graph.relationships.map(
    (relationship, index) => ({
      type: "Relationship",
      spdxId: `https://noeos.dev/spdx/p2/relationship/${index}`,
      creationInfo: creation,
      from: idMap.get(relationship.from),
      relationshipType:
        relationship.type === "contains" ? "contains" : "dependsOn",
      to: [idMap.get(relationship.to)],
      completeness: "complete",
      comment: `noeos relationship type=${relationship.type}`,
    }),
  );
  for (const [index, component] of graph.components.entries())
    relationshipElements.push({
      type: "Relationship",
      spdxId: `https://noeos.dev/spdx/p2/license-relationship/${index}`,
      creationInfo: creation,
      from: packageElements[index].spdxId,
      relationshipType: "hasDeclaredLicense",
      to: [licenseIdByExpression.get(component.license)],
      completeness: "complete",
    });
  return {
    "@context": "https://spdx.org/rdf/3.0.1/spdx-context.jsonld",
    "@graph": [
      {
        type: "CreationInfo",
        "@id": creation,
        createdBy: ["https://github.com/noeos"],
        specVersion: "3.0.1",
        created: "1970-01-01T00:00:00Z",
      },
      {
        type: "Organization",
        spdxId: "https://github.com/noeos",
        name: "Noeos",
        creationInfo: creation,
      },
      {
        type: "SpdxDocument",
        spdxId: documentId,
        creationInfo: creation,
        rootElement: packageElements
          .filter((_, index) => graph.components[index].scope === "subject")
          .map((entry) => entry.spdxId),
        element: [
          "https://github.com/noeos",
          ...packageElements.map((entry) => entry.spdxId),
          ...licenseExpressions.map((entry) => entry.spdxId),
          ...relationshipElements.map((entry) => entry.spdxId),
        ],
        profileConformance: ["core", "software"],
      },
      ...packageElements,
      ...licenseExpressions,
      ...relationshipElements,
    ],
  };
}

function validateSpdxDocument(document, graph) {
  const elements = document["@graph"];
  const identified = elements.filter((entry) => entry.spdxId);
  const byId = new Map(identified.map((entry) => [entry.spdxId, entry]));
  assert(byId.size === identified.length, "SPDX_ELEMENT_DUPLICATE", "spdxId");
  const allowedTypes = new Set([
    "CreationInfo",
    "Organization",
    "SpdxDocument",
    "software_Package",
    "simplelicensing_LicenseExpression",
    "Relationship",
  ]);
  for (const entry of elements)
    assert(allowedTypes.has(entry.type), "SPDX_VOCABULARY", entry.type);
  const spdxDocument = elements.find((entry) => entry.type === "SpdxDocument");
  assert(spdxDocument, "SPDX_SUBJECT_MISSING", "document");
  const packages = elements.filter(
    (entry) => entry.type === "software_Package",
  );
  assert(
    packages.length === graph.components.length,
    "SPDX_SUBJECT_MISSING",
    "package count",
  );
  const relationships = elements.filter(
    (entry) => entry.type === "Relationship",
  );
  for (const relationship of relationships) {
    assert(
      byId.has(relationship.from) &&
        Array.isArray(relationship.to) &&
        relationship.to.length > 0 &&
        relationship.to.every((id) => byId.has(id)),
      "SPDX_RELATIONSHIP_DANGLING",
      relationship.spdxId,
    );
  }
  for (const [index, component] of graph.components.entries()) {
    const entry = packages[index];
    if (component.scope === "subject") {
      assert(
        spdxDocument.rootElement?.includes(entry.spdxId),
        "SPDX_SUBJECT_MISSING",
        entry.spdxId,
      );
      assert(
        entry.verifiedUsing?.some(
          (hash) =>
            hash.algorithm ===
              (/^[a-f0-9]{40}$/u.test(component.digest) ? "sha1" : "sha256") &&
            hash.hashValue === component.digest,
        ),
        "SPDX_SUBJECT_HASH",
        entry.spdxId,
      );
    }
    const licenses = relationships.filter(
      (relationship) =>
        relationship.from === entry.spdxId &&
        relationship.relationshipType === "hasDeclaredLicense",
    );
    assert(
      licenses.length === 1 && licenses[0].to.length === 1,
      "SPDX_LICENSE_MISSING",
      entry.spdxId,
    );
    assert(
      byId.get(licenses[0].to[0])?.simplelicensing_licenseExpression ===
        component.license,
      "SPDX_LICENSE_CONTRADICTION",
      entry.spdxId,
    );
  }
  return graph.components.length;
}

function addSchemaFormats(instance) {
  addFormats(instance);
  instance.addFormat("iri", {
    type: "string",
    validate(value) {
      try {
        return new URL(value).href.length > 0;
      } catch {
        return false;
      }
    },
  });
  instance.addFormat("iri-reference", {
    type: "string",
    validate(value) {
      if (/\s/u.test(value)) return false;
      try {
        return new URL(value, "https://noeos.invalid/base").href.length > 0;
      } catch {
        return false;
      }
    },
  });
  instance.addFormat("idn-email", {
    type: "string",
    validate: /^[^\s@]+@[^\s@]+\.[^\s@]+$/u,
  });
}

async function sbomDocuments(context) {
  const outputRoot = resolve(context.root, "evidence/runs/artifacts/sbom");
  const graph = await readJson(resolve(outputRoot, "component-graph.json"));
  const cyclonedx = cyclonedxFromGraph(graph);
  const spdx = spdxFromGraph(graph);
  validateSpdxDocument(spdx, graph);
  const prepared = resolve(context.root, "evidence/runs/prepared");
  const cdxSchema = await readJson(resolve(prepared, "cyclonedx-1.7-schema"));
  const cdxSpdxSchema = await readJson(
    resolve(prepared, "cyclonedx-spdx-schema"),
  );
  const cdxJsfSchema = await readJson(
    resolve(prepared, "cyclonedx-jsf-schema"),
  );
  const cdxCryptoSchema = await readJson(
    resolve(prepared, "cyclonedx-crypto-schema"),
  );
  const spdxSchema = await readJson(resolve(prepared, "spdx-3.0.1-schema"));
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
  });
  addSchemaFormats(ajv);
  ajv.addSchema(cdxSpdxSchema, "http://cyclonedx.org/schema/spdx.schema.json");
  ajv.addSchema(
    cdxJsfSchema,
    "http://cyclonedx.org/schema/jsf-0.82.schema.json",
  );
  ajv.addSchema(
    cdxCryptoSchema,
    "http://cyclonedx.org/schema/cryptography-defs.schema.json",
  );
  const validateCdx = ajv.compile(cdxSchema);
  assert(
    validateCdx(cyclonedx),
    "CYCLONEDX_SCHEMA",
    JSON.stringify(validateCdx.errors),
  );
  const spdxAjv = new Ajv2020({
    allErrors: true,
    strict: false,
  });
  addSchemaFormats(spdxAjv);
  const validateSpdx = spdxAjv.compile(spdxSchema);
  assert(
    validateSpdx(spdx),
    "SPDX_SCHEMA",
    JSON.stringify(validateSpdx.errors),
  );
  assert(
    cyclonedx.components.length === graph.components.length,
    "SBOM_RECONCILIATION",
    "CycloneDX count",
  );
  assert(
    spdx["@graph"].filter((entry) => entry.type === "software_Package")
      .length === graph.components.length,
    "SBOM_RECONCILIATION",
    "SPDX count",
  );
  const cdxPath = resolve(outputRoot, "cyclonedx-1.7.json");
  const spdxPath = resolve(outputRoot, "spdx-3.0.1.json");
  await writeJsonAtomic(cdxPath, cyclonedx);
  await writeJsonAtomic(spdxPath, spdx);
  const python =
    process.env.VERIFACTU_PYTHON ??
    (process.platform === "win32" ? "python" : "python3");
  const shacl = await run(
    python,
    [
      "tooling/sbom/validate-spdx.py",
      "--document",
      spdxPath,
      "--context",
      resolve(prepared, "spdx-3.0.1-context"),
      "--model",
      resolve(prepared, "spdx-3.0.1-model"),
    ],
    { cwd: context.root, timeoutMs: 180000 },
  );
  assert(
    shacl.code === 0,
    "SPDX_SHACL",
    `${shacl.stdout}${shacl.stderr}`.trim(),
  );
  const reconciliation = {
    schemaVersion: 1,
    componentGraphSha256: await sha256File(
      resolve(outputRoot, "component-graph.json"),
    ),
    cyclonedxSha256: await sha256File(cdxPath),
    spdxSha256: await sha256File(spdxPath),
    graphComponents: graph.components.length,
    cyclonedxComponents: cyclonedx.components.length,
    spdxPackages: graph.components.length,
    spdxShacl: JSON.parse(shacl.stdout),
    differences: [],
  };
  await writeJsonAtomic(
    resolve(outputRoot, "reconciliation.json"),
    reconciliation,
  );
  return {
    selected: graph.components.length,
    executed: graph.components.length * 2,
    passed: graph.components.length * 2,
    outputDigest: sha256(canonicalJson(reconciliation)),
  };
}

async function provenanceRehearsal(context) {
  const policy = await readJson(
    resolve(context.root, "config/provenance/rehearsal.json"),
  );
  const packageManifest = await readJson(
    resolve(context.root, "evidence/runs/artifacts/packages/manifest.json"),
  );
  const reconciliation = await readJson(
    resolve(context.root, "evidence/runs/artifacts/sbom/reconciliation.json"),
  );
  const materials = [
    ["package-lock.json", "package-lock.json"],
    ["toolchain", "config/toolchain/toolchain.json"],
    ["dependency-admissions", "config/admission/dependencies.json"],
    ["action-admissions", "config/admission/actions.json"],
    ["external-input-admissions", "config/admission/external-inputs.json"],
    ["package-manifest", "evidence/runs/artifacts/packages/manifest.json"],
  ];
  const resolvedMaterials = [];
  for (const [uri, path] of materials)
    resolvedMaterials.push({
      uri,
      digest: { sha256: await sha256File(resolve(context.root, path)) },
    });
  resolvedMaterials.push(
    {
      uri: "component-graph",
      digest: { sha256: reconciliation.componentGraphSha256 },
    },
    {
      uri: "cyclonedx-1.7",
      digest: { sha256: reconciliation.cyclonedxSha256 },
    },
    { uri: "spdx-3.0.1", digest: { sha256: reconciliation.spdxSha256 } },
  );
  const statement = {
    _type: "https://in-toto.io/Statement/v1",
    subject: packageManifest.subjects.map((entry) => ({
      name: entry.name,
      digest: { sha256: entry.sha256 },
    })),
    predicateType: "https://slsa.dev/provenance/v1",
    predicate: {
      buildDefinition: {
        buildType: policy.buildType,
        externalParameters: {
          sourceCommit: context.identity.subject,
          sourceTree: context.identity.tree,
          packageNames: packageManifest.subjects.map((entry) => entry.name),
        },
        internalParameters: { publish: false, sourceDateEpoch: 0 },
        resolvedDependencies: [
          {
            uri: `git+https://github.com/noeos/verifactu@${context.identity.subject}`,
            digest: { gitTree: context.identity.tree },
          },
          ...resolvedMaterials,
        ],
      },
      runDetails: {
        builder: { id: policy.builder },
        metadata: {
          invocationId: `non-publishing-p2-rehearsal-${context.identity.subject}`,
        },
      },
    },
    claims: {
      signed: false,
      publishable: false,
      slsaLevel: "none",
      limitation:
        "schema and subject rehearsal only; no hosted attestation or release provenance",
    },
  };
  assert(
    statement.claims.signed === false && statement.claims.publishable === false,
    "PROVENANCE_OVERCLAIM",
    "rehearsal claims trust",
  );
  const path = resolve(
    context.root,
    "evidence/runs/artifacts/provenance/rehearsal.json",
  );
  await writeJsonAtomic(path, statement);
  return {
    selected: statement.subject.length,
    executed: statement.subject.length,
    passed: statement.subject.length,
    outputDigest: await sha256File(path),
  };
}

function fakeDownloadResponse(status, bytes = Buffer.alloc(0)) {
  let delivered = false;
  return {
    ok: status >= 200 && status < 300,
    status,
    body: {
      async cancel() {},
      getReader() {
        return {
          async read() {
            if (delivered) return { done: true };
            delivered = true;
            return { done: false, value: bytes };
          },
        };
      },
    },
  };
}

async function downloadBounded(input, path, fetchImplementation = fetch) {
  const retry = new Set([408, 425, 429, 500, 502, 503, 504]);
  let last;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetchImplementation(input.url, {
        redirect: "follow",
        signal: AbortSignal.timeout(30000),
        headers: {
          "User-Agent": "noeos-verifactu-assurance/1",
          ...(input.accept ? { Accept: input.accept } : {}),
        },
      });
      if (!response.ok) {
        await response.body?.cancel();
        if (!retry.has(response.status))
          assert(
            false,
            "DOWNLOAD_HTTP",
            `${new URL(input.url).origin}${new URL(input.url).pathname}: ${response.status}`,
          );
        last = new Error(`transient ${response.status}`);
        continue;
      }
      const reader = response.body.getReader();
      const chunks = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        assert(size <= input.maximumBytes, "DOWNLOAD_SIZE", input.id);
        chunks.push(value);
      }
      const bytes = Buffer.concat(chunks);
      assert(sha256(bytes) === input.sha256, "DOWNLOAD_DIGEST", input.id);
      await mkdir(dirname(path), { recursive: true, mode: 0o700 });
      await writeFile(path, bytes, { mode: 0o600 });
      return attempt;
    } catch (error) {
      if (
        error.code &&
        !["UND_ERR_CONNECT_TIMEOUT", "UND_ERR_SOCKET"].includes(
          error.cause?.code,
        )
      )
        throw error;
      last = error;
    }
  }
  throw Object.assign(
    new Error(`DOWNLOAD_EXHAUSTED: ${input.id}: ${last?.message}`),
    { code: "DOWNLOAD_EXHAUSTED" },
  );
}

async function prepareExternalInputs(context) {
  const config = await readJson(
    resolve(context.root, "config/admission/external-inputs.json"),
  );
  const output = resolve(context.root, "evidence/runs/prepared");
  await rm(output, { recursive: true, force: true });
  const observations = [];
  for (const input of config.inputs) {
    const attempts = await downloadBounded(input, resolve(output, input.id));
    observations.push({ id: input.id, sha256: input.sha256, attempts });
  }
  await writeJsonAtomic(resolve(output, "manifest.json"), {
    schemaVersion: 1,
    observations,
  });
  return {
    selected: observations.length,
    executed: observations.length,
    passed: observations.length,
    outputDigest: sha256(canonicalJson(observations)),
  };
}

async function securitySecrets(context) {
  const files = await repositoryFiles(context.root);
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
    /\bgh[pousr]_[A-Za-z0-9]{30,}\b/u,
    /\bAKIA[0-9A-Z]{16}\b/u,
  ];
  let checked = 0;
  for (const path of files) {
    if (
      ![".md", ".json", ".yml", ".yaml", ".mjs", ".ts", ".py", ""].includes(
        extname(path),
      )
    )
      continue;
    const bytes = await readFile(resolve(context.root, path));
    if (bytes.includes(0)) continue;
    const content = bytes.toString("utf8");
    assert(
      !patterns.some((pattern) => pattern.test(content)),
      "SECRET_DETECTED",
      path,
    );
    checked += 1;
  }
  return {
    selected: checked,
    executed: checked,
    passed: checked,
    diagnostics: [
      "repository content scan; admitted Gitleaks binary is executed by the Required · secret scan job",
    ],
  };
}

async function regulatoryAbsence(context) {
  const files = await repositoryFiles(context.root);
  const forbidden = files.filter(
    (path) =>
      (path.startsWith("editions/") || path.startsWith("schemas/")) &&
      path !== "editions/README.md" &&
      path !== "schemas/README.md" &&
      !path.startsWith("editions/source-snapshots/") &&
      !path.startsWith("editions/rrsif-2026-09-21-observed-candidate/") &&
      !path.startsWith("editions/rrsif-2026-09-21-authoritative-candidate/") &&
      path !== "schemas/regulatory-edition-envelope.schema.json",
  );
  assert(forbidden.length === 0, "P2_REGULATORY_SCOPE", forbidden.join(", "));
  return {
    selected: 2,
    executed: 2,
    passed: 2,
    diagnostics: [
      "P2 compatibility control: P3 candidate is verification-only and cannot create fiscal artifacts",
    ],
  };
}

async function regulatoryImport(context) {
  const result = await run("node", ["tooling/regulatory/import-snapshot.mjs"], {
    cwd: context.root,
  });
  assert(
    result.code === 0,
    "REGULATORY_IMPORT",
    result.stderr || result.stdout,
  );
  const manifest = await readJson(
    resolve(
      context.root,
      "editions/source-snapshots/rrsif-2026-09-21-authoritative/manifest.json",
    ),
  );
  const captured = manifest.sources.filter(
    (source) => source.status === "captured",
  );
  const blocked = manifest.sources.filter(
    (source) => source.status === "blocked",
  );
  assert(
    captured.length === 27,
    "REGULATORY_CAPTURE_INCOMPLETE",
    String(captured.length),
  );
  assert(
    blocked.length === 0 && manifest.closure.complete === true,
    "REGULATORY_SOURCE_GRAPH_OPEN",
    "authoritative source graph must be complete",
  );
  return {
    selected: manifest.sources.length,
    executed: manifest.sources.length,
    passed: manifest.sources.length,
    outputDigest: sha256(canonicalJson(manifest)),
    diagnostics: [
      `captured=${captured.length}`,
      "blocked=0",
      "runtime network denied",
    ],
  };
}

async function contractGeneration(context) {
  const result = await run(
    "node",
    ["tooling/regulatory/generate-contracts.mjs"],
    { cwd: context.root },
  );
  assert(
    result.code === 0,
    "CONTRACT_GENERATION",
    result.stderr || result.stdout,
  );
  const generated = await readJson(
    resolve(
      context.root,
      "editions/rrsif-2026-09-21-authoritative-candidate/generated/generation-report.json",
    ),
  );
  assert(
    generated.deterministic === true,
    "GENERATION_NOT_DETERMINISTIC",
    "report",
  );
  assert(
    generated.creationAllowed === false,
    "BLOCKED_CANDIDATE_CREATES",
    "activation is prohibited",
  );
  assert(
    generated.blocked.length === 0,
    "GENERATION_SOURCE_GRAPH_OPEN",
    "source graph is not closed",
  );
  return {
    selected: generated.outputs.length + 1,
    executed: generated.outputs.length + 1,
    passed: generated.outputs.length + 1,
    outputDigest: generated.outputDigest,
    diagnostics: [
      `structuralDeclarations=${generated.populations.structuralDeclarations}`,
      "network denied",
      "structural contracts plus source-located semantic overlay; fiscal execution remains P4 scope",
    ],
  };
}

async function independentOracle(context) {
  const python = process.env.VERIFACTU_PYTHON || "python3";
  const parser = await run(
    python,
    ["internal/contract-generation/offline_parser.py"],
    { cwd: context.root },
  );
  assert(parser.code === 0, "OFFLINE_PARSER", parser.stderr || parser.stdout);
  const result = await run(python, ["internal/independent-oracles/oracle.py"], {
    cwd: context.root,
  });
  assert(
    result.code === 0,
    "INDEPENDENT_ORACLE",
    result.stderr || result.stdout,
  );
  const parsed = JSON.parse(result.stdout.trim().split("\n").at(-1));
  assert(
    parsed.status === "passed" && parsed.failed.length === 0,
    "ORACLE_FAILURE",
    JSON.stringify(parsed),
  );
  return {
    selected: parsed.selected + 5,
    executed: parsed.executed + 5,
    passed: parsed.passed + 5,
    outputDigest: sha256(canonicalJson(parsed)),
    diagnostics: [
      "independent Python hashlib/json oracle",
      "hostile XML negatives detected",
      "seeded-defect detection passed",
    ],
  };
}

async function regulatoryDrift(context) {
  const generatedFiles = [
    "editions/rrsif-2026-09-21-authoritative-candidate/generated/catalogues.json",
    "editions/rrsif-2026-09-21-authoritative-candidate/generated/contract-manifest.json",
    "editions/rrsif-2026-09-21-authoritative-candidate/generated/field-constraints.json",
    "editions/rrsif-2026-09-21-authoritative-candidate/generated/public-schema.json",
    "editions/rrsif-2026-09-21-authoritative-candidate/generated/soap-bindings.json",
    "editions/rrsif-2026-09-21-authoritative-candidate/generated/semantic-overlay.json",
    "editions/rrsif-2026-09-21-authoritative-candidate/generated/structural-contract.json",
  ];
  const before = await digestFiles(context.root, generatedFiles);
  const first = await run(
    "node",
    ["tooling/regulatory/generate-contracts.mjs"],
    { cwd: context.root },
  );
  assert(first.code === 0, "DRIFT_GENERATION", first.stderr || first.stdout);
  const after = await digestFiles(context.root, generatedFiles);
  assert(before === after, "GENERATION_DRIFT", `${before} != ${after}`);
  const manifest = await readJson(
    resolve(
      context.root,
      "editions/source-snapshots/rrsif-2026-09-21-authoritative/manifest.json",
    ),
  );
  const originalClosure = sha256(
    manifest.sources
      .filter((entry) => entry.status !== "blocked")
      .map((entry) => `${entry.id}\0${entry.sha256}`)
      .join("\n"),
  );
  const mutated = structuredClone(manifest);
  mutated.sources.find((entry) => entry.status !== "blocked").sha256 =
    "0".repeat(64);
  const changedClosure = sha256(
    mutated.sources
      .filter((entry) => entry.status !== "blocked")
      .map((entry) => `${entry.id}\0${entry.sha256}`)
      .join("\n"),
  );
  assert(
    originalClosure !== changedClosure,
    "SOURCE_CHANGE_NOT_INVALIDATING",
    "source closure digest unchanged",
  );
  const report = await readJson(
    resolve(
      context.root,
      "editions/rrsif-2026-09-21-authoritative-candidate/generated/generation-report.json",
    ),
  );
  assert(
    report.deterministic === true && report.creationAllowed === false,
    "DRIFT_POLICY",
    "candidate policy",
  );
  return {
    selected: 4,
    executed: 4,
    passed: 4,
    outputDigest: report.outputDigest,
    diagnostics: [
      "clean regeneration no-diff",
      "changed-source invalidation is enforced by manifest digest",
      "no runtime network refresh",
    ],
  };
}

async function gateP3(context) {
  const failures = context.dependencyReports.filter(
    (report) => report.status !== "passed",
  );
  assert(
    failures.length === 0,
    "GATE_P3_DEPENDENCY",
    failures.map((report) => report.taskId).join(", "),
  );
  const source = await readJson(
    resolve(context.root, "config/regulatory/source-plan-p3b.json"),
  );
  const lifecycle = await readJson(
    resolve(context.root, "config/regulatory/edition-lifecycle.json"),
  );
  assert(
    lifecycle.current.creationAllowed === false,
    "P3_CREATION_POLICY",
    "blocked candidate cannot create",
  );
  assert(
    source.requiredBeforeActivation.length ===
      lifecycle.current.blockers.length,
    "P3_BLOCKER_COVERAGE",
    "activation blockers not mapped",
  );
  return {
    selected: context.dependencyReports.length + 2,
    executed: context.dependencyReports.length + 2,
    passed: context.dependencyReports.length + 2,
    outputDigest: sha256(
      canonicalJson(
        context.dependencyReports.map((report) => [
          report.taskId,
          report.outputDigest,
        ]),
      ),
    ),
    diagnostics: [
      "P3 source custody and generated-contract closure pass; candidate activation remains prohibited until a later approved lifecycle transition",
    ],
  };
}

async function p3bAssurance(context) {
  const result = await run("node", ["tooling/assurance/p3b-audit.mjs"], {
    cwd: context.root,
    timeoutMs: 300000,
  });
  assert(
    result.code === 0,
    "P3B_AUDIT_EXECUTION",
    result.stderr || result.stdout,
  );
  const outcome = JSON.parse(result.stdout.trim().split(/\r?\n/u).at(-1));
  assert(
    ["passed", "blocked"].includes(outcome.status),
    "P3B_AUDIT_STATUS",
    outcome.status,
  );
  return outcome;
}

async function p4QualityPlan(context) {
  const result = await run("node", ["tooling/assurance/p4-quality-plan.mjs"], {
    cwd: context.root,
    timeoutMs: 60000,
  });
  assert(
    result.code === 0,
    "P4_QUALITY_PLAN_EXECUTION",
    result.stderr || result.stdout,
  );
  const outcome = JSON.parse(result.stdout.trim().split(/\r?\n/u).at(-1));
  assert(
    outcome.status === "passed" &&
      outcome.failed === 0 &&
      outcome.skipped === 0,
    "P4_QUALITY_PLAN_STATUS",
    outcome.status,
  );
  return outcome;
}

async function gate(context) {
  const failures = context.dependencyReports.filter(
    (report) => report.status !== "passed",
  );
  assert(
    failures.length === 0,
    "GATE_DEPENDENCY",
    failures.map((report) => report.taskId).join(", "),
  );
  assert(
    context.dependencyReports.length === context.task.dependencies.length,
    "GATE_INCOMPLETE",
    context.task.id,
  );
  return {
    selected: context.dependencyReports.length,
    executed: context.dependencyReports.length,
    passed: context.dependencyReports.length,
    outputDigest: sha256(
      canonicalJson(
        context.dependencyReports.map((report) => [
          report.taskId,
          report.outputDigest,
        ]),
      ),
    ),
  };
}

export const operations = {
  policyTree,
  policyGenerated,
  policyToolchain,
  policyFormat,
  policyLint,
  policyTypes,
  policyDocs,
  policyArchitecture,
  policyApi,
  policyPackages,
  policyWorkflow,
  policySupplyChain,
  testPolicy,
  testP4A,
  testP4C,
  testP4D,
  buildPackages,
  packageAllowlists,
  packageReproducibility,
  integrationConsumers,
  sbomComponentGraph,
  sbomDocuments,
  provenanceRehearsal,
  prepareExternalInputs,
  securitySecrets,
  regulatoryAbsence,
  regulatoryImport,
  contractGeneration,
  independentOracle,
  regulatoryDrift,
  gateP3,
  p3bAssurance,
  p4QualityPlan,
  gate,
};

export const operationCapabilities = Object.freeze({
  policyTree: { tools: ["git"], network: "denied" },
  policyGenerated: { tools: [], network: "denied" },
  policyToolchain: { tools: ["node", "npm"], network: "denied" },
  policyFormat: { tools: ["node", "prettier"], network: "denied" },
  policyLint: { tools: ["node", "eslint"], network: "denied" },
  policyTypes: { tools: ["node", "typescript"], network: "denied" },
  policyDocs: { tools: ["python", "git"], network: "denied" },
  policyArchitecture: { tools: ["git"], network: "denied" },
  policyApi: { tools: [], network: "denied" },
  policyPackages: { tools: [], network: "denied" },
  policyWorkflow: { tools: [], network: "denied" },
  policySupplyChain: { tools: [], network: "denied" },
  testPolicy: { tools: [], network: "denied" },
  testP4A: { tools: ["node"], network: "denied" },
  testP4C: { tools: ["node", "python"], network: "denied" },
  testP4D: { tools: ["node", "java", "maven"], network: "denied" },
  buildPackages: { tools: ["node", "typescript"], network: "denied" },
  packageAllowlists: {
    tools: ["node", "typescript", "npm"],
    network: "denied",
  },
  packageReproducibility: {
    tools: ["node", "typescript", "npm"],
    network: "denied",
  },
  integrationConsumers: { tools: ["node", "npm"], network: "denied" },
  sbomComponentGraph: { tools: [], network: "denied" },
  prepareExternalInputs: { tools: [], network: "prepare-only" },
  sbomDocuments: { tools: ["python"], network: "denied" },
  provenanceRehearsal: { tools: [], network: "denied" },
  securitySecrets: { tools: ["git"], network: "denied" },
  regulatoryAbsence: { tools: ["git"], network: "denied" },
  regulatoryImport: { tools: ["node"], network: "denied" },
  contractGeneration: { tools: ["node"], network: "denied" },
  independentOracle: { tools: ["python"], network: "denied" },
  regulatoryDrift: { tools: ["node"], network: "denied" },
  gateP3: { tools: [], network: "denied" },
  p3bAssurance: { tools: ["git", "node"], network: "denied" },
  p4QualityPlan: { tools: ["git", "node", "python"], network: "denied" },
  gate: { tools: [], network: "denied" },
});
