import {
  appendFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { clearTimeout } from "node:timers";

const execPath = process.execPath;

function runMutationTest(executable, args, options) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(executable, args, {
      cwd: options.cwd,
      env: options.env,
      windowsHide: true,
      detached: process.platform !== "win32",
      stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let timedOut = false;
    let outputExceeded = false;
    const maxBuffer = options.maxBuffer ?? 16 * 1024 * 1024;
    const kill = () => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      if (process.platform === "win32") {
        child.kill("SIGTERM");
        const killer = spawn(
          "taskkill.exe",
          ["/pid", String(child.pid), "/t", "/f"],
          { windowsHide: true, stdio: "ignore" },
        );
        killer.unref();
      } else {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          child.kill("SIGKILL");
        }
      }
    };
    const timer = setTimeout(() => {
      timedOut = true;
      kill();
    }, options.timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > maxBuffer) {
        outputExceeded = true;
        kill();
      } else stdout.push(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderrBytes += chunk.length;
      if (stderrBytes > maxBuffer) {
        outputExceeded = true;
        kill();
      } else stderr.push(chunk);
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      rejectRun(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      resolveRun({
        code: Number.isInteger(code) ? code : 1,
        signal,
        timedOut,
        outputExceeded,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
    if (options.input !== undefined) child.stdin.end(options.input);
  });
}

function tapFailureEvidence(stdout, test) {
  const lines = stdout.split("\n");
  const index = lines.findIndex((line) => /^\s*not ok \d+ /u.test(line));
  if (index < 0) return [];
  const end = lines.findIndex(
    (line, candidate) =>
      candidate > index && /^\s*(?:ok|not ok) \d+ /u.test(line),
  );
  const block = lines
    .slice(index, end < 0 ? index + 24 : end)
    .join("\n")
    .trim();
  return [`${test}: ${block.slice(0, 2400)}`];
}

const BASE64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeVlq(input) {
  const values = [];
  let accumulator = 0;
  let shift = 0;
  for (const character of input) {
    const digit = BASE64.indexOf(character);
    if (digit < 0) throw new Error(`P4_SOURCE_MAP_VLQ: ${character}`);
    accumulator |= (digit & 31) << shift;
    if (digit & 32) {
      shift += 5;
      continue;
    }
    const negative = (accumulator & 1) === 1;
    const magnitude = accumulator >>> 1;
    values.push(negative ? -magnitude : magnitude);
    accumulator = 0;
    shift = 0;
  }
  if (shift !== 0) throw new Error("P4_SOURCE_MAP_VLQ_TRUNCATED");
  return values;
}

function mappingsForSourceMap(sourceMap, mapUrl, sourcePath) {
  const rootUrl = sourceMap.sourceRoot
    ? new URL(
        sourceMap.sourceRoot.endsWith("/")
          ? sourceMap.sourceRoot
          : `${sourceMap.sourceRoot}/`,
        mapUrl,
      )
    : mapUrl;
  const sourceUrls = sourceMap.sources.map(
    (source) => new URL(source, rootUrl).href,
  );
  const sourceUrl = pathToFileURL(sourcePath).href;
  const targetIndexes = new Set(
    sourceUrls.flatMap((value, index) => (value === sourceUrl ? [index] : [])),
  );
  const mappings = [];
  let sourceIndex = 0;
  let originalLine = 0;
  let originalColumn = 0;
  const generatedLines = sourceMap.mappings.split(";");
  for (
    let generatedLine = 0;
    generatedLine < generatedLines.length;
    generatedLine += 1
  ) {
    let generatedColumn = 0;
    for (const encoded of generatedLines[generatedLine].split(",")) {
      if (!encoded) continue;
      const values = decodeVlq(encoded);
      generatedColumn += values[0];
      if (values.length === 1) continue;
      if (values.length !== 4 && values.length !== 5)
        throw new Error(`P4_SOURCE_MAP_SEGMENT_WIDTH: ${values.length}`);
      sourceIndex += values[1];
      originalLine += values[2];
      originalColumn += values[3];
      if (targetIndexes.has(sourceIndex))
        mappings.push({
          generatedLine,
          generatedColumn,
          originalLine,
          originalColumn,
        });
    }
  }
  return mappings;
}

function lineAndColumn(source, offset) {
  const prefix = source.slice(0, offset);
  const line = prefix.split("\n").length - 1;
  return {
    line,
    column: prefix.length - prefix.lastIndexOf("\n") - 1,
  };
}

function generatedOffset(runtimeSource, generatedLine, generatedColumn) {
  let offset = 0;
  for (let line = 0; line < generatedLine; line += 1) {
    const newline = runtimeSource.indexOf("\n", offset);
    if (newline < 0) throw new Error("P4_SOURCE_MAP_GENERATED_LINE");
    offset = newline + 1;
  }
  return offset + generatedColumn;
}

async function runtimeLocation(root, mutation, cache = new Map()) {
  const productionPath = resolve(root, mutation.module);
  const productionSource = await readFile(productionPath, "utf8");
  if (!mutation.module.endsWith(".ts"))
    return {
      runtimePath: productionPath,
      runtimeUrl: pathToFileURL(productionPath).href,
      offset: mutation.start,
    };

  let moduleData = cache.get(mutation.module);
  if (!moduleData) {
    const packageRoot = resolve(root, "packages/verifactu");
    const sourceRelative = relative(
      resolve(packageRoot, "src"),
      productionPath,
    );
    if (sourceRelative.startsWith(`..${sep}`) || sourceRelative === "..")
      throw new Error(
        `P4_TYPESCRIPT_SOURCE_OUTSIDE_PACKAGE: ${mutation.module}`,
      );
    const runtimePath = resolve(
      root,
      "evidence/runs/artifacts/build/verifactu/dist",
      sourceRelative.replace(/\.ts$/u, ".js"),
    );
    const mapPath = `${runtimePath}.map`;
    const runtimeSource = await readFile(runtimePath, "utf8");
    const sourceMap = JSON.parse(await readFile(mapPath, "utf8"));
    const mapUrl = pathToFileURL(mapPath).href;
    moduleData = {
      runtimePath,
      runtimeUrl: pathToFileURL(runtimePath).href,
      runtimeSource,
      mappings: mappingsForSourceMap(sourceMap, mapUrl, productionPath),
    };
    cache.set(mutation.module, moduleData);
  }
  const { runtimePath, runtimeSource, mappings } = moduleData;
  const { line, column } = lineAndColumn(productionSource, mutation.start);
  const nearestMappings = mappings.filter(
    (entry) => entry.originalLine === line && entry.originalColumn <= column,
  );
  const nearest = nearestMappings.reduce(
    (best, entry) =>
      best === undefined ||
      entry.originalColumn > best.originalColumn ||
      (entry.originalColumn === best.originalColumn &&
        entry.generatedColumn > best.generatedColumn)
        ? entry
        : best,
    undefined,
  );
  if (!nearest)
    throw new Error(`P4_SOURCE_MAP_MUTATION_UNMAPPED: ${mutation.id}`);
  return {
    runtimePath,
    runtimeUrl: pathToFileURL(runtimePath).href,
    offset: generatedOffset(
      runtimeSource,
      nearest.generatedLine,
      nearest.generatedColumn,
    ),
  };
}

function executionCountAt(functions, offset) {
  const containing = functions
    .flatMap((fn) => fn.ranges)
    .filter((range) => range.startOffset <= offset && offset < range.endOffset);
  if (containing.length === 0) return 0;
  const smallestRange = Math.min(
    ...containing.map((range) => range.endOffset - range.startOffset),
  );
  return containing.some(
    (range) =>
      range.endOffset - range.startOffset === smallestRange && range.count > 0,
  )
    ? 1
    : 0;
}

function testPathFromCoverage(root, plan, coverage) {
  const allowed = new Set(plan.testFiles);
  const found = new Set();
  for (const script of coverage.result) {
    if (!script.url.startsWith("file:")) continue;
    const path = fileURLToPath(script.url);
    const relativePath = relative(root, path).split(sep).join("/");
    if (allowed.has(relativePath)) found.add(relativePath);
  }
  if (found.size > 1)
    throw new Error(
      `P4_COVERAGE_TEST_AMBIGUOUS: ${[...found].sort().join(",")}`,
    );
  return [...found][0];
}

function preferredTestPaths(mutation, plan) {
  const rules = [
    [
      /\/domain\/(?:identities|decimal|date-time|context)\.ts$/u,
      ["tests/unit/p4-values-identities.test.mjs"],
    ],
    [
      /\/domain\/(?:records|corrections)\.ts$/u,
      ["tests/unit/p4-records-corrections.test.mjs"],
    ],
    [
      /\/domain\/(?:mode-tenure|events|states)\.ts$/u,
      ["tests/unit/p4-modes-events-states.test.mjs"],
    ],
    [
      /\/domain\/(?:sequences|chains)\.ts$/u,
      ["tests/unit/p4-sequences-chains.test.mjs"],
    ],
    [
      /\/contracts\/(?:staged-codec|results|limits|configuration)\.ts$/u,
      ["tests/unit/p4-codecs.test.mjs"],
    ],
    [
      /\/application\/(?:operation-plan|record-planner|official-projection|official-serialization|fingerprint|xml-artifacts)\.ts$/u,
      ["tests/unit/p4-plans-artifacts.test.mjs"],
    ],
    [/\/application\/qr\.ts$/u, ["tests/integration/p4-qr-roundtrip.test.mjs"]],
    [/\/verification\/claims\.ts$/u, ["tests/unit/p4-claims.test.mjs"]],
    [
      /\/verification\/(?:engine-profile|engine-adapter)\.ts$/u,
      ["tests/contract/p4-engine-adapter.test.mjs"],
    ],
    [/\/editions\//u, ["tests/contract/p4-edition-contract.test.mjs"]],
    [/\/ports\/xml-xsd\.ts$/u, ["tests/unit/p4-xml-model.test.mjs"]],
    [
      /^internal\/xml-provider\//u,
      ["tests/contract/p4-xml-xsd-provider.test.mjs"],
    ],
    [
      /^internal\/xades-provider\//u,
      ["tests/contract/p4-xades-provider.test.mjs"],
    ],
    [
      /^internal\/independent-oracles\//u,
      ["tests/integration/p4-engine-tarball.test.mjs"],
    ],
  ];
  const direct =
    rules.find(([pattern]) => pattern.test(mutation.module))?.[1] ?? [];
  const criticalEntries = plan.criticalCatalogue.filter(
    (entry) => entry.path === mutation.module,
  );
  const critical = criticalEntries.map((entry) => entry.test);
  if (critical.length > 0) {
    const rank = (test) =>
      test.startsWith("tests/unit/")
        ? 0
        : test.startsWith("tests/contract/")
          ? 1
          : test.startsWith("tests/security/")
            ? 2
            : test.startsWith("tests/integration/")
              ? 3
              : 4;
    const mutationIds = [
      ...new Set(criticalEntries.map((entry) => entry.mutant)),
    ]
      .filter((id) => /^P4-MUT-\d{3}$/u.test(id))
      .sort();
    const controlTest =
      mutationIds.length > 0
        ? `tests/mutation/p4-mutation.test.mjs [--test-name-pattern=^(?:${mutationIds.join("|")})]`
        : undefined;
    return [
      ...new Set([
        ...critical,
        ...direct,
        ...(controlTest ? [controlTest] : []),
      ]),
    ].sort(
      (left, right) => rank(left) - rank(right) || left.localeCompare(right),
    );
  }
  return direct;
}

function orderMutationTests(mutation, tests, plan) {
  const preferred = preferredTestPaths(mutation, plan);
  if (mutation.module === "packages/verifactu/src/application/qr.ts") {
    const candidates = new Set(tests);
    const criticalTests = preferred.filter((test) =>
      test.startsWith(
        "tests/mutation/p4-mutation.test.mjs [--test-name-pattern=",
      ),
    );
    const contract = "tests/contract/p4-qr-provider.test.mjs";
    const integration = "tests/integration/p4-qr-roundtrip.test.mjs";
    return [
      ...[contract, integration].filter((test) => candidates.has(test)),
      ...criticalTests,
    ];
  }
  const focusedProviderTest = focusedProviderMutationTest(mutation);
  if (focusedProviderTest) {
    const criticalTests = preferred.filter((test) =>
      test.startsWith(
        "tests/mutation/p4-mutation.test.mjs [--test-name-pattern=",
      ),
    );
    return [...new Set([focusedProviderTest, ...criticalTests])];
  }
  const rank = (test) =>
    test.startsWith("tests/unit/")
      ? 0
      : test.startsWith("tests/contract/")
        ? 1
        : test.startsWith("tests/integration/")
          ? 2
          : test.startsWith("tests/security/")
            ? 3
            : test.startsWith("tests/property/")
              ? 4
              : test.startsWith("tests/mutation/")
                ? 6
                : 5;
  const targetedMutationTests = preferred.filter((test) =>
    test.startsWith(
      "tests/mutation/p4-mutation.test.mjs [--test-name-pattern=",
    ),
  );
  const direct = preferred.filter(
    (test) => !targetedMutationTests.includes(test),
  );
  const mapped = tests.filter(
    (test) =>
      !test.startsWith(
        "tests/mutation/p4-mutation.test.mjs [--test-name-pattern=",
      ),
  );
  const selected = [
    ...new Set([...direct, ...mapped, ...targetedMutationTests]),
  ].sort(
    (left, right) => rank(left) - rank(right) || left.localeCompare(right),
  );
  if (selected.length > 0) return selected;
  return [...tests]
    .sort(
      (left, right) => rank(left) - rank(right) || left.localeCompare(right),
    )
    .slice(0, 1);
}

function selectedTest(path, pattern) {
  return `${path} [--test-name-pattern=${pattern}]`;
}

export function focusedProviderMutationTest(mutation) {
  const { module, line } = mutation;
  if (module === "internal/xades-provider/provider.mjs" && line === 618)
    return selectedTest(
      "tests/contract/p4-xades-provider.test.mjs",
      "^deadline settlement ignores a timer callback after completion$",
    );
  if (module === "internal/xades-provider/provider.mjs" && line === 620)
    return selectedTest(
      "tests/contract/p4-xades-provider.test.mjs",
      "^deadline settlement ignores a timer callback after completion$",
    );
  if (module === "internal/xades-provider/provider.mjs" && line === 621)
    return selectedTest(
      "tests/contract/p4-xades-provider.test.mjs",
      "^signer callback receives only the exact remaining operation budget$",
    );
  if (module === "internal/xades-provider/provider.mjs" && line === 631)
    return selectedTest(
      "tests/contract/p4-xades-provider.test.mjs",
      "^deadline settlement ignores a timer callback after completion$",
    );
  if (module === "internal/xades-provider/provider.mjs" && line === 625)
    return selectedTest(
      "tests/contract/p4-xades-provider.test.mjs",
      "^XAdES bridge timeout uses the exact monotonic time remaining$",
    );
  if (
    module === "internal/xades-provider/provider.mjs" &&
    line >= 660 &&
    line < 666
  )
    return selectedTest(
      "tests/contract/p4-xades-provider.test.mjs",
      "^XAdES bridge timeout uses the exact monotonic time remaining$",
    );
  if (
    module === "internal/xades-provider/provider.mjs" &&
    line >= 624 &&
    line < 640
  )
    return selectedTest(
      "tests/contract/p4-xades-provider.test.mjs",
      "^opaque signer callback cannot hold the provider past its explicit deadline$",
    );
  if (module === "internal/xades-provider/provider.mjs")
    return "tests/contract/p4-xades-provider.test.mjs";
  if (module === "internal/xml-provider/provider.mjs")
    return "tests/contract/p4-xml-xsd-provider.test.mjs";
  if (
    module === "internal/xml-provider/worker.mjs" &&
    line >= 368 &&
    line < 380
  )
    return selectedTest(
      "tests/security/p4-xml-attacks.test.mjs",
      "^XML worker normalizes child spawn errors and post-spawn cancellation$",
    );
  if (module === "internal/xml-provider/worker.mjs")
    return "tests/security/p4-xml-attacks.test.mjs";
  if (module === "packages/verifactu/src/verification/engine-adapter.ts")
    return selectedTest(
      "tests/contract/p4-engine-adapter.test.mjs",
      "^engine evidence rejects null shaped record and chain summaries$",
    );
  if (module === "internal/xades-provider/pki.mjs")
    return line < 54
      ? selectedTest(
          "tests/integration/p4-xades-pki.test.mjs",
          "^certificate policy keeps chain, trust, time, use, identity and authorization distinct$",
        )
      : selectedTest(
          "tests/integration/p4-xades-pki.test.mjs",
          "^(?:revoked is terminal and unknown, absent and malformed never become valid|PKI observation requires evidence and a fresh caller-time interval)$",
        );
  if (module === "internal/xades-provider/worker.mjs") {
    if (line === 254)
      return selectedTest(
        "tests/security/p4-resource-attacks.test.mjs",
        "^DSS request encoder accepts exactly its declared byte limit$",
      );
    if (line < 175)
      return selectedTest(
        "tests/security/p4-resource-attacks.test.mjs",
        "^DSS worker rejects oversized requests, output, diagnostics and failed process outcomes$",
      );
    if (line < 257)
      return selectedTest(
        "tests/security/p4-resource-attacks.test.mjs",
        "^(?:bridge encoder rejects unknown commands and malformed evidence lists|bridge encoder serializes a bounded request using strict base64 lines)$",
      );
    if (line < 298)
      return selectedTest(
        "tests/security/p4-resource-attacks.test.mjs",
        "^DSS response decoder rejects malformed framing and validates every field$",
      );
    if (line < 317)
      return selectedTest(
        "tests/security/p4-resource-attacks.test.mjs",
        "^bridge child environment excludes unrelated parent secrets$",
      );
  }
  return undefined;
}

export function mutationCompileFailed(transcript, loaded) {
  return !loaded || /P4_MUTATION_TYPESCRIPT(?:_CONFIG|_EMIT)/u.test(transcript);
}

export async function discoverNodeMutationTests(root, plan, v8Root, mutations) {
  const files = (await readdir(v8Root)).filter((path) =>
    path.endsWith(".json"),
  );
  const moduleData = new Map();
  const locationsById = new Map();
  for (const mutation of mutations) {
    if (!/\.(?:ts|mjs)$/u.test(mutation.module)) continue;
    const location = await runtimeLocation(root, mutation, moduleData);
    locationsById.set(mutation.id, location);
  }
  const candidatesByRuntime = new Map();
  const testsById = new Map();
  for (const mutation of mutations) {
    if (!/\.(?:ts|mjs)$/u.test(mutation.module)) continue;
    const location = locationsById.get(mutation.id);
    const candidates = candidatesByRuntime.get(location.runtimeUrl) ?? [];
    candidates.push({ mutation, offset: location.offset });
    candidatesByRuntime.set(location.runtimeUrl, candidates);
    testsById.set(mutation.id, new Set());
  }
  // Coverage emits one file per test process. Process one file at a time so
  // the 903-file P4 run does not retain several gigabytes of V8 ranges.
  for (const file of files) {
    const coverage = JSON.parse(await readFile(resolve(v8Root, file), "utf8"));
    const test = testPathFromCoverage(root, plan, coverage);
    if (!test) continue;
    for (const script of coverage.result) {
      const candidates = candidatesByRuntime.get(script.url);
      if (!candidates) continue;
      for (const { mutation, offset } of candidates)
        if (executionCountAt(script.functions, offset) > 0)
          testsById.get(mutation.id).add(test);
    }
  }
  return mutations
    .filter((mutation) => /\.(?:ts|mjs)$/u.test(mutation.module))
    .map((mutation) => {
      const location = locationsById.get(mutation.id);
      return {
        ...mutation,
        runtimeModule: relative(root, location.runtimePath)
          .split(sep)
          .join("/"),
        runtimeOffset: location.offset,
        baselineCovered: testsById.get(mutation.id).size > 0,
        tests: orderMutationTests(
          mutation,
          [...testsById.get(mutation.id)],
          plan,
        ),
      };
    });
}

export async function executeNodeMutation(root, mutation, options = {}) {
  if (mutation.tests.length === 0)
    return {
      ...mutation,
      compile: "passed",
      covered: false,
      outcome: "noCoverage",
    };
  const temporary = await mkdtemp(resolve(tmpdir(), "verifactu-p4-om-"));
  const configPath = resolve(temporary, "mutation.json");
  const config = {
    root,
    module: mutation.module,
    runtimeModule: mutation.runtimeModule,
    mutation,
  };
  try {
    await writeFile(configPath, `${JSON.stringify(config)}\n`);
    const loader = resolve(root, "tooling/assurance/p4-mutation-loader.mjs");
    const tests = [];
    const fullyExecuted = new Set();
    const runSelection = async (test, pattern, timeoutMs) => {
      const args = [
        "--import",
        pathToFileURL(loader).href,
        "--test",
        "--test-concurrency=1",
        "--test-reporter=tap",
      ];
      if (pattern) args.push(`--test-name-pattern=${pattern}`);
      args.push(test);
      const result = await runMutationTest(execPath, args, {
        cwd: root,
        env: {
          ...process.env,
          VERIFACTU_P4_MUTATION_CONFIG: configPath,
        },
        timeoutMs,
        maxBuffer: 16 * 1024 * 1024,
      });
      const transcript = `${result.stdout}\n${result.stderr}`;
      return {
        result,
        transcript,
        loaded: transcript.includes(`P4_MUTATION_ACTIVE:${mutation.id}:`),
        failedRows: result.stdout
          .split("\n")
          .filter((line) => /^\s*not ok \d+ /u.test(line)),
        timedOut: result.timedOut === true || /ETIMEDOUT/iu.test(transcript),
        compileFailure: mutationCompileFailed(
          transcript,
          transcript.includes(`P4_MUTATION_ACTIVE:${mutation.id}:`),
        ),
      };
    };
    for (const requestedTest of mutation.tests) {
      const encodedSelection = /^(.*) \[--test-name-pattern=(.*)\]$/u.exec(
        requestedTest,
      );
      const test = encodedSelection?.[1] ?? requestedTest;
      const requestedPattern = encodedSelection?.[2];
      const patterns = mutationTestPatterns(mutation, test, {
        requestedPattern,
        timeoutMs: options.timeoutMs,
        qrPropertyTimeoutMs: options.qrPropertyTimeoutMs,
      });
      for (const { pattern, timeoutMs } of patterns) {
        const selection = pattern
          ? `${test} [--test-name-pattern=${pattern}]`
          : test;
        tests.push(selection);
        const {
          result,
          transcript,
          loaded,
          failedRows,
          timedOut,
          compileFailure,
        } = await runSelection(test, pattern, timeoutMs);
        if (!pattern) fullyExecuted.add(test);
        if (
          timedOut ||
          result.outputExceeded ||
          compileFailure ||
          (result.code !== 0 && failedRows.length === 0)
        ) {
          const outcome = timedOut
            ? "timeout"
            : compileFailure
              ? "compileError"
              : "testError";
          return {
            ...mutation,
            compile: compileFailure ? "failed" : "passed",
            covered: loaded,
            outcome,
            killEvidence: [],
            tests,
            diagnostics: [
              transcript.trim().slice(0, 4000) ||
                `P4_MUTATION_EXECUTION: ${selection} timed out or failed before loading ${mutation.id}`,
            ],
          };
        }
        if (failedRows.length > 0)
          return {
            ...mutation,
            compile: "passed",
            covered: true,
            outcome: "killed",
            killEvidence: tapFailureEvidence(result.stdout, test),
            tests,
            diagnostics: [],
          };
      }
    }
    // A line-focused selector is a fast first pass, not the final word on a
    // survivor. Run each covered file in full before recording survival so a
    // narrower test-name pattern cannot hide an existing behavioral oracle.
    for (const requestedTest of mutation.tests) {
      const encodedSelection = /^(.*) \[--test-name-pattern=(.*)\]$/u.exec(
        requestedTest,
      );
      const test = encodedSelection?.[1] ?? requestedTest;
      if (fullyExecuted.has(test)) continue;
      fullyExecuted.add(test);
      tests.push(test);
      const {
        result,
        transcript,
        loaded,
        failedRows,
        timedOut,
        compileFailure,
      } = await runSelection(
        test,
        undefined,
        options.fullTestTimeoutMs ?? 300_000,
      );
      if (
        timedOut ||
        result.outputExceeded ||
        compileFailure ||
        (result.code !== 0 && failedRows.length === 0)
      ) {
        const outcome = timedOut
          ? "timeout"
          : compileFailure
            ? "compileError"
            : "testError";
        return {
          ...mutation,
          compile: compileFailure ? "failed" : "passed",
          covered: loaded,
          outcome,
          killEvidence: [],
          tests,
          diagnostics: [
            transcript.trim().slice(0, 4000) ||
              `P4_MUTATION_FULL_FILE_FALLBACK: ${test} timed out or failed before loading ${mutation.id}`,
          ],
        };
      }
      if (failedRows.length > 0)
        return {
          ...mutation,
          compile: "passed",
          covered: true,
          outcome: "killed",
          killEvidence: tapFailureEvidence(result.stdout, test),
          tests,
          diagnostics: [],
        };
    }
    return {
      ...mutation,
      compile: "passed",
      covered: mutation.baselineCovered === true,
      outcome: mutation.baselineCovered === true ? "survived" : "noCoverage",
      killEvidence: [],
      tests,
      diagnostics: [],
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

export function mutationTestPatterns(mutation, test, options = {}) {
  const normalTimeout = options.timeoutMs ?? 90_000;
  if (
    mutation.module === "packages/verifactu/src/ports/xml-xsd.ts" &&
    test === "tests/unit/p4-xml-model.test.mjs"
  ) {
    if (mutation.line <= 165)
      return [
        {
          pattern:
            "^(?:XML model freezes the tree and emits deterministic UTF-8 with expanded names|XML model applies a total serialized-byte ceiling before allocating output|XML model rejects malformed names, bindings, duplicate expanded attributes, and invalid text|XML model accepts each documented exact capacity)$",
          timeoutMs: normalTimeout,
        },
      ];
    if (mutation.line <= 223)
      return [
        {
          pattern:
            "^(?:XML model accepts each documented exact capacity|XML model accounts for serialized bytes in every node class|XML model rejects exact one-byte serialized overflows in each markup class|XML model rejects a valid element name that exceeds the serialized byte ceiling)$",
          timeoutMs: normalTimeout,
        },
      ];
    if (mutation.line <= 299)
      return [
        {
          pattern:
            "^(?:XML model rejects malformed names, bindings, duplicate expanded attributes, and invalid text|XML model distinguishes default element namespaces from unprefixed attributes|XML serializer orders expanded attributes by namespace then local name|XML model applies a total serialized-byte ceiling before allocating output|XML model accounts for serialized bytes in every node class|XML model rejects exact one-byte serialized overflows in each markup class|XML model fails closed across namespace, attribute, node, and text boundaries|XML model stops traversing siblings after serialized bytes overflow|XML model accounts for quotes as text without attribute expansion|XML model stops counting escaped text at the serialized byte ceiling|XML model accepts the complete valid scalar ranges and empty processing instructions|XML model accepts each documented exact capacity)$",
          timeoutMs: normalTimeout,
        },
      ];
    if (mutation.line <= 340)
      return [
        {
          pattern:
            "^(?:XML model rejects malformed names, bindings, duplicate expanded attributes, and invalid text|XML model rejects maximum-length names before scanning their characters|XML model distinguishes default element namespaces from unprefixed attributes|XML model accepts the complete valid scalar ranges and empty processing instructions)$",
          timeoutMs: normalTimeout,
        },
      ];
    if (mutation.line <= 364)
      return [
        {
          pattern:
            "^(?:XML model rejects malformed names, bindings, duplicate expanded attributes, and invalid text|XML model fails closed across namespace, attribute, node, and text boundaries|XML model accepts the complete valid scalar ranges and empty processing instructions|XML model enforces the text byte ceiling for three-byte characters|XML model enforces the text byte ceiling for supplementary characters|XML model counts DEL as one UTF-8 text byte)$",
          timeoutMs: normalTimeout,
        },
      ];
    if (mutation.line <= 398)
      return [
        {
          pattern:
            "^(?:XML model accounts for serialized bytes in every node class|XML model rejects exact one-byte serialized overflows in each markup class|XML model stops traversing siblings after serialized bytes overflow|XML model accounts for quotes as text without attribute expansion|XML model stops counting escaped text at the serialized byte ceiling|XML model accepts each documented exact capacity)$",
          timeoutMs: normalTimeout,
        },
      ];
    if (mutation.line <= 405)
      return [
        {
          pattern:
            "^(?:XML model accepts the complete valid scalar ranges and empty processing instructions|XML model enforces the text byte ceiling for three-byte characters|XML model enforces the text byte ceiling for supplementary characters|XML model counts DEL as one UTF-8 text byte|XML model stops counting escaped text at the serialized byte ceiling)$",
          timeoutMs: normalTimeout,
        },
      ];
    if (mutation.line <= 479)
      return [
        {
          pattern:
            "^(?:XML model freezes the tree and emits deterministic UTF-8 with expanded names|XML model sorts attributes deterministically when namespace keys are equal|XML model distinguishes default element namespaces from unprefixed attributes|XML serializer orders expanded attributes by namespace then local name|XML model accounts for serialized bytes in every node class|XML model rejects exact one-byte serialized overflows in each markup class|XML model accounts for quotes as text without attribute expansion|XML model accepts each documented exact capacity)$",
          timeoutMs: normalTimeout,
        },
      ];
    return [
      {
        pattern:
          "^(?:XML model applies a total serialized-byte ceiling before allocating output|XML model accepts each documented exact capacity)$",
        timeoutMs: normalTimeout,
      },
    ];
  }
  const qrModule =
    mutation.module === "packages/verifactu/src/application/qr.ts";
  if (qrModule && test === "tests/contract/p4-qr-provider.test.mjs") {
    if (mutation.line >= 307 && mutation.line < 310)
      return [
        {
          pattern:
            "^(?:P4-E compact PNG keeps stored blocks bounded|P4-E SVG and PNG enforce the exact 4096-pixel dimension ceiling)$",
          timeoutMs: normalTimeout,
        },
      ];
    if (mutation.line < 161)
      return [
        {
          pattern:
            "^(?:QR encoder rejects non-Uint8Array byte sources|P4-E encoder port enforces admitted byte and correction-level input|P4-E payload binds canonical ordered query and mode endpoint|P4-E rejects cross-edition payloads, oversized fields and render bounds|P4-E rejects forged record facts, unsupported QR lexicals and digest failures|P4-E malformed verifier and edition identities fail closed)$",
          timeoutMs: normalTimeout,
        },
      ];
    if (mutation.line < 215)
      return [
        {
          pattern:
            "^(?:P4-E rejects malformed encoder ports, matrices and render option boundaries|P4-E encoder port enforces admitted byte and correction-level input)$",
          timeoutMs: normalTimeout,
        },
      ];
    if (mutation.line < 290)
      return [
        {
          pattern:
            "^(?:P4-E rejects cross-edition payloads, oversized fields and render bounds|P4-E rejects malformed encoder ports, matrices and render option boundaries|P4-E deterministic PNG supports multi-block bounded rasters|P4-E PNG encodes exact raster pixels, physical density and chunk checksums)$",
          timeoutMs: normalTimeout,
        },
      ];
    return [
      {
        pattern:
          "^(?:P4-E rejects malformed encoder ports, matrices and render option boundaries|P4-E deterministic PNG supports multi-block bounded rasters|P4-E SVG and PNG enforce the exact 4096-pixel dimension ceiling|P4-E PNG fails closed when its raster allocation ends at a row boundary|P4-E PNG encodes exact raster pixels, physical density and chunk checksums)$",
        timeoutMs: normalTimeout,
      },
    ];
  }
  if (qrModule && test === "tests/security/p4-resource-attacks.test.mjs")
    return [];
  if (qrModule && test === "tests/integration/p4-qr-roundtrip.test.mjs") {
    if (mutation.line >= 283)
      return [
        {
          pattern:
            "^P4-E PNG renderer is deterministic, bounded and independently decodable$",
          timeoutMs: normalTimeout,
        },
      ];
    if (mutation.line >= 215 && mutation.line < 290)
      return [
        {
          pattern:
            "^(?:P4-MUT-(?:030|031|042|043)|P4-FAULT-QR-(?:ENVIRONMENT|TRUNCATION))",
          timeoutMs: normalTimeout,
        },
      ];
    if (mutation.line < 161)
      return [
        {
          pattern:
            "^(?:P4-MUT-(?:030|031|042|043)|P4-FAULT-QR-(?:ENVIRONMENT|TRUNCATION))",
          timeoutMs: normalTimeout,
        },
        { pattern: "^P4-PROP-011", timeoutMs: normalTimeout },
        { pattern: "^P4-FUZZ-005", timeoutMs: normalTimeout },
      ];
    return [
      {
        pattern:
          "^(?:P4-MUT-(?:030|031|042|043)|P4-FAULT-QR-(?:ENVIRONMENT|TRUNCATION))",
        timeoutMs: normalTimeout,
      },
    ];
  }
  if (test === "tests/integration/p4-qr-roundtrip.test.mjs")
    return [{ pattern: "^P4-PROP-011", timeoutMs: normalTimeout }];
  return [{ pattern: options.requestedPattern, timeoutMs: normalTimeout }];
}

export async function executeNodeMutations(root, mutations, options = {}) {
  const results = new Array(mutations.length);
  let cursor = 0;
  let completed = 0;
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 4, 16));
  const worker = async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= mutations.length) return;
      results[index] = await executeNodeMutation(
        root,
        mutations[index],
        options,
      );
      completed += 1;
      options.onProgress?.({
        completed,
        total: mutations.length,
        result: results[index],
      });
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, mutations.length) }, worker),
  );
  return results;
}

