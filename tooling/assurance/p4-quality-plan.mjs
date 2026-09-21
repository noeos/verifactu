#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const readJson = async (path) =>
  JSON.parse(await readFile(resolve(root, path), "utf8"));
const plan = await readJson("config/quality/p4-quality-plan.json");
const lifecycle = await readJson("config/regulatory/edition-lifecycle.json");
const generation = await readJson(
  "editions/rrsif-2026-09-21-authoritative-candidate/generated/generation-report.json",
);
const admission = await readJson("config/admission/dependencies.json");
const required = await readJson("config/ci/required-checks.json");

const fail = (code, detail) => {
  const error = new Error(`${code}: ${detail}`);
  error.code = code;
  throw error;
};
const assert = (condition, code, detail) => {
  if (!condition) fail(code, detail);
};
const unique = (values, code) => {
  assert(new Set(values).size === values.length, code, "duplicate value");
};
const canonical = (value) => {
  const normalize = (item) =>
    Array.isArray(item)
      ? item.map(normalize)
      : item && typeof item === "object"
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [key, normalize(item[key])]),
          )
        : item;
  return JSON.stringify(normalize(value));
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const git = (...args) => {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert(result.status === 0, "P4_PLAN_GIT", result.stderr.trim());
  return result.stdout.trim();
};

