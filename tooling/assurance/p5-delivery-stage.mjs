import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const wavePath = resolve(root, "config/quality/p5-delivery-waves.json");
const planPath = resolve(root, "config/quality/p5-quality-plan.json");
const waveManifest = JSON.parse(readFileSync(wavePath, "utf8"));
const fullPlan = JSON.parse(readFileSync(planPath, "utf8"));
const order = ["A", "B", "C", "D", "E", "F", "G"];

function assert(condition, code, detail) {
  if (!condition) throw new Error(`${code}: ${detail}`);
}

function exactPopulation(actual, expected, code) {
  const left = [...actual].sort();
  const right = [...expected].sort();
  assert(
    left.length === right.length &&
      left.every((entry, index) => entry === right[index]),
    code,
    JSON.stringify({ expected: right, actual: left }),
  );
}

const flatten = (key) => order.flatMap((name) => waveManifest.waves[name][key]);

export function validateP5DeliveryWaves(
  plan = fullPlan,
  manifest = waveManifest,
) {
  assert(
    manifest.schemaVersion === 1 &&
      manifest.id === "P5-DELIVERY-WAVES-0001" &&
      manifest.branchPattern === "work/p5-[a-g]" &&
      manifest.baseBranch === "main" &&
      Object.keys(manifest.waves).join(",") === order.join(","),
    "P5_WAVE_MANIFEST_IDENTITY",
    manifest.id,
  );
  for (const [key, expected] of [
    ["productionModules", plan.productionModules],
    ["testFiles", plan.testFiles],
    ["faultIds", plan.faultInjectionIds.map((entry) => entry.split(":", 1)[0])],
    ["propertyIds", plan.propertyCampaigns.map((entry) => entry.id)],
    ["criticalMutantIds", plan.mutation.criticalMutants],
    ["otherMutantIds", plan.mutation.otherMutants],
  ]) {
    const actual = flatten(key);
    assert(new Set(actual).size === actual.length, "P5_WAVE_DUPLICATE", key);
    exactPopulation(actual, expected, `P5_WAVE_CENSUS_${key}`);
  }
  return true;
}

export function resolveP5Wave(env = process.env, fileExists = existsSync) {
  const head = env.GITHUB_HEAD_REF;
  if (head) {
    if (head === "work/p5-implementation") return "G";
    const match = /^work\/p5-([a-g])$/u.exec(head);
    assert(
      match,
      "P5_WAVE_BRANCH",
      `unexpected P5 implementation branch ${head}`,
    );
    assert(
      env.GITHUB_BASE_REF === waveManifest.baseBranch,
      "P5_WAVE_BASE",
      `${head} must target ${waveManifest.baseBranch}`,
    );
    return match[1].toUpperCase();
  }

  const ref = env.GITHUB_REF;
  const pushMatch =
    typeof ref === "string" && /^refs\/heads\/work\/p5-([a-g])$/u.exec(ref);
  if (pushMatch) return pushMatch[1].toUpperCase();

  const prefixExists = (waveName) => {
    const scope = order
      .slice(0, order.indexOf(waveName) + 1)
      .flatMap((name) => [
        ...waveManifest.waves[name].productionModules,
        ...waveManifest.waves[name].testFiles,
      ]);
    return scope.every((path) => fileExists(resolve(root, path)));
  };
  return [...order].reverse().find(prefixExists) ?? "A";
}

export function getP5WaveScope(waveName, plan = fullPlan) {
  validateP5DeliveryWaves(plan);
  const end = order.indexOf(waveName);
  assert(end >= 0, "P5_WAVE_UNKNOWN", waveName);
  const scope = Object.fromEntries(
    [
      "productionModules",
      "testFiles",
      "faultIds",
      "propertyIds",
      "criticalMutantIds",
      "otherMutantIds",
    ].map((key) => [
      key,
      order.slice(0, end + 1).flatMap((name) => waveManifest.waves[name][key]),
    ]),
  );
  scope.sharedProductionModules = plan.sharedProductionModules;
  scope.wave = waveName;
  scope.full = waveName === "G";
  return scope;
}

validateP5DeliveryWaves();