const JAVA_MUTATION_TESTS = [
  "tests/integration/p4-xades-pki.test.mjs",
  "tests/security/p4-signature-attacks.test.mjs",
  "tests/security/p4-resource-attacks.test.mjs",
  "tests/integration/p4-xades-pki.test.mjs",
];

// The exact macOS P4-G run hit 19 false 90s timeouts in Java/XAdES integration
// selections; keep the zero-timeout gate while allowing those probes to finish.
export const DEFAULT_JAVA_MUTATION_TEST_TIMEOUT_MS = 180_000;

export function javaMutationTestSelections(mutation) {
  const line = mutation.line;
  if (line === 127 || line === 140)
    return [
      [
        JAVA_MUTATION_TESTS[0],
        "^P4-OVERALL-MUTATION-JAVA-GUARD-PROBE enforces DSS signing request boundaries$",
      ],
    ];
  if (line === 194 || line === 212)
    return [
      [
        JAVA_MUTATION_TESTS[3],
        "^P4-OVERALL-MUTATION-JAVA-PROBE checks deterministic DSS bridge behaviors$",
      ],
    ];
  if (line === 219)
    return [
      [
        JAVA_MUTATION_TESTS[0],
        "^DSS signs through the opaque callback and validates explicit fresh CRL/OCSP evidence$",
      ],
    ];
  if (line === 232)
    return [
      [
        JAVA_MUTATION_TESTS[1],
        "^signed XML rejects wrapping, duplicate IDs, extra references, and entity attacks$",
      ],
    ];
  if (line < 104)
    return [
      [
        JAVA_MUTATION_TESTS[2],
        "^Java bridge turns malformed wire data into a bounded defect response$",
      ],
    ];
  if (line < 113)
    return [
      [
        JAVA_MUTATION_TESTS[2],
        "^Java bridge installs a policy that denies socket permissions at runtime$",
      ],
    ];
  if (line < 124)
    return [
      [
        JAVA_MUTATION_TESTS[2],
        "^(?:Java bridge enforces every top-level request identity and artifact bound|Java bridge fails closed across invalid command, digest, signing and XML request paths)$",
      ],
    ];
  if (line < 140)
    return [
      [
        JAVA_MUTATION_TESTS[0],
        "^DSS signs through the opaque callback and validates explicit fresh CRL/OCSP evidence$",
      ],
      [
        JAVA_MUTATION_TESTS[2],
        "^Java bridge fails closed across invalid command, digest, signing and XML request paths$",
      ],
    ];
  if (line >= 140 && line < 149)
    return [
      [
        JAVA_MUTATION_TESTS[0],
        "^DSS signs through the opaque callback and validates explicit fresh CRL/OCSP evidence$",
      ],
      [
        JAVA_MUTATION_TESTS[2],
        "^Java bridge fails closed across invalid command, digest, signing and XML request paths$",
      ],
    ];
  if (line < 157)
    return [
      [
        JAVA_MUTATION_TESTS[2],
        "^Java bridge fails closed across invalid command, digest, signing and XML request paths$",
      ],
    ];
  if (line < 177)
    return [
      [
        JAVA_MUTATION_TESTS[2],
        "^Java bridge rejects malformed and excessive certificate/revocation evidence$",
      ],
    ];
  if (line < 239)
    return [
      [
        JAVA_MUTATION_TESTS[0],
        "^exact DSS bridge verifies official XAdES structure and signature without inventing trust$",
      ],
      [
        JAVA_MUTATION_TESTS[0],
        "^DSS signs through the opaque callback and validates explicit fresh CRL/OCSP evidence$",
      ],
      [
        JAVA_MUTATION_TESTS[1],
        "^DSS rejects each altered XAdES profile component before crypto validation$",
      ],
    ];
  if (line < 339)
    return [
      [
        JAVA_MUTATION_TESTS[0],
        "^(?:revoked is terminal and unknown, absent and malformed never become valid|DSS signs through the opaque callback and validates explicit fresh CRL/OCSP evidence)$",
      ],
      [
        JAVA_MUTATION_TESTS[0],
        "^exact DSS bridge verifies official XAdES structure and signature without inventing trust$",
      ],
    ];
  if (line < 397)
    return [
      [
        JAVA_MUTATION_TESTS[0],
        "^certificate policy keeps chain, trust, time, use, identity and authorization distinct$",
      ],
    ];
  if (line < 438)
    return [
      [
        JAVA_MUTATION_TESTS[2],
        "^(?:Java bridge enforces every top-level request identity and artifact bound|Java XML parser enforces depth, node, attribute and expanded-text limits|Java XML parser traverses bounded comments, text, CDATA and nested elements)$",
      ],
      [
        JAVA_MUTATION_TESTS[1],
        "^DSS rejects each altered XAdES profile component before crypto validation$",
      ],
    ];
  if (line >= 438 && line < 450)
    return [
      [
        JAVA_MUTATION_TESTS[2],
        "^(?:Java XML parser enforces depth, node, attribute and expanded-text limits|Java XML parser traverses bounded comments, text, CDATA and nested elements)$",
      ],
    ];
  if (line >= 540 && line < 549)
    return [
      [
        JAVA_MUTATION_TESTS[2],
        "^Java bridge checks unsigned targets with exact root, signature and ID rules$",
      ],
    ];
  if (line < 553)
    return [
      [
        JAVA_MUTATION_TESTS[1],
        "^(?:signed XML rejects wrapping, duplicate IDs, extra references, and entity attacks|DSS rejects each altered XAdES profile component before crypto validation)$",
      ],
    ];
  if (line >= 588 && line < 596)
    return [
      [
        JAVA_MUTATION_TESTS[1],
        "^DSS distinguishes optional and malformed embedded KeyValue data$",
      ],
    ];
  if (line < 588)
    return [
      [
        JAVA_MUTATION_TESTS[1],
        "^(?:signed XML rejects wrapping, duplicate IDs, extra references, and entity attacks|DSS rejects each altered XAdES profile component before crypto validation|DSS distinguishes optional and malformed embedded KeyValue data)$",
      ],
    ];
  if (line < 625)
    return [
      [
        JAVA_MUTATION_TESTS[0],
        "^certificate policy keeps chain, trust, time, use, identity and authorization distinct$",
      ],
    ];
  if (line < 687)
    return [
      [
        JAVA_MUTATION_TESTS[0],
        "^(?:certificate policy keeps chain, trust, time, use, identity and authorization distinct|revoked is terminal and unknown, absent and malformed never become valid)$",
      ],
    ];
  if (line < 743)
    return [
      [
        JAVA_MUTATION_TESTS[0],
        "^DSS signs through the opaque callback and validates explicit fresh CRL/OCSP evidence$",
      ],
    ];
  return [
    [
      JAVA_MUTATION_TESTS[2],
      "^(?:Java bridge turns malformed wire data into a bounded defect response|Java bridge accepts exact request and field-count ceilings before parsing semantics|Java bridge fails closed across invalid command, digest, signing and XML request paths)$",
    ],
  ];
}

