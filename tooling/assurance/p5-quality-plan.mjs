#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getP5WaveScope, resolveP5Wave } from "./p5-delivery-stage.mjs";

const root = resolve(import.meta.dirname, "../..");
const planPath = "config/quality/p5-quality-plan.json";
const docPath = "docs/17-roadmap-risk/p5-quality-plan.md";
const readJson = async (path) =>
  JSON.parse(await readFile(resolve(root, path), "utf8"));
const exists = async (path) => {
  try {
    await readFile(resolve(root, path));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
};

function assert(condition, code, detail) {
  if (!condition) throw new Error(`${code}: ${detail}`);
}

function canonical(value) {
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
}

function unique(values, code) {
  assert(new Set(values).size === values.length, code, "duplicate entry");
}

export function validateP5QualityPlan(plan, discovered = {}) {
  assert(
    plan.schemaVersion === 1 &&
      plan.id === "P5-QUALITY-PLAN-0001" &&
      plan.phaseState === "pre-implementation" &&
      plan.declaredBeforeImplementation === true &&
      plan.governingProtectedMain ===
        "1f66da46e21127d1d82018cfdf093f595e1c08ae" &&
      plan.authorizationCommit === "4b31844af98f7e3e62bcea31b4e97a510116e392",
    "P5_PLAN_SUBJECT",
    "plan no longer binds the authorized P5 input",
  );
  assert(
    canonical(plan.additiveAmendment) ===
      canonical({
        id: "P5-PLAN-AMEND-001",
        date: "2026-10-05",
        reason:
          "Close the DNS SSRF gap for IANA special-purpose addresses using separate IPv4 and IPv6 critical controls.",
        addedCriticalCatalogue: [
          "P5-CRIT-025:non-global-ipv4-destinations-rejected",
          "P5-CRIT-026:non-global-ipv6-destinations-rejected",
        ],
        addedCriticalMutants: ["P5-MUT-041", "P5-MUT-042"],
        resultingPopulation: {
          criticalMutants: 26,
          otherMutants: 16,
          totalMutants: 42,
        },
      }),
    "P5_PLAN_AMENDMENT",
    "the documented additive DNS security amendment changed",
  );
  assert(
    plan.edition.id === "rrsif-2026-09-21-authoritative-candidate" &&
      plan.edition.sourceSnapshot === "rrsif-2026-09-21-authoritative" &&
      plan.edition.sourceManifestSha256 ===
        "0856118bfb3d528ffa2acc6322c3484616ba6aff978f620db5e7aab916ba60c6" &&
      plan.edition.generatedOutputSha256 ===
        "561005c36d5c3ae0b00a98215f59e24769b7b4dec9b1a6cba878f00eacb90482" &&
      plan.edition.creationAllowed === false,
    "P5_PLAN_EDITION",
    "P5 must keep the exact verification-only edition binding",
  );
  const thresholds = plan.coverage.thresholds;
  assert(
    thresholds.linesPercent === 98 &&
      thresholds.statementsPercent === 98 &&
      thresholds.functionsPercent === 98 &&
      thresholds.branchesPercent === 95 &&
      thresholds.criticalBranchesPercent === 100 &&
      plan.mutation.criticalKilledPercent === 100 &&
      plan.mutation.otherKilledPercent === 95 &&
      plan.mutation.unreviewedSurvivors === 0,
    "P5_PLAN_THRESHOLDS",
    "approved strict thresholds changed",
  );
  for (const key of [
    "productionModules",
    "sharedProductionModules",
    "testFiles",
    "criticalCatalogue",
    "faultInjectionIds",
  ]) {
    assert(
      Array.isArray(plan[key]) && plan[key].length > 0,
      "P5_PLAN_EMPTY",
      key,
    );
    unique(plan[key], `P5_PLAN_DUPLICATE_${key}`);
  }
  unique(plan.mutation.criticalMutants, "P5_PLAN_DUPLICATE_CRITICAL_MUTANT");
  unique(plan.mutation.otherMutants, "P5_PLAN_DUPLICATE_OTHER_MUTANT");
  assert(
    plan.productionModules.length === 25 &&
      plan.sharedProductionModules.length === 1 &&
      plan.testFiles.length === 23 &&
      plan.criticalCatalogue.every((entry, index) =>
        entry.startsWith(`P5-CRIT-${String(index + 1).padStart(3, "0")}:`),
      ) &&
      [...plan.mutation.criticalMutants, ...plan.mutation.otherMutants]
        .sort()
        .every(
          (id, index) => id === `P5-MUT-${String(index + 1).padStart(3, "0")}`,
        ) &&
      plan.faultInjectionIds.every((entry, index) =>
        entry.startsWith(`P5-FAULT-${String(index + 1).padStart(3, "0")}:`),
      ),
    "P5_PLAN_POPULATION",
    "exact frozen module, test, critical, mutation or fault population changed",
  );
  assert(
    plan.productionModules.every(
      (path) =>
        path.startsWith("packages/verifactu/src/") && path.endsWith(".ts"),
    ) &&
      plan.sharedProductionModules.every(
        (path) =>
          path.startsWith("packages/verifactu/src/") && path.endsWith(".ts"),
      ),
    "P5_PLAN_PRODUCTION_SCOPE",
    "runtime TypeScript outside the package source tree",
  );
  assert(
    plan.testFiles.every(
      (path) => path.startsWith("tests/") && /p5-.*\.test\.mjs$/u.test(path),
    ),
    "P5_PLAN_TEST_SCOPE",
    "P5 test outside the declared test inventory",
  );
  assert(
    plan.criticalCatalogue.length === 26 &&
      plan.mutation.criticalMutants.length === 26 &&
      plan.mutation.otherMutants.length === 16 &&
      plan.propertyCampaigns.length === 12 &&
      plan.propertyCampaigns.every(
        (campaign, index) =>
          campaign.id === `P5-PROP-${String(index + 1).padStart(3, "0")}` &&
          campaign.seed === 1346651001 + index &&
          campaign.executions === 4096,
      ) &&
      plan.faultInjectionIds.length === 56,
    "P5_PLAN_CAMPAIGNS",
    "frozen critical, property, mutation or fault population changed",
  );
  assert(
    plan.compatibilityMatrix.length === 5 &&
      plan.compatibilityMatrix.every((cell) => cell.npm === "11.19.1") &&
      canonical(plan.compatibilityMatrix) ===
        canonical([
          { os: "ubuntu-24.04", node: "22.14.0", npm: "11.19.1" },
          { os: "ubuntu-24.04", node: "22.23.2", npm: "11.19.1" },
          { os: "ubuntu-24.04", node: "24.21.0", npm: "11.19.1" },
          { os: "windows-2025", node: "24.21.0", npm: "11.19.1" },
          { os: "macos-15", node: "24.21.0", npm: "11.19.1" },
        ]),
    "P5_PLAN_COMPATIBILITY",
    "the admitted platform/runtime matrix changed",
  );
  assert(
    plan.performance.hardBounds.maxResponseBytes === 1048576 &&
      plan.performance.hardBounds.maxPageItems === 500 &&
      plan.performance.hardBounds.maxConcurrentSyntheticOperations === 32 &&
      plan.performance.hardBounds.campaignDeadlineMs === 3600000 &&
      plan.performance.deploymentSlo.startsWith("not-applicable") &&
      plan.externalClaims.activeEdition === false &&
      plan.externalClaims.creationAllowed === false &&
      plan.externalClaims.externalAeatAcceptanceClaimed === false,
    "P5_PLAN_BOUNDS_AND_CLAIMS",
    "resource limits or external-claim boundaries changed",
  );
  if (discovered.productionModules) {
    assert(
      discovered.productionModules.every((path) =>
        plan.productionModules.includes(path),
      ),
      "P5_PLAN_UNDECLARED_PRODUCTION",
      discovered.productionModules
        .filter((path) => !plan.productionModules.includes(path))
        .join(","),
    );
    if (discovered.requireComplete) {
      assert(
        canonical(discovered.productionModules) ===
          canonical(plan.productionModules),
        "P5_PLAN_INCOMPLETE_PRODUCTION",
        "planned P5 production inventory is incomplete",
      );
    }
  }
  if (discovered.testFiles) {
    assert(
      discovered.testFiles.every((path) => plan.testFiles.includes(path)),
      "P5_PLAN_UNDECLARED_TEST",
      discovered.testFiles
        .filter((path) => !plan.testFiles.includes(path))
        .join(","),
    );
    if (discovered.requireComplete) {
      assert(
        canonical(discovered.testFiles) === canonical(plan.testFiles),
        "P5_PLAN_INCOMPLETE_TEST",
        "planned P5 test inventory is incomplete",
      );
    }
  }
  return true;
}

const plan = await readJson(planPath);
const wave = resolveP5Wave();
const scope = getP5WaveScope(wave, plan);
const doc = await readFile(resolve(root, docPath), "utf8");
const extract = (heading) => {
  const position = doc.indexOf(heading);
  assert(position >= 0, "P5_PLAN_DOC_SECTION", heading);
  const tail = doc.slice(position + heading.length);
  const match = tail.match(/\n```text\n([\s\S]*?)\n```/u);
  assert(match, "P5_PLAN_DOC_INVENTORY", heading);
  return match[1].split(/\r?\n/u).filter(Boolean);
};
assert(
  canonical(extract("## Frozen production-module inventory")) ===
    canonical(plan.productionModules) &&
    canonical(extract("## Frozen test-file inventory")) ===
      canonical(plan.testFiles),
  "P5_PLAN_DOC_INVENTORY_MISMATCH",
  "human and machine inventories differ",
);

const plannedPresent = await Promise.all(
  [...plan.productionModules, ...plan.testFiles].map(async (path) => [
    path,
    await exists(path),
  ]),
);
for (const path of plan.sharedProductionModules)
  assert(await exists(path), "P5_PLAN_MISSING_SHARED_MODULE", path);
const presentProduction = plannedPresent
  .filter(([path, present]) => present && path.endsWith(".ts"))
  .map(([path]) => path);
const presentTests = plannedPresent
  .filter(([path, present]) => present && path.endsWith(".test.mjs"))
  .map(([path]) => path);
const discoveredP5Production = [];
for (const directory of [
  "packages/verifactu/src/persistence",
  "packages/verifactu/src/aeat",
  "packages/verifactu/src/operations",
]) {
  try {
    const { readdir } = await import("node:fs/promises");
    const visit = async (path) => {
      for (const entry of await readdir(resolve(root, path), {
        withFileTypes: true,
      })) {
        const child = `${path}/${entry.name}`;
        if (entry.isDirectory()) await visit(child);
        else if (entry.isFile() && child.endsWith(".ts"))
          discoveredP5Production.push(child);
      }
    };
    await visit(directory);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const allTestPaths = [];
const { readdir } = await import("node:fs/promises");
const scanTests = async (directory) => {
  try {
    for (const entry of await readdir(resolve(root, directory), {
      withFileTypes: true,
    })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) await scanTests(path);
      else if (entry.isFile() && /p5-.*\.test\.mjs$/u.test(path))
        allTestPaths.push(path);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};
await scanTests("tests");
assert(
  canonical([...discoveredP5Production].sort()) ===
    canonical([...scope.productionModules].sort()) &&
    canonical(allTestPaths.sort()) === canonical([...scope.testFiles].sort()),
  "P5_PLAN_DISCOVERY_MISMATCH",
  `discovered paths differ from cumulative P5-${wave} inventory`,
);
assert(
  canonical([...presentProduction].sort()) ===
    canonical([...scope.productionModules].sort()) &&
    canonical([...presentTests].sort()) ===
      canonical([...scope.testFiles].sort()),
  "P5_WAVE_INCOMPLETE",
  `working tree does not contain the exact cumulative P5-${wave} inventory`,
);
validateP5QualityPlan(plan, {
  productionModules: discoveredP5Production,
  testFiles: allTestPaths,
});

const negativeCases = [
  [
    "P5_PLAN_THRESHOLDS",
    (value) => (value.coverage.thresholds.linesPercent = 97),
  ],
  ["P5_PLAN_CAMPAIGNS", (value) => value.faultInjectionIds.pop()],
  ["P5_PLAN_COMPATIBILITY", (value) => value.compatibilityMatrix.pop()],
  [
    "P5_PLAN_BOUNDS_AND_CLAIMS",
    (value) => (value.externalClaims.creationAllowed = true),
  ],
  [
    "P5_PLAN_UNDECLARED_PRODUCTION",
    (value) =>
      (value.productionModules[0] =
        "packages/verifactu/src/persistence/hidden.ts"),
    { productionModules: [plan.productionModules[0]] },
  ],
];
for (const [expected, mutate, discovered] of negativeCases) {
  const candidate = structuredClone(plan);
  mutate(candidate);
  let rejected = false;
  try {
    validateP5QualityPlan(candidate, discovered);
  } catch (error) {
    rejected = error.message.startsWith(`${expected}:`);
  }
  assert(rejected, "P5_PLAN_SEEDED_DEFECT_SURVIVED", expected);
}

const report = {
  schemaVersion: 1,
  planId: plan.id,
  status: "passed",
  stage: `P5-${wave}`,
  cumulative: scope.full,
  productionModules: scope.productionModules.length,
  sharedProductionModules: plan.sharedProductionModules.length,
  testFiles: scope.testFiles.length,
  criticalBranches: scope.criticalMutantIds.length,
  criticalMutants: scope.criticalMutantIds.length,
  otherMutants: scope.otherMutantIds.length,
  propertyExecutions: plan.propertyCampaigns
    .filter((campaign) => scope.propertyIds.includes(campaign.id))
    .reduce((total, campaign) => total + campaign.executions, 0),
  faultInjections: scope.faultIds.length,
  compatibilityCells: plan.compatibilityMatrix.length,
  seededPlanDefectsKilled: negativeCases.length,
  planSha256: createHash("sha256").update(canonical(plan)).digest("hex"),
};
process.stdout.write(`${JSON.stringify(report)}\n`);