export function validateP4QualityPlan(candidate) {
  assert(candidate.schemaVersion === 1, "P4_PLAN_SCHEMA", "schemaVersion");
  assert(
    candidate.id === "P4-QUALITY-PLAN-0001" &&
      candidate.phaseState === "pre-implementation" &&
      candidate.declaredBeforeImplementation === true,
    "P4_PLAN_STATE",
    candidate.id,
  );
  assert(
    /^[a-f0-9]{40}$/u.test(candidate.governingProtectedMain),
    "P4_PLAN_SUBJECT",
    candidate.governingProtectedMain,
  );
  assert(
    candidate.edition.id === lifecycle.current.editionId &&
      candidate.edition.id === generation.editionId &&
      candidate.edition.creationAllowed === false &&
      lifecycle.current.creationAllowed === false &&
      candidate.edition.sourceManifestSha256 ===
        generation.sourceManifestSha256 &&
      candidate.edition.generatedOutputSha256 === generation.outputDigest,
    "P4_PLAN_EDITION",
    candidate.edition.id,
  );
  const engine = admission.dependencies.find(
    (entry) => entry.name === "@noeos/verification-engine",
  );
  assert(
    engine &&
      engine.version === candidate.verificationEngine.version &&
      engine.integrity === candidate.verificationEngine.integrity &&
      candidate.verificationEngine.name === engine.name &&
      canonical(candidate.verificationEngine.allowedExports) ===
        canonical([".", "./profiles", "./schemas", "./vectors"]),
    "P4_PLAN_ENGINE",
    candidate.verificationEngine.version,
  );

  assert(
    candidate.productionModules.length === 43,
    "P4_PLAN_MODULE_POPULATION",
    candidate.productionModules.length,
  );
  unique(candidate.productionModules, "P4_PLAN_MODULE_DUPLICATE");
  assert(
    candidate.productionModules.every(
      (path) =>
        path.startsWith("packages/verifactu/src/") ||
        path.startsWith("internal/xml-provider/") ||
        path.startsWith("internal/xades-provider/") ||
        path === "internal/independent-oracles/p4_oracle.py",
    ),
    "P4_PLAN_MODULE_SCOPE",
    "path outside P4 production/provider/oracle scope",
  );
  assert(
    candidate.testFiles.length === 26,
    "P4_PLAN_TEST_POPULATION",
    candidate.testFiles.length,
  );
  unique(candidate.testFiles, "P4_PLAN_TEST_DUPLICATE");
  assert(
    candidate.testFiles.every((path) => path.startsWith("tests/")),
    "P4_PLAN_TEST_SCOPE",
    "test outside tests/",
  );

  const thresholds = candidate.coverage.thresholds;
  assert(
    thresholds.linesPercent >= 98 &&
      thresholds.functionsPercent >= 98 &&
      thresholds.statementsPercent >= 98 &&
      thresholds.branchesPercent >= 95 &&
      thresholds.criticalBranchesPercent === 100,
    "P4_PLAN_COVERAGE_THRESHOLD",
    canonical(thresholds),
  );
  assert(
    candidate.coverage.exclude.length === 3 &&
      !candidate.coverage.exclude.some((entry) =>
        /production|provider|unreachable|hard to test/iu.test(entry),
      ),
    "P4_PLAN_COVERAGE_EXCLUSION",
    candidate.coverage.exclude.join(","),
  );

  assert(
    candidate.criticalCatalogue.length === 36,
    "P4_PLAN_CRITICAL_POPULATION",
    candidate.criticalCatalogue.length,
  );
  unique(
    candidate.criticalCatalogue.map((entry) => entry.id),
    "P4_PLAN_CRITICAL_DUPLICATE",
  );
  unique(
    candidate.criticalCatalogue.map((entry) => entry.mutant),
    "P4_PLAN_MUTANT_DUPLICATE",
  );
  candidate.criticalCatalogue.forEach((entry, index) => {
    const suffix = String(index + 1).padStart(3, "0");
    assert(entry.id === `P4-CB-${suffix}`, "P4_PLAN_CRITICAL_ID", entry.id);
    assert(
      entry.mutant === `P4-MUT-${suffix}`,
      "P4_PLAN_MUTANT_ID",
      entry.mutant,
    );
    assert(
      candidate.productionModules.includes(entry.path),
      "P4_PLAN_CRITICAL_PATH",
      entry.path,
    );
    assert(
      candidate.testFiles.includes(entry.test),
      "P4_PLAN_CRITICAL_TEST",
      entry.test,
    );
    assert(entry.decision.length >= 24, "P4_PLAN_CRITICAL_DECISION", entry.id);
  });
  const mutation = candidate.mutation.thresholds;
  assert(
    candidate.mutation.operators.length === 6 &&
      mutation.criticalKilledPercent === 100 &&
      mutation.overallKilledPercent >= 95 &&
      mutation.unreviewedCriticalSurvivors === 0 &&
      mutation.compileErrors === 0 &&
      mutation.testErrors === 0 &&
      mutation.timeouts === 0 &&
      mutation.noCoverage === 0,
    "P4_PLAN_MUTATION_THRESHOLD",
    canonical(mutation),
  );

  assert(
    candidate.propertyCampaigns.length === 12 &&
      candidate.propertyCampaigns.every(
        (entry) => entry.executions === 4096 && entry.maxDiscardPercent <= 2,
      ),
    "P4_PLAN_PROPERTY_POPULATION",
    candidate.propertyCampaigns.length,
  );
  assert(
    candidate.fuzzCampaigns.length === 6 &&
      candidate.fuzzCampaigns.every(
        (entry) => entry.executions === 4096 && entry.maximumInputBytes > 0,
      ),
    "P4_PLAN_FUZZ_POPULATION",
    candidate.fuzzCampaigns.length,
  );
  assert(
    candidate.seededFaults.length === 26,
    "P4_PLAN_FAULT_POPULATION",
    candidate.seededFaults.length,
  );
  unique(candidate.seededFaults, "P4_PLAN_FAULT_DUPLICATE");

  const platformCells = required.checks
    .filter((check) => check.task === "gate:platform")
    .map((check) => `${check.runner}:${check.node}`)
    .sort();
  const declaredCells = candidate.compatibilityMatrix
    .map((cell) => `${cell.os}:${cell.node}`)
    .sort();
  assert(
    candidate.compatibilityMatrix.length === 5 &&
      candidate.compatibilityMatrix.every(
        (cell) => cell.status === "required" && cell.module === "esm",
      ) &&
      canonical(platformCells) === canonical(declaredCells),
    "P4_PLAN_COMPATIBILITY",
    canonical(declaredCells),
  );
  assert(
    candidate.performanceBudgets.length === 8 &&
      candidate.performanceBudgets.every(
        (budget) =>
          budget.threshold > 0 &&
          budget.direction === "maximum" &&
          budget.environment.length > 0 &&
          ["security-ceiling", "resource-ceiling", "regression-smoke"].includes(
            budget.class,
          ),
      ),
    "P4_PLAN_BUDGET",
    candidate.performanceBudgets.length,
  );
  assert(
    candidate.officialPerformanceClaim.status === "calibration-required" &&
      candidate.officialPerformanceClaim.blockingGate ===
        "P7 performance closure",
    "P4_PLAN_PERFORMANCE_CLAIM",
    candidate.officialPerformanceClaim.status,
  );
  assert(
    candidate.requiredEvidence.length === 11,
    "P4_PLAN_EVIDENCE_POPULATION",
    candidate.requiredEvidence.length,
  );
  unique(candidate.requiredEvidence, "P4_PLAN_EVIDENCE_DUPLICATE");
  return true;
}