export function combineJavaMutationTestSelections(selections) {
  const patternsByTest = new Map();
  for (const [test, pattern] of selections) {
    const current = patternsByTest.get(test) ?? { patterns: [], full: false };
    if (pattern === undefined) current.full = true;
    else if (!current.patterns.includes(pattern))
      current.patterns.push(pattern);
    patternsByTest.set(test, current);
  }
  return [...patternsByTest].map(([test, selection]) => [
    test,
    selection.full || selection.patterns.length === 0
      ? undefined
      : selection.patterns.length === 1
        ? selection.patterns[0]
        : `^(?:${selection.patterns.map((pattern) => `(?:${pattern})`).join("|")})$`,
  ]);
}

export function planJavaMutationTestRuns(selections, bridgeProbe) {
  const hasBridgeProbe = selections.some(
    ([test, pattern]) => test === bridgeProbe[0] && pattern === bridgeProbe[1],
  );
  const groupedSelections = combineJavaMutationTestSelections(selections);
  return {
    selections: groupedSelections,
    supplementalProbe: hasBridgeProbe ? null : bridgeProbe,
    selectedTests: [
      ...new Set([
        ...groupedSelections.map(([test]) => test),
        ...(hasBridgeProbe ? [] : [bridgeProbe[0]]),
      ]),
    ],
  };
}

