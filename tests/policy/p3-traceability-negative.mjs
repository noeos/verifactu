#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PolicyFailure, assert, main } from "../../tooling/lib/policy.mjs";
import { validateHistoricalFindings, validateTraceability } from "../../tooling/repository/check-p3-traceability.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function expectCode(id, expectedCode, operation) {
  try {
    await operation();
  } catch (error) {
    assert(error instanceof PolicyFailure, "FIXTURE_WRONG_FAILURE", `${id} produced ${error}`);
    assert(
      error.code === expectedCode,
      "FIXTURE_WRONG_REASON",
      `${id} expected ${expectedCode}; observed ${error.code}`,
    );
    return id;
  }
  throw new PolicyFailure("FIXTURE_UNEXPECTED_PASS", `${id} unexpectedly passed`);
}

async function run() {
  const matrix = JSON.parse(await readFile(path.join(root, "config/regulatory/p3-traceability.json"), "utf8"));
  const sourceIds = new Set(matrix.requirements.flatMap(({ sourceIds: ids }) => ids));
  const blockerIds = new Set(matrix.requirements.flatMap(({ blockerIds: ids }) => ids));
  const existingPaths = new Set(matrix.requirements.flatMap(({ contractPaths }) => contractPaths));
  const taskDocument = JSON.parse(await readFile(path.join(root, "config/tasks/tasks.json"), "utf8"));
  const taskIds = new Set(taskDocument.tasks.map(({ id }) => id));
  const context = { sourceIds, blockerIds, existingPaths, taskIds };
  const passed = [];
  const missingRequirement = structuredClone(matrix);
  missingRequirement.requirements.pop();
  passed.push(
    await expectCode("missing-requirement", "TRACE_REQUIREMENT_COVERAGE", () =>
      validateTraceability(missingRequirement, context),
    ),
  );
  const historical = JSON.parse(
    await readFile(path.join(root, "config/regulatory/p3-historical-findings.json"), "utf8"),
  );
  const historicalContext = {
    blockerIds,
    taskIds: new Set(taskDocument.tasks.map(({ id }) => id)),
  };
  const missingFinding = structuredClone(historical);
  missingFinding.findings.pop();
  passed.push(
    await expectCode("missing-finding", "HISTORICAL_FINDING_COVERAGE", () =>
      validateHistoricalFindings(missingFinding, historicalContext),
    ),
  );
  const falseClosure = structuredClone(historical);
  falseClosure.findings.find(({ id }) => id === "REV-001").disposition = "verified-prevented-p3-scope";
  passed.push(
    await expectCode("false-finding-closure", "HISTORICAL_FINDING_FALSE_CLOSURE", () =>
      validateHistoricalFindings(falseClosure, historicalContext),
    ),
  );
  const openSource = structuredClone(matrix);
  openSource.requirements[0].sourceIds.push("ABSENT-SOURCE");
  passed.push(await expectCode("open-source", "TRACE_SOURCE_OPEN", () => validateTraceability(openSource, context)));
  const openContract = structuredClone(matrix);
  openContract.requirements[0].contractPaths.push("contracts/absent.json");
  passed.push(
    await expectCode("open-contract", "TRACE_CONTRACT_OPEN", () => validateTraceability(openContract, context)),
  );
  const traversingContract = structuredClone(matrix);
  traversingContract.requirements[0].contractPaths[0] = "contracts/../edition.json";
  passed.push(
    await expectCode("traversing-contract", "TRACE_CONTRACT_PATH_INVALID", () =>
      validateTraceability(traversingContract, context),
    ),
  );
  const openControl = structuredClone(matrix);
  openControl.requirements[0].oracleControls.push("oracle:absent");
  passed.push(await expectCode("open-control", "TRACE_CONTROL_OPEN", () => validateTraceability(openControl, context)));
  const waivedBlocker = structuredClone(matrix);
  const blocked = waivedBlocker.requirements.find(({ status }) => status === "blocked");
  blocked.blockerIds = [];
  passed.push(
    await expectCode("waived-blocker", "TRACE_BLOCKED_INCOMPLETE", () => validateTraceability(waivedBlocker, context)),
  );
  const downstreamBlocker = structuredClone(historical);
  downstreamBlocker.findings.find(({ disposition }) => disposition === "adopted-downstream").blockerIds = [
    [...blockerIds][0],
  ];
  passed.push(
    await expectCode("downstream-blocker", "HISTORICAL_FINDING_DOWNSTREAM_BLOCKER", () =>
      validateHistoricalFindings(downstreamBlocker, historicalContext),
    ),
  );
  return { fixtureCount: passed.length, passed };
}

await main("p3-traceability-negative-fixtures", run);
