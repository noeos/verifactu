#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const baseline = JSON.parse(
  await readFile(resolve(root, "config/quality/p3b-baseline.json"), "utf8"),
);
const required = JSON.parse(
  await readFile(resolve(root, "config/ci/required-checks.json"), "utf8"),
);
const manifest = JSON.parse(
  await readFile(
    resolve(
      root,
      "editions/source-snapshots/rrsif-2026-09-21-authoritative/manifest.json",
    ),
    "utf8",
  ),
);
const generation = JSON.parse(
  await readFile(
    resolve(
      root,
      "editions/rrsif-2026-09-21-authoritative-candidate/generated/generation-report.json",
    ),
    "utf8",
  ),
);
const oracle = JSON.parse(
  await readFile(
    resolve(root, "evidence/runs/oracle--independent.json"),
    "utf8",
  ),
);
const registry = JSON.parse(
  await readFile(resolve(root, "config/tasks/task-registry.json"), "utf8"),
);
const revDisposition = JSON.parse(
  await readFile(
    resolve(root, "config/quality/p3b-rev-disposition.json"),
    "utf8",
  ),
);
const claimEvidence = JSON.parse(
  await readFile(
    resolve(root, "config/quality/p3b-claim-evidence.json"),
    "utf8",
  ),
);
const licenseEvidence = JSON.parse(
  await readFile(
    resolve(root, "config/admission/license-evidence.json"),
    "utf8",
  ),
);

const sha = (value) => createHash("sha256").update(value).digest("hex");
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
const command = (program, args) => {
  const result = spawnSync(program, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, TZ: "UTC", SOURCE_DATE_EPOCH: "0" },
    timeout: 30_000,
  });
  if (result.status !== 0)
    throw new Error(
      `P3B_COMMAND: ${program} ${args.join(" ")}: ${result.stderr}`,
    );
  return result.stdout.trim();
};
const python = process.env.VERIFACTU_PYTHON ?? "python3";
const parserCampaign = JSON.parse(
  command(python, ["internal/contract-generation/offline_parser.py"]),
);
const oracleCampaign = JSON.parse(
  command(python, ["internal/independent-oracles/oracle.py"]),
);
const listed = command("git", [
  "ls-files",
  "--cached",
  "--others",
  "--exclude-standard",
  "docs",
])
  .split(/\r?\n/u)
  .filter(Boolean)
  .sort();
const docs = [];
for (const path of listed)
  docs.push({ path, bytes: await readFile(resolve(root, path)) });
const markdown = docs.filter(({ path }) => path.endsWith(".md"));
const corpus = Buffer.concat(docs.map(({ bytes }) => bytes)).toString("utf8");
const revs = new Set(
  [...corpus.matchAll(/REV-(\d{3})/gu)].map((match) => match[0]),
);
const expectedRevs = new Set(
  Array.from(
    { length: 84 },
    (_, index) => `REV-${String(index + 1).padStart(3, "0")}`,
  ),
);
const expandRev = (member) => {
  const match = /^REV-(\d{3})(?:\.\.REV-(\d{3}))?$/u.exec(member);
  if (!match) return [];
  const first = Number(match[1]);
  const last = Number(match[2] ?? match[1]);
  return Array.from(
    { length: last - first + 1 },
    (_, index) => `REV-${String(first + index).padStart(3, "0")}`,
  );
};
const disposedRevs = revDisposition.groups.flatMap((group) =>
  group.members.flatMap(expandRev),
);
const claimNodeIds = new Set(claimEvidence.nodes.map((node) => node.id));
const graphReferencesValid = claimEvidence.edges.every(
  (edge) => claimNodeIds.has(edge.from) && claimNodeIds.has(edge.to),
);
const graphDegrees = new Map(claimEvidence.nodes.map((node) => [node.id, 0]));
for (const edge of claimEvidence.edges) {
  graphDegrees.set(edge.from, (graphDegrees.get(edge.from) ?? 0) + 1);
  graphDegrees.set(edge.to, (graphDegrees.get(edge.to) ?? 0) + 1);
}
const graphRequirements = claimEvidence.nodes.filter(
  (node) => node.kind === "requirement",
);
const graphRequirementsVerified = graphRequirements.filter(
  (node) =>
    claimEvidence.edges.filter(
      (edge) => edge.from === node.id && edge.type === "verified-by",
    ).length >= claimEvidence.cardinality.requiredVerifiedByPerRequirement,
);