export async function executePythonMutation(root, mutation, options = {}) {
  const source = await readFile(resolve(root, mutation.module), "utf8");
  const mutated = `${source.slice(0, mutation.start)}${mutation.after}${source.slice(mutation.end)}`;
  if (source.slice(mutation.start, mutation.end) !== mutation.before)
    throw new Error(`P4_MUTATION_SOURCE_DRIFT: ${mutation.id}`);
  const python = options.python ?? process.env.VERIFACTU_PYTHON ?? "python3";
  const syntax = await runMutationTest(
    python,
    ["-I", "-c", "import ast,sys; ast.parse(sys.stdin.read())"],
    {
      cwd: root,
      env: process.env,
      input: mutated,
      timeoutMs: options.compileTimeoutMs ?? 10_000,
    },
  );
  if (syntax.timedOut || syntax.code !== 0)
    return {
      ...mutation,
      compile: "failed",
      covered: true,
      outcome: syntax.timedOut ? "timeout" : "compileError",
      tests: [mutation.module],
      killEvidence: [],
      diagnostics: [syntax.stderr.slice(0, 3000)],
    };
  const bootstrap = [
    "import sys",
    "path = sys.argv[1]",
    "source = sys.stdin.read()",
    "exec(compile(source, path, 'exec'), {'__name__': '__main__', '__file__': path})",
  ].join("\n");
  const result = await runMutationTest(
    python,
    ["-I", "-c", bootstrap, resolve(root, mutation.module)],
    {
      cwd: root,
      env: process.env,
      input: mutated,
      timeoutMs: options.timeoutMs ?? 30_000,
    },
  );
  const reportLine = result.stdout.trim().split(/\r?\n/u).at(-1);
  let report;
  try {
    report = JSON.parse(reportLine);
  } catch {
    const sourceFailure = result.stderr.includes(
      resolve(root, mutation.module),
    );
    if (!result.timedOut && result.code !== 0 && sourceFailure)
      return {
        ...mutation,
        compile: "passed",
        covered: true,
        outcome: "killed",
        tests: [mutation.module],
        killEvidence: [
          `${mutation.module}:${mutation.line}: mutated oracle execution raised an exception; baseline oracle is required to complete`,
        ],
        diagnostics: [result.stderr.slice(0, 3000)],
      };
    if (
      !result.timedOut &&
      !result.outputExceeded &&
      result.code === 0 &&
      result.stdout.trim() === ""
    )
      return {
        ...mutation,
        compile: "passed",
        covered: true,
        outcome: "killed",
        tests: [mutation.module],
        killEvidence: [
          `${mutation.module}:${mutation.line}: mutated oracle entrypoint emitted no report; the baseline entrypoint must emit one JSON report`,
        ],
        diagnostics: [],
      };
    return {
      ...mutation,
      compile: "passed",
      covered: true,
      outcome: result.timedOut ? "timeout" : "testError",
      tests: [mutation.module],
      killEvidence: [],
      diagnostics: [result.stderr.slice(0, 3000), result.stdout.slice(-1000)],
    };
  }
  const valid =
    report.executed === report.selected &&
    report.selected === 9 &&
    report.creationAllowed === false;
  if (!valid)
    return {
      ...mutation,
      compile: "passed",
      covered: true,
      outcome: "testError",
      tests: [mutation.module],
      killEvidence: [],
      diagnostics: [JSON.stringify(report)],
    };
  if (result.timedOut || result.outputExceeded)
    return {
      ...mutation,
      compile: "passed",
      covered: true,
      outcome: result.timedOut ? "timeout" : "testError",
      tests: [mutation.module],
      killEvidence: [],
      diagnostics: [result.stderr.slice(0, 3000)],
    };
  const hasSortedKeys = (value) => {
    if (Array.isArray(value)) return value.every(hasSortedKeys);
    if (value === null || typeof value !== "object") return true;
    const keys = Object.keys(value);
    return (
      keys.every((key, index) => key === [...keys].sort()[index]) &&
      keys.every((key) => hasSortedKeys(value[key]))
    );
  };
  if (result.code === 0 && report.status === "passed" && !hasSortedKeys(report))
    return {
      ...mutation,
      compile: "passed",
      covered: true,
      outcome: "killed",
      tests: [mutation.module],
      killEvidence: [
        `${mutation.module}:${mutation.line}: the oracle JSON report must retain canonical sorted keys`,
      ],
      diagnostics: [],
    };
  if (report.status === "failed" && result.code !== 0)
    return {
      ...mutation,
      compile: "passed",
      covered: true,
      outcome: "killed",
      tests: [mutation.module],
      killEvidence: report.failed,
      diagnostics: [],
    };
  if (report.status === "passed" && result.code === 0) {
    const baselineDigest =
      '"14a04c138da532dff4572a52ff8dfc0a2e8313742ec588db4a94a443c35ffc10"';
    const negativeSource = mutated.replace(
      baselineDigest,
      '"0000000000000000000000000000000000000000000000000000000000000000"',
    );
    if (negativeSource === mutated)
      throw new Error("P4_PYTHON_ORACLE_VECTOR_NOT_FOUND");
    const negative = await runMutationTest(
      python,
      ["-I", "-c", bootstrap, resolve(root, mutation.module)],
      {
        cwd: root,
        env: process.env,
        input: negativeSource,
        timeoutMs: options.timeoutMs ?? 30_000,
      },
    );
    const negativeLine = negative.stdout.trim().split(/\r?\n/u).at(-1);
    let negativeReport;
    try {
      negativeReport = JSON.parse(negativeLine);
    } catch {
      negativeReport = null;
    }
    const reportsInjectedFailureWithStableIdentity =
      !negative.timedOut &&
      !negative.outputExceeded &&
      negative.code === 1 &&
      negativeReport?.status === "failed" &&
      negativeReport.selected === 9 &&
      negativeReport.executed === 9 &&
      JSON.stringify(negativeReport.failed) ===
        '["independent_sha256_vector"]' &&
      negativeReport.creationAllowed === false &&
      hasSortedKeys(negativeReport);
    if (!reportsInjectedFailureWithStableIdentity)
      return {
        ...mutation,
        compile: "passed",
        covered: true,
        outcome: "testError",
        tests: [mutation.module],
        killEvidence: [],
        diagnostics: [
          JSON.stringify({
            code: negative.code,
            report: negativeReport,
            stderr: negative.stderr.slice(0, 1000),
          }),
        ],
      };
    if (negativeReport.passed !== 8)
      return {
        ...mutation,
        compile: "passed",
        covered: true,
        outcome: "killed",
        tests: [mutation.module],
        killEvidence: [
          `${mutation.module}:${mutation.line}: injected independent-vector failure must report 8 passed checks; observed ${negativeReport.passed}`,
        ],
        diagnostics: [],
      };
    return {
      ...mutation,
      compile: "passed",
      covered: true,
      outcome: "survived",
      tests: [mutation.module],
      killEvidence: [],
      diagnostics: [],
    };
  }
  return {
    ...mutation,
    compile: "passed",
    covered: true,
    outcome: "testError",
    tests: [mutation.module],
    killEvidence: [],
    diagnostics: [JSON.stringify({ code: result.code, report })],
  };
}