validateP4QualityPlan(plan);
const tracked = git("ls-files").split(/\r?\n/u).filter(Boolean);
const discoveredProduction = tracked.filter(
  (path) =>
    (path.startsWith("packages/verifactu/src/") && path.endsWith(".ts")) ||
    (path.startsWith("internal/xml-provider/") && path.endsWith(".mjs")) ||
    (path.startsWith("internal/xades-provider/") && path.endsWith(".mjs")) ||
    path === "internal/independent-oracles/p4_oracle.py",
);
assert(
  discoveredProduction.every((path) => plan.productionModules.includes(path)),
  "P4_PLAN_UNDECLARED_PRODUCTION",
  discoveredProduction
    .filter((path) => !plan.productionModules.includes(path))
    .join(","),
);

const negativeCases = [
  [
    "P4_PLAN_SUBJECT",
    (value) => {
      value.governingProtectedMain = "not-a-commit";
    },
  ],
  ["P4_PLAN_MODULE_POPULATION", (value) => value.productionModules.pop()],
  [
    "P4_PLAN_CRITICAL_TEST",
    (value) => {
      value.criticalCatalogue[0].test = "tests/unit/not-declared.test.mjs";
    },
  ],
  [
    "P4_PLAN_COVERAGE_THRESHOLD",
    (value) => {
      value.coverage.thresholds.branchesPercent = 94;
    },
  ],
  ["P4_PLAN_CRITICAL_POPULATION", (value) => value.criticalCatalogue.pop()],
  [
    "P4_PLAN_MUTATION_THRESHOLD",
    (value) => {
      value.mutation.thresholds.criticalKilledPercent = 99;
    },
  ],
  ["P4_PLAN_COMPATIBILITY", (value) => value.compatibilityMatrix.pop()],
  [
    "P4_PLAN_BUDGET",
    (value) => {
      value.performanceBudgets[0].threshold = 0;
    },
  ],
  [
    "P4_PLAN_ENGINE",
    (value) => {
      value.verificationEngine.version = "1.0.0";
    },
  ],
  [
    "P4_PLAN_EDITION",
    (value) => {
      value.edition.creationAllowed = true;
    },
  ],
];
let killed = 0;
for (const [expected, mutate] of negativeCases) {
  const value = structuredClone(plan);
  mutate(value);
  try {
    validateP4QualityPlan(value);
  } catch (error) {
    if (error.code === expected) killed += 1;
  }
}
assert(
  killed === negativeCases.length,
  "P4_PLAN_NEGATIVE_CAMPAIGN",
  `${killed}/${negativeCases.length}`,
);

const result = {
  status: "passed",
  selected: negativeCases.length + 10,
  executed: negativeCases.length + 10,
  passed: negativeCases.length + 10,
  failed: 0,
  skipped: 0,
  outputDigest: sha256(canonical(plan)),
  diagnostics: [
    `production-modules:${plan.productionModules.length}`,
    `test-files:${plan.testFiles.length}`,
    `critical-branches:${plan.criticalCatalogue.length}`,
    `critical-mutants:${plan.criticalCatalogue.length}`,
    `property-executions:${plan.propertyCampaigns.reduce((sum, entry) => sum + entry.executions, 0)}`,
    `fuzz-executions:${plan.fuzzCampaigns.reduce((sum, entry) => sum + entry.executions, 0)}`,
    `seeded-plan-faults:${killed}`,
  ],
};
process.stdout.write(`${JSON.stringify(result)}\n`);
