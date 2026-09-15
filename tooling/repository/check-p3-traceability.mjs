#!/usr/bin/env node
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, stableJson, validateJsonFile } from "../lib/policy.mjs";

const REQUIRED_P3_REQUIREMENTS = [
  "REG-0010",
  "REG-0011",
  "REG-0012",
  "REG-0016",
  "REG-0017",
  "REG-0018",
  "REG-0021",
  "REG-0023",
  "REG-0025",
  "REG-0030",
  "REG-0031",
  "REG-0070",
  "REG-0071",
  "REG-0072",
  "SEC-0010",
  "SEC-0011",
  "SEC-0012",
  "SEC-0016",
  "SEC-0070",
];
const REQUIRED_P3_FINDINGS = ["REV-001", "REV-002", "REV-003", "REV-004", "REV-005", "REV-006", "REV-008", "REV-019"];

const CONTRACT_PATH =
  /^(edition\.json|contracts\/[A-Za-z0-9][A-Za-z0-9._-]*\.json|schemas\/[A-Za-z0-9][A-Za-z0-9._-]*\.json)$/;

export function validateTraceability(matrix, { sourceIds, blockerIds, existingPaths, taskIds }) {
  const ids = matrix.requirements.map(({ id }) => id);
  assert(new Set(ids).size === ids.length, "TRACE_REQUIREMENT_DUPLICATE", "a requirement is mapped more than once");
  assert(
    stableJson([...ids].sort()) === stableJson(REQUIRED_P3_REQUIREMENTS),
    "TRACE_REQUIREMENT_COVERAGE",
    "P3 requirement coverage is incomplete or contains an unreviewed claim",
  );
  for (const entry of matrix.requirements) {
    assert(entry.sourceIds.length > 0, "TRACE_SOURCE_EMPTY", `${entry.id} has no source authority`);
    assert(entry.contractPaths.length > 0, "TRACE_CONTRACT_EMPTY", `${entry.id} has no contract`);
    assert(entry.oracleControls.length > 0, "TRACE_EVIDENCE_EMPTY", `${entry.id} has no executable control`);
    for (const sourceId of entry.sourceIds) {
      assert(sourceIds.has(sourceId), "TRACE_SOURCE_OPEN", `${entry.id} references absent ${sourceId}`);
    }
    for (const blockerId of entry.blockerIds) {
      assert(blockerIds.has(blockerId), "TRACE_BLOCKER_OPEN", `${entry.id} references absent ${blockerId}`);
    }
    for (const contractPath of entry.contractPaths) {
      assert(CONTRACT_PATH.test(contractPath), "TRACE_CONTRACT_PATH_INVALID", `${entry.id} uses ${contractPath}`);
      assert(existingPaths.has(contractPath), "TRACE_CONTRACT_OPEN", `${entry.id} references absent ${contractPath}`);
    }
    for (const control of entry.oracleControls) {
      assert(taskIds.has(control), "TRACE_CONTROL_OPEN", `${entry.id} references absent ${control}`);
    }
    if (entry.status === "blocked") {
      assert(
        entry.blockerIds.length > 0 && entry.nextPhase,
        "TRACE_BLOCKED_INCOMPLETE",
        `${entry.id} has no blocker or continuation`,
      );
    }
    if (entry.status === "downstream") {
      assert(entry.nextPhase, "TRACE_DOWNSTREAM_INCOMPLETE", `${entry.id} has no downstream phase`);
    }
  }
  return { requirementCount: ids.length };
}

export function validateHistoricalFindings(register, { blockerIds, taskIds }) {
  const ids = register.findings.map(({ id }) => id);
  assert(
    new Set(ids).size === ids.length,
    "HISTORICAL_FINDING_DUPLICATE",
    "a P3 finding is dispositioned more than once",
  );
  assert(
    stableJson([...ids].sort()) === stableJson(REQUIRED_P3_FINDINGS),
    "HISTORICAL_FINDING_COVERAGE",
    "P3 historical finding coverage is incomplete or contains an unreviewed finding",
  );
  for (const finding of register.findings) {
    for (const control of finding.controls) {
      assert(taskIds.has(control), "HISTORICAL_FINDING_CONTROL_OPEN", `${finding.id} references absent ${control}`);
    }
    for (const blockerId of finding.blockerIds) {
      assert(
        blockerIds.has(blockerId),
        "HISTORICAL_FINDING_BLOCKER_OPEN",
        `${finding.id} references absent ${blockerId}`,
      );
    }
    if (finding.disposition === "verified-prevented-p3-scope") {
      assert(
        finding.id === "REV-006" &&
          finding.controls.length >= 3 &&
          finding.blockerIds.length === 0 &&
          finding.continuation === null,
        "HISTORICAL_FINDING_FALSE_CLOSURE",
        `${finding.id} is not eligible for P3-scoped verified prevention`,
      );
    } else {
      assert(finding.continuation, "HISTORICAL_FINDING_CONTINUATION_OPEN", `${finding.id} has no continuation`);
    }
    if (finding.disposition === "adopted-blocked") {
      assert(finding.blockerIds.length > 0, "HISTORICAL_FINDING_BLOCKER_MISSING", `${finding.id} has no blocker`);
    }
    if (finding.disposition === "adopted-downstream") {
      assert(
        finding.blockerIds.length === 0,
        "HISTORICAL_FINDING_DOWNSTREAM_BLOCKER",
        `${finding.id} claims a blocker`,
      );
    }
  }
  return { historicalFindingCount: ids.length };
}