export async function executeJavaMutation(root, mutation, options = {}) {
  const temporary = await mkdtemp(resolve(tmpdir(), "verifactu-p4-java-om-"));
  try {
    const source = await readFile(resolve(root, mutation.module), "utf8");
    if (source.slice(mutation.start, mutation.end) !== mutation.before)
      throw new Error(`P4_MUTATION_SOURCE_DRIFT: ${mutation.id}`);
    const mutatedSource = `${source.slice(0, mutation.start)}${mutation.after}${source.slice(mutation.end)}`;
    const javaSource = resolve(temporary, "DssBridge.java");
    const precompiledClasses = options.precompiledJavaClasses?.get(mutation.id);
    const classes = precompiledClasses ?? resolve(temporary, "classes");
    if (!precompiledClasses) await mkdir(classes, { recursive: true });
    await writeFile(javaSource, mutatedSource);
    const javaHome = options.javaHome;
    const java = options.java;
    const javac = resolve(
      javaHome,
      "bin",
      process.platform === "win32" ? "javac.exe" : "javac",
    );
    const originalJar = options.dssJar;
    const compile = precompiledClasses
      ? { code: 0, stderr: "" }
      : await runMutationTest(
          javac,
          ["--release", "21", "-cp", originalJar, "-d", classes, javaSource],
          {
            cwd: root,
            env: process.env,
            timeoutMs: options.compileTimeoutMs ?? 60_000,
            maxBuffer: 4 * 1024 * 1024,
          },
        );
    const plannedSelections = javaMutationTestSelections(mutation);
    const bridgeProbe = [
      JAVA_MUTATION_TESTS[3],
      "^P4-OVERALL-MUTATION-JAVA-PROBE checks deterministic DSS bridge behaviors$",
    ];
    const { selections, supplementalProbe, selectedTests } =
      planJavaMutationTestRuns(
        options.javaSelections ?? plannedSelections,
        bridgeProbe,
      );
    // Keep the supplemental probe separate from exact mutation oracles. Both
    // can be slow on hosted runners, and combining them would make unrelated
    // tests share one timeout budget. The report schema records selected files.
    if (compile.timedOut || compile.outputExceeded)
      return {
        ...mutation,
        compile: "failed",
        covered: true,
        outcome: compile.timedOut ? "timeout" : "compileError",
        tests: selectedTests,
        killEvidence: [],
        diagnostics: [compile.stderr.slice(0, 3000)],
      };
    if (compile.code !== 0)
      return {
        ...mutation,
        compile: "failed",
        covered: true,
        outcome: "compileError",
        tests: selectedTests,
        killEvidence: [],
        diagnostics: [compile.stderr.slice(0, 3000)],
      };
    const classPath = `${classes}${process.platform === "win32" ? ";" : ":"}${originalJar}`;
    const tests = new Set();
    const fullyExecuted = new Set();
    const runSelection = async (test, pattern) => {
      tests.add(test);
      if (!pattern) fullyExecuted.add(test);
      const args = ["--test", "--test-concurrency=1", "--test-reporter=tap"];
      if (pattern) args.push(`--test-name-pattern=${pattern}`);
      args.push(test);
      const result = await runMutationTest(execPath, args, {
        cwd: root,
        env: {
          ...process.env,
          VERIFACTU_JAVA: java,
          VERIFACTU_DSS_JAR: classPath,
          VERIFACTU_JAVA_MUTATION: "0",
        },
        timeoutMs: options.timeoutMs ?? DEFAULT_JAVA_MUTATION_TEST_TIMEOUT_MS,
        maxBuffer: 16 * 1024 * 1024,
      });
      const failedRows = result.stdout
        .split("\n")
        .filter((line) => /^\s*not ok \d+ /u.test(line));
      if (
        result.timedOut ||
        result.outputExceeded ||
        (result.code !== 0 && failedRows.length === 0)
      )
        return {
          ...mutation,
          compile: "passed",
          covered: true,
          outcome: result.timedOut ? "timeout" : "testError",
          tests: [...tests],
          killEvidence: [],
          diagnostics: [`${test}\n${result.stderr.slice(0, 3000)}`],
        };
      if (failedRows.length > 0)
        return {
          ...mutation,
          compile: "passed",
          covered: true,
          outcome: "killed",
          tests: [...tests],
          killEvidence: tapFailureEvidence(result.stdout, test),
          diagnostics: [],
        };
      return null;
    };
    if (supplementalProbe) {
      const result = await runSelection(...supplementalProbe);
      if (result) return result;
    }
    for (const [test, pattern] of selections) {
      const result = await runSelection(test, pattern);
      if (result) return result;
    }
    // Likewise, a surviving Java mutation must face the entire set of
    // baseline-covered test files before it can be classified as a survivor.
    for (const test of selectedTests) {
      if (fullyExecuted.has(test)) continue;
      fullyExecuted.add(test);
      tests.add(test);
      const result = await runMutationTest(
        execPath,
        ["--test", "--test-concurrency=1", "--test-reporter=tap", test],
        {
          cwd: root,
          env: {
            ...process.env,
            VERIFACTU_JAVA: java,
            VERIFACTU_DSS_JAR: classPath,
            VERIFACTU_JAVA_MUTATION: "0",
          },
          timeoutMs: options.javaFullTestTimeoutMs ?? 900_000,
          maxBuffer: 16 * 1024 * 1024,
        },
      );
      const failedRows = result.stdout
        .split("\n")
        .filter((line) => /^\s*not ok \d+ /u.test(line));
      if (
        result.timedOut ||
        result.outputExceeded ||
        (result.code !== 0 && failedRows.length === 0)
      )
        return {
          ...mutation,
          compile: "passed",
          covered: true,
          outcome: result.timedOut ? "timeout" : "testError",
          tests: [...tests],
          killEvidence: [],
          diagnostics: [`${test}\n${result.stderr.slice(0, 3000)}`],
        };
      if (failedRows.length > 0)
        return {
          ...mutation,
          compile: "passed",
          covered: true,
          outcome: "killed",
          tests: [...tests],
          killEvidence: tapFailureEvidence(result.stdout, test),
          diagnostics: [],
        };
    }
    return {
      ...mutation,
      compile: "passed",
      covered: true,
      outcome: "survived",
      tests: [...tests],
      killEvidence: [],
      diagnostics: [],
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

export async function executeOverallMutationCampaign(
  root,
  plan,
  v8Root,
  catalog,
  options = {},
) {
  const nodeMutations = await discoverNodeMutationTests(
    root,
    plan,
    v8Root,
    catalog.mutants,
  );
  const byId = new Map(
    nodeMutations.map((mutation) => [mutation.id, mutation]),
  );
  const mutations = catalog.mutants.map((mutation) => {
    if (/\.(?:ts|mjs)$/u.test(mutation.module))
      return byId.get(mutation.id) ?? { ...mutation, tests: [] };
    if (mutation.module.endsWith(".py"))
      return { ...mutation, tests: [mutation.module] };
    return {
      ...mutation,
      tests: [
        ...new Set(javaMutationTestSelections(mutation).map(([test]) => test)),
      ],
    };
  });
  const journalPath = resolve(
    options.artifactRoot,
    "overall-mutation-progress.jsonl",
  );
  const verifierInputs = [
    "config/quality/p4-quality-plan.json",
    "package-lock.json",
    "tooling/assurance/p4-mutation-catalog.mjs",
    "tooling/assurance/P4JavaMutationCatalog.java",
    "tooling/assurance/p4-mutation-loader.mjs",
    "tooling/assurance/p4-mutation-hooks.mjs",
    "tooling/assurance/p4-overall-mutation-campaign.mjs",
    ...plan.testFiles,
  ];
  const verifierDigests = await Promise.all(
    verifierInputs.map(async (path) => [
      path,
      digestText(await readFile(resolve(root, path))),
    ]),
  );
  const journalHeader = {
    schemaVersion: 1,
    subject: options.subject,
    tree: options.tree,
    catalogSha256: digestText(
      [
        ...catalog.mutants.map(
          (mutation) => `${mutation.id}\0${mutation.mutatedSha256}`,
        ),
        ...catalog.excludedApplications.map(
          (mutation) =>
            `EXCLUDED\0${mutation.id}\0${mutation.mutatedSha256}\0${digestText(mutation.compilerDiagnostic)}`,
        ),
      ].join("\n"),
    ),
    verifierSha256: digestText(
      JSON.stringify({
        files: verifierDigests,
        node: process.version,
        python: options.python,
        java: options.java,
        javaHome: options.javaHome,
      }),
    ),
  };
  const completed = new Map();
  try {
    const lines = (await readFile(journalPath, "utf8")).trim().split(/\r?\n/u);
    const header = JSON.parse(lines[0]);
    if (JSON.stringify(header) === JSON.stringify(journalHeader)) {
      for (const line of lines.slice(1)) {
        const result = JSON.parse(line);
        if (
          byId.has(result.id) ||
          catalog.mutants.some((entry) => entry.id === result.id)
        )
          completed.set(result.id, result);
      }
    }
  } catch {}
  if (completed.size === 0) {
    await writeFile(journalPath, `${JSON.stringify(journalHeader)}\n`);
  }
  let progress = 0;
  const pending = mutations.filter((mutation) => !completed.has(mutation.id));
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 4, 16));
  let cursor = 0;
  const execute = async () => {
    while (true) {
      const index = cursor++;
      if (index >= pending.length) return;
      const mutation = pending[index];
      let result;
      if (mutation.tests.length === 0)
        result = {
          ...mutation,
          compile: "passed",
          covered: false,
          outcome: "noCoverage",
          killEvidence: [],
          diagnostics: [],
        };
      else if (/\.(?:ts|mjs)$/u.test(mutation.module))
        result = await executeNodeMutation(root, mutation, options);
      else if (mutation.module.endsWith(".py"))
        result = await executePythonMutation(root, mutation, options);
      else
        result = await executeJavaMutation(root, mutation, {
          ...options,
          precompiledJavaClasses: options.precompiledJavaClasses,
        });
      completed.set(result.id, result);
      await appendFile(journalPath, `${JSON.stringify(result)}\n`);
      options.onProgress?.({
        completed: ++progress,
        total: pending.length,
        result,
      });
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, pending.length) }, execute),
  );
  return mutations.map((mutation) => completed.get(mutation.id));
}

function digestText(value) {
  return createHash("sha256").update(value).digest("hex");
}