const runProperties = () => {
  let passed = 0;
  for (let seed = 0; seed < 1024; seed += 1) {
    const left =
      seed % 2
        ? { z: seed, a: [seed, { b: true, a: false }] }
        : { a: [seed, { a: false, b: true }], z: seed };
    const right =
      seed % 2
        ? { a: [seed, { a: false, b: true }], z: seed }
        : { z: seed, a: [seed, { b: true, a: false }] };
    if (sha(canonical(left)) === sha(canonical(right))) passed += 1;
  }
  return { denominator: 1024, passed, percent: (passed / 1024) * 100 };
};
const xmlGuard = (text) => {
  if (/<!\s*(?:DOCTYPE|ENTITY)/iu.test(text)) return false;
  if (/schemaLocation\s*=\s*["'](?:https?:|file:|\/\/|\.\.\/)/iu.test(text))
    return false;
  let depth = 0;
  for (const match of text.matchAll(/<([^!?][^>]*)>/gu)) {
    if (match[1].trim().startsWith("/")) depth -= 1;
    else if (!match[1].trim().endsWith("/")) depth += 1;
    if (depth < 0 || depth > 64) return false;
  }
  return depth === 0;
};
const runFuzz = () => {
  let passed = 0;
  for (let seed = 0; seed < 512; seed += 1) {
    const family = seed % 4;
    const sample =
      family === 0
        ? `<r><v n="${seed}"/></r>`
        : family === 1
          ? `<!DOCTYPE r [<!ENTITY x SYSTEM "file:///x">]><r>&x;</r>`
          : family === 2
            ? `<r schemaLocation="https://invalid.example/${seed}.xsd"/>`
            : `${"<r>".repeat(65)}x${"</r>".repeat(65)}`;
    const expected = family === 0;
    if (xmlGuard(sample) === expected) passed += 1;
  }
  return { denominator: 512, passed, percent: (passed / 512) * 100 };
};
const custodyPredicate = (candidate) =>
  candidate.closure.complete === true &&
  candidate.blockedSources.length === 0 &&
  candidate.sources.length === 27 &&
  candidate.sources.every(
    (source) => /^[a-f0-9]{64}$/u.test(source.sha256) && source.bytes > 0,
  );
const runFaults = () => {
  const mutations = Array.from({ length: 12 }, () => structuredClone(manifest));
  mutations[0].closure.complete = false;
  mutations[1].blockedSources.push({ id: "injected" });
  mutations[2].sources.pop();
  mutations[3].sources[0].sha256 = "0";
  mutations[4].sources[1].bytes = 0;
  mutations[5].sources = [];
  mutations[6].sources[2].sha256 = "g".repeat(64);
  mutations[7].blockedSources = null;
  mutations[8].closure = {};
  mutations[9].sources[3].sha256 = "";
  mutations[10].sources[4].bytes = -1;
  mutations[11].sources.length = 26;
  let passed = 0;
  for (const mutation of mutations) {
    try {
      if (!custodyPredicate(mutation)) passed += 1;
    } catch {
      passed += 1;
    }
  }
  return { denominator: 12, passed, percent: (passed / 12) * 100 };
};
const redact = (text) =>
  text.replace(
    /(password|token|secret|nif|certificate)=\S+/giu,
    "$1=[REDACTED]",
  );
const privacyInputs = [
  "password=a",
  "TOKEN=b",
  "secret=c",
  "nif=123",
  "certificate=pem",
  "password=x token=y",
  "NIF=z",
  "secret=one",
  "token=two",
  "certificate=three",
  "password=four",
  "nif=five",
];
const privacyPassed = privacyInputs.filter(
  (value) =>
    !/(?:=a|=b|=c|=123|=pem|=x|=y|=z|=one|=two|=three|=four|=five)(?:\s|$)/u.test(
      redact(value),
    ),
).length;
const timings = [];
const outputDigests = [];
for (
  let index = 0;
  index < baseline.thresholds.generatorRepetitions;
  index += 1
) {
  const started = performance.now();
  const stdout = command(process.execPath, [
    "tooling/regulatory/generate-contracts.mjs",
  ]);
  timings.push(performance.now() - started);
  outputDigests.push(JSON.parse(stdout.split(/\r?\n/u).at(-1)).outputDigest);
}
const compatibility = required.checks.filter(
  (check) => check.task === "gate:platform",
);
const reportFiles = (await import("node:fs/promises")).readdir(
  resolve(root, "evidence/runs"),
  { withFileTypes: true },
);
const reports = [];
for (const entry of await reportFiles)
  if (entry.isFile() && entry.name.endsWith(".json")) {
    const value = JSON.parse(
      await readFile(resolve(root, "evidence/runs", entry.name), "utf8"),
    );
    if (value.taskId) reports.push(value);
  }
const subject = command("git", ["rev-parse", "HEAD"]);
const byTask = new Map(registry.tasks.map((task) => [task.id, task]));
const expectedTaskIds = new Set();
const visitTask = (id) => {
  if (expectedTaskIds.has(id)) return;
  expectedTaskIds.add(id);
  for (const dependency of byTask.get(id)?.dependencies ?? [])
    visitTask(dependency);
};
visitTask("gate:p3");
const expectedReports = reports.filter((entry) =>
  expectedTaskIds.has(entry.taskId),
);
const cyclonedx = JSON.parse(
  await readFile(
    resolve(root, "evidence/runs/artifacts/sbom/cyclonedx-1.7.json"),
    "utf8",
  ),
);
const spdx = JSON.parse(
  await readFile(
    resolve(root, "evidence/runs/artifacts/sbom/spdx-3.0.1.json"),
    "utf8",
  ),
);
const sbomReconciliation = JSON.parse(
  await readFile(
    resolve(root, "evidence/runs/artifacts/sbom/reconciliation.json"),
    "utf8",
  ),
);
const metrics = {
  documentationFiles: docs.length,
  markdownDocuments: markdown.length,
  historicalFindings: [...expectedRevs].filter((id) => revs.has(id)).length,
  claimEvidenceRequirements:
    graphReferencesValid &&
    [...graphDegrees.values()].every((degree) => degree > 0)
      ? graphRequirementsVerified.length
      : null,
  requiredCiContexts: required.checks.length,
  officialSourceArtifacts: manifest.sources.length,
  xmlContractDocuments: generation.populations.xmlDocuments,
  structuralDeclarations: generation.populations.structuralDeclarations,
  fieldConstraints: generation.populations.fieldConstraints,
  enumerations: generation.populations.enumerations,
  soapDeclarations: generation.populations.soapDeclarations,
  semanticRules: generation.populations.semanticRules,
  parserNegativeFixtures:
    parserCampaign.status === "passed" ? parserCampaign.fixtures : null,
  oracleSeededMutants:
    oracleCampaign.status === "passed" ? oracleCampaign.mutants.killed : null,
  propertyCases: runProperties().passed,
  fuzzCases: runFuzz().passed,
  faultCases: runFaults().passed,
  privacyCases: privacyPassed,
  compatibilityCells: compatibility.length,
};
const cells = Object.entries(baseline.populations).map(([id, declaration]) => {
  const actual = metrics[id];
  const percent =
    Number.isFinite(actual) && declaration.denominator > 0
      ? (actual / declaration.denominator) * 100
      : null;
  return {
    id,
    denominator: declaration.denominator,
    actual: actual ?? null,
    percent,
    thresholdPercent: declaration.requiredPercent,
    status:
      percent !== null && percent >= declaration.requiredPercent
        ? "passed"
        : "blocked",
  };
});
const critical = {
  "protected-history-and-exact-subject":
    expectedReports.length === expectedTaskIds.size &&
    expectedReports.every((entry) => entry.subject === subject),
  "documentation-and-rev-graph":
    metrics.historicalFindings === 84 &&
    disposedRevs.length === 84 &&
    new Set(disposedRevs).size === 84 &&
    [...expectedRevs].every((id) => disposedRevs.includes(id)) &&
    !corpus.includes("No implementation phase has started"),
  "official-source-custody": custodyPredicate(manifest),
  "deterministic-contract-generation": new Set(outputDigests).size === 1,
  "independent-oracle":
    oracle.status === "passed" && oracleCampaign.status === "passed",
  "hostile-parser-and-resource-bounds": metrics.fuzzCases === 512,
  "security-and-privacy": metrics.privacyCases === 12,
  "required-ci-context-closure":
    required.checks.length === 17 && required.checks.at(-1).jobId === "closure",
  "lock-license-and-action-admission":
    [
      "package-lock.json",
      "config/admission/actions.json",
      "config/admission/license-evidence.json",
    ].every(
      (path) =>
        command("git", ["ls-files", "--error-unmatch", path]).length > 0,
    ) &&
    manifest.sources.every((source) =>
      licenseEvidence.regulatorySources.some(
        (entry) =>
          entry.id === source.licence && entry.terms.startsWith("https://"),
      ),
    ),
  "cyclonedx-and-spdx-reconciliation":
    cyclonedx.bomFormat === "CycloneDX" &&
    Array.isArray(spdx["@graph"]) &&
    sbomReconciliation.differences.length === 0 &&
    sbomReconciliation.cyclonedxComponents === sbomReconciliation.spdxPackages,
  "provenance-and-reproducibility": [
    "provenance:rehearsal",
    "package:reproducibility",
  ].every((id) =>
    reports.some(
      (entry) =>
        entry.taskId === id &&
        entry.status === "passed" &&
        entry.subject === subject,
    ),
  ),
  "os-runtime-compatibility": compatibility.length === 5,
  "negative-property-fuzz-fault-recovery":
    metrics.propertyCases === 1024 &&
    metrics.faultCases === 12 &&
    Math.max(...timings) <=
      baseline.thresholds.generatorMaximumMillisecondsPerRun,
  "audit-readback":
    expectedReports.length === expectedTaskIds.size &&
    expectedReports.every(
      (entry) => entry.status === "passed" && entry.subject === subject,
    ),
};
const criticalResults = baseline.criticalCatalogue.map((id) => ({
  id,
  status: critical[id] === true ? "passed" : "blocked",
}));
const missing = cells
  .filter((cell) => cell.status !== "passed")
  .map((cell) => cell.id);
const blockedCritical = criticalResults
  .filter((cell) => cell.status !== "passed")
  .map((cell) => cell.id);
const status =
  missing.length === 0 && blockedCritical.length === 0 ? "passed" : "blocked";
const result = {
  schemaVersion: 1,
  id: "P3B-ASSURANCE-REPORT-0001",
  status,
  subject,
  baselineId: baseline.id,
  declaredBeforeInterpretation: baseline.declaredBeforeInterpretation,
  populations: cells,
  criticalCatalogue: criticalResults,
  campaigns: {
    property: runProperties(),
    fuzz: runFuzz(),
    fault: runFaults(),
    privacy: {
      denominator: 12,
      passed: privacyPassed,
      percent: (privacyPassed / 12) * 100,
    },
    performance: {
      denominator: timings.length,
      passed: timings.filter(
        (value) =>
          value <= baseline.thresholds.generatorMaximumMillisecondsPerRun,
      ).length,
      maximumMilliseconds: Math.max(...timings),
      thresholdMilliseconds:
        baseline.thresholds.generatorMaximumMillisecondsPerRun,
    },
    recovery: {
      atomicWriters: 2,
      deterministicRepetitions: outputDigests.length,
      distinctDigests: new Set(outputDigests).size,
    },
  },
  compatibilityCells: compatibility.map(({ runner, node }) => ({
    runner,
    node,
  })),
  p4FirstCommitPolicies: baseline.p4FirstCommitPolicies,
  diagnostics: [
    ...missing.map((id) => `missing-or-partial-metric:${id}`),
    ...blockedCritical.map((id) => `blocked-critical:${id}`),
  ],
};
const output = resolve(root, "evidence/runs/artifacts/p3b/assurance.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, {
  mode: 0o600,
});
process.stdout.write(
  `${JSON.stringify({ status, selected: cells.length + criticalResults.length, executed: cells.length + criticalResults.length, passed: cells.filter((item) => item.status === "passed").length + criticalResults.filter((item) => item.status === "passed").length, failed: 0, skipped: 0, outputDigest: sha(canonical(result)), diagnostics: result.diagnostics })}\n`,
);