export async function checkP3Traceability(root) {
  const matrix = await validateJsonFile(
    root,
    "config/regulatory/p3-traceability.json",
    "config/regulatory/p3-traceability.schema.json",
  );
  const plan = JSON.parse(await readFile(path.join(root, "config/regulatory/source-plan.json"), "utf8"));
  const generation = JSON.parse(await readFile(path.join(root, "config/regulatory/contract-generation.json"), "utf8"));
  const historical = await validateJsonFile(
    root,
    "config/regulatory/p3-historical-findings.json",
    "config/regulatory/p3-historical-findings.schema.json",
  );
  const tasks = JSON.parse(await readFile(path.join(root, "config/tasks/tasks.json"), "utf8"));
  assert(
    matrix.sourceSnapshotId === generation.sourceSnapshotId,
    "TRACE_SNAPSHOT_MISMATCH",
    "traceability snapshot differs",
  );
  assert(
    matrix.candidateEditionId === generation.candidateEditionId,
    "TRACE_EDITION_MISMATCH",
    "traceability edition differs",
  );
  const sourceIds = new Set(plan.sources.map(({ id }) => id));
  const blockerIds = new Set(plan.blockedSources.map(({ id }) => id));
  const referencedRequirements = new Set(
    [...plan.sources, ...plan.blockedSources].flatMap(({ requiredFor }) => requiredFor),
  );
  const existingPaths = new Set();
  for (const entry of matrix.requirements) {
    for (const contractPath of entry.contractPaths) {
      assert(CONTRACT_PATH.test(contractPath), "TRACE_CONTRACT_PATH_INVALID", `${entry.id} uses ${contractPath}`);
      const absolute = contractPath.startsWith("schemas/")
        ? path.join(root, contractPath)
        : path.join(root, "editions", matrix.candidateEditionId, contractPath);
      const stat = await lstat(absolute).catch(() => null);
      assert(stat?.isFile() && !stat.isSymbolicLink(), "TRACE_CONTRACT_UNSAFE", `${contractPath} is absent or unsafe`);
      existingPaths.add(contractPath);
    }
  }
  const taskIds = new Set(tasks.tasks.map(({ id }) => id));
  const validated = validateTraceability(matrix, {
    sourceIds,
    blockerIds,
    existingPaths,
    taskIds,
  });
  assert(
    historical.subject === matrix.candidateEditionId,
    "HISTORICAL_FINDING_SUBJECT_MISMATCH",
    "finding subject differs",
  );
  const historicalValidated = validateHistoricalFindings(historical, {
    blockerIds,
    taskIds,
  });
  for (const entry of matrix.requirements.filter(({ status }) => ["enforced", "blocked"].includes(status))) {
    assert(
      referencedRequirements.has(entry.id) ||
        ["REG-0012", "REG-0016", "REG-0031", "REG-0070", "SEC-0010", "SEC-0016", "SEC-0070"].includes(entry.id),
      "TRACE_REQUIREMENT_SOURCE_GAP",
      `${entry.id} has no source-plan coverage or explicit engineering-control classification`,
    );
  }
  return {
    ...validated,
    ...historicalValidated,
    acquiredSourceCount: sourceIds.size,
    blockedSourceCount: blockerIds.size,
    sourcePlanRequirementCount: referencedRequirements.size,
    statuses: Object.fromEntries(
      ["enforced", "preventive", "blocked", "downstream"].map((status) => [
        status,
        matrix.requirements.filter((entry) => entry.status === status).length,
      ]),
    ),
    creationAllowed: false,
    historicalFindingDispositions: Object.fromEntries(
      ["verified-prevented-p3-scope", "adopted-blocked", "adopted-downstream"].map((disposition) => [
        disposition,
        historical.findings.filter((finding) => finding.disposition === disposition).length,
      ]),
    ),
  };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main("p3-requirement-contract-oracle-traceability", () => checkP3Traceability(root));
}
