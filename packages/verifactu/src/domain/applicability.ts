// SPDX-License-Identifier: Apache-2.0

import { createDiagnostic, type Diagnostic } from "../diagnostics/diagnostic.js";
import { indeterminate, valid, type ValidationResult } from "../diagnostics/result.js";
import { inspectExactObject } from "../validation/object-inspection.js";

export type DeclaredFact = "yes" | "no" | "unknown";
export type TaxpayerCategory =
  | "corporate-taxpayer"
  | "economic-activity-individual"
  | "nonresident-permanent-establishment"
  | "income-allocation-entity"
  | "outside-article-3-1"
  | "unknown";
export type Territory = "common" | "basque-country" | "navarre" | "unknown";

export interface ApplicabilityFacts {
  readonly usesBillingSystem: DeclaredFact;
  readonly taxpayerCategory: TaxpayerCategory;
  readonly territory: Territory;
  readonly subjectToSii: DeclaredFact;
  readonly operationInScope: DeclaredFact;
  readonly hasNonApplicationResolution: DeclaredFact;
}

export type ApplicabilityFactId = keyof ApplicabilityFacts;

export interface ApplicabilityDecision {
  readonly status: "applicable" | "notApplicable" | "indeterminate";
  readonly evaluatedRuleIds: readonly string[];
  readonly missingFacts: readonly ApplicabilityFactId[];
}

const RULE_IDS = Object.freeze([
  "APP-RD1007-3.1-CATEGORY",
  "APP-RD1007-3.1-TERRITORY",
  "APP-RD1007-3.3-SII",
  "APP-RD1007-4-OPERATION",
  "APP-RD1007-5-RESOLUTION",
  "APP-RD1007-1.2-SIF",
]);
const FACT_KEYS = Object.freeze([
  "usesBillingSystem",
  "taxpayerCategory",
  "territory",
  "subjectToSii",
  "operationInScope",
  "hasNonApplicationResolution",
]);

export function evaluateApplicability(
  input: unknown,
  signal?: AbortSignal,
): ValidationResult<ApplicabilityDecision> {
  if (signal?.aborted === true) return indeterminateDecision("aborted");
  const inspected = inspectExactObject(input, FACT_KEYS);
  if (!inspected.ok) {
    return indeterminate([
      createDiagnostic({
        code: "VF_INPUT_TYPE_INVALID",
        severity: "error",
        phase: "input",
        path: inspected.path,
      }),
    ]);
  }
  const facts = inspected.value;
  if (!validFacts(facts)) {
    return indeterminate([
      createDiagnostic({ code: "VF_INPUT_VALUE_INVALID", severity: "error", phase: "input" }),
    ]);
  }
  const missing = missingFacts(facts);
  if (missing.length > 0) {
    const diagnostics: Diagnostic[] = missing.map((fact) =>
      createDiagnostic({
        code: "VF_APPLICABILITY_FACT_MISSING",
        severity: "warning",
        phase: "applicability",
        path: `/${fact}`,
      }),
    );
    return valid(freezeDecision({ status: "indeterminate", missingFacts: missing }), diagnostics);
  }
  const excluded =
    facts.usesBillingSystem === "no" ||
    facts.taxpayerCategory === "outside-article-3-1" ||
    facts.subjectToSii === "yes" ||
    facts.operationInScope === "no" ||
    facts.hasNonApplicationResolution === "yes" ||
    facts.territory !== "common";
  return valid(
    freezeDecision({
      status: excluded ? "notApplicable" : "applicable",
      missingFacts: Object.freeze([]),
    }),
    excluded
      ? [
          createDiagnostic({
            code: "VF_APPLICABILITY_EXCLUDED",
            severity: "info",
            phase: "applicability",
          }),
        ]
      : [],
  );
}

function validFacts(
  value: Readonly<Record<string, unknown>>,
): value is Readonly<ApplicabilityFacts> {
  return (
    isDeclaredFact(value["usesBillingSystem"]) &&
    isTaxpayerCategory(value["taxpayerCategory"]) &&
    isTerritory(value["territory"]) &&
    isDeclaredFact(value["subjectToSii"]) &&
    isDeclaredFact(value["operationInScope"]) &&
    isDeclaredFact(value["hasNonApplicationResolution"])
  );
}

function missingFacts(value: Readonly<ApplicabilityFacts>): readonly ApplicabilityFactId[] {
  const missing: ApplicabilityFactId[] = [];
  if (value.usesBillingSystem === "unknown") missing.push("usesBillingSystem");
  if (value.taxpayerCategory === "unknown") missing.push("taxpayerCategory");
  if (value.territory === "unknown") missing.push("territory");
  if (value.subjectToSii === "unknown") missing.push("subjectToSii");
  if (value.operationInScope === "unknown") missing.push("operationInScope");
  if (value.hasNonApplicationResolution === "unknown") missing.push("hasNonApplicationResolution");
  return Object.freeze(missing);
}

function freezeDecision(input: {
  readonly status: ApplicabilityDecision["status"];
  readonly missingFacts: readonly ApplicabilityFactId[];
}): ApplicabilityDecision {
  return Object.freeze({
    status: input.status,
    evaluatedRuleIds: RULE_IDS,
    missingFacts: input.missingFacts,
  });
}

function indeterminateDecision(reason: "aborted"): ValidationResult<ApplicabilityDecision> {
  void reason;
  return indeterminate([
    createDiagnostic({ code: "VF_INPUT_ABORTED", severity: "error", phase: "input" }),
  ]);
}

function isDeclaredFact(value: unknown): value is DeclaredFact {
  return value === "yes" || value === "no" || value === "unknown";
}

function isTaxpayerCategory(value: unknown): value is TaxpayerCategory {
  return (
    value === "corporate-taxpayer" ||
    value === "economic-activity-individual" ||
    value === "nonresident-permanent-establishment" ||
    value === "income-allocation-entity" ||
    value === "outside-article-3-1" ||
    value === "unknown"
  );
}

function isTerritory(value: unknown): value is Territory {
  return (
    value === "common" || value === "basque-country" || value === "navarre" || value === "unknown"
  );
}
