// SPDX-License-Identifier: Apache-2.0

import { createDiagnostic, type Diagnostic } from "../diagnostics/diagnostic.js";
import {
  aborted,
  indeterminate,
  invalid,
  valid,
  type ValidationResult,
} from "../diagnostics/result.js";
import { AeatDate, Nif } from "../domain/values.js";
import {
  validateFingerprintInput,
  type AltaFingerprintInput,
  type AnulacionFingerprintInput,
} from "../fingerprint/rrsif.js";
import { inspectExactObject } from "./object-inspection.js";

export type TriState = "yes" | "no" | "unknown";
export type RectificationType = "substitution" | "differences" | "none";
export type IssuedBy = "issuer" | "third-party" | "recipient";
export type PriorRecordState = "exists" | "absent" | "unknown";

export interface AltaBusinessFacts {
  readonly taxpayerNif: Nif;
  readonly currentDate: AeatDate;
  readonly rectificationType: RectificationType;
  readonly correctedInvoices: boolean;
  readonly substitutedInvoices: boolean;
  readonly rectificationAmounts: boolean;
  readonly operationDate?: AeatDate;
  readonly simplifiedFlag: boolean;
  readonly unidentifiedRecipientFlag: boolean;
  readonly macrodataFlag: boolean;
  readonly issuedBy: IssuedBy;
  readonly thirdPartyDetails: boolean;
  readonly recipientCount: number;
  readonly taxKind: "01" | "02" | "03" | "05";
  readonly regimeCode: string;
}

export interface ValidatedAltaRecord {
  readonly kind: "alta";
  readonly fingerprint: AltaFingerprintInput;
  readonly facts: AltaBusinessFacts;
  readonly evaluatedRuleIds: readonly string[];
}

export interface AnulacionBusinessFacts {
  readonly taxpayerNif: Nif;
  readonly generatedBy: "issuer" | "third-party" | "recipient" | "none";
  readonly generatorDetails: boolean;
  readonly priorRecord: PriorRecordState;
  readonly withoutPriorRecordFlag: boolean;
}

export interface ValidatedAnulacionRecord {
  readonly kind: "anulacion";
  readonly fingerprint: AnulacionFingerprintInput;
  readonly facts: AnulacionBusinessFacts;
  readonly evaluatedRuleIds: readonly string[];
}

export type ValidatedBillingRecord = ValidatedAltaRecord | ValidatedAnulacionRecord;

const ALTA_KEYS = Object.freeze([
  "kind",
  "fingerprint",
  "taxpayerNif",
  "currentDate",
  "rectificationType",
  "correctedInvoices",
  "substitutedInvoices",
  "rectificationAmounts",
  "operationDate",
  "simplifiedFlag",
  "unidentifiedRecipientFlag",
  "macrodataFlag",
  "issuedBy",
  "thirdPartyDetails",
  "recipientCount",
  "taxKind",
  "regimeCode",
]);
const ANULACION_KEYS = Object.freeze([
  "kind",
  "fingerprint",
  "taxpayerNif",
  "generatedBy",
  "generatorDetails",
  "priorRecord",
  "withoutPriorRecordFlag",
]);
const ALTA_RULE_IDS = Object.freeze([
  "VAL-AEAT-3.1.3-IDFACTURA-ISSUER",
  "VAL-AEAT-3.1.3-IDFACTURA-DATE",
  "VAL-AEAT-3.1.3-RECTIFICATION",
  "VAL-AEAT-3.1.3-SUBSTITUTION",
  "VAL-AEAT-3.1.3-OPERATION-DATE",
  "VAL-AEAT-3.1.3-FLAGS",
  "VAL-AEAT-3.1.3-MACRODATA",
  "VAL-AEAT-3.1.3-ISSUED-BY",
  "VAL-AEAT-3.1.3-RECIPIENTS",
]);
const ANULACION_RULE_IDS = Object.freeze([
  "VAL-AEAT-3.1.4-IDFACTURA-ISSUER",
  "VAL-AEAT-3.1.4-GENERATOR",
  "VAL-AEAT-6.2-PRIOR-RECORD",
]);
const MINIMUM_ISSUE_DATE = requiredDate("28-10-2024");

export function validateBillingRecord(
  input: unknown,
  signal?: AbortSignal,
): ValidationResult<ValidatedBillingRecord> {
  if (signal?.aborted === true) {
    return aborted([
      createDiagnostic({ code: "VF_INPUT_ABORTED", severity: "error", phase: "input" }),
    ]);
  }
  const discriminated = inspectExactObject(
    input,
    ["kind"],
    [...ALTA_KEYS.slice(1), ...ANULACION_KEYS.slice(1)],
  );
  if (!discriminated.ok) return invalidInput(discriminated.path);
  if (discriminated.value["kind"] === "alta") return validateAltaRecord(input);
  if (discriminated.value["kind"] === "anulacion") return validateAnulacionRecord(input);
  return invalidInput("/kind");
}

function validateAltaRecord(input: unknown): ValidationResult<ValidatedAltaRecord> {
  const object = inspectExactObject(
    input,
    ALTA_KEYS.filter((key) => key !== "operationDate"),
    ["operationDate"],
  );
  if (!object.ok) return invalidInput(object.path);
  const fingerprintResult = validateFingerprintInput(object.value["fingerprint"]);
  const taxpayerNif = Nif.parse(object.value["taxpayerNif"]);
  const currentDate = AeatDate.parse(object.value["currentDate"]);
  const operationDate = AeatDate.parse(object.value["operationDate"]);
  if (
    fingerprintResult.status !== "valid" ||
    fingerprintResult.value.kind !== "alta" ||
    taxpayerNif === undefined ||
    currentDate === undefined ||
    (object.value["operationDate"] !== undefined && operationDate === undefined) ||
    !isRectificationType(object.value["rectificationType"]) ||
    !isBooleanFields(object.value, [
      "correctedInvoices",
      "substitutedInvoices",
      "rectificationAmounts",
      "simplifiedFlag",
      "unidentifiedRecipientFlag",
      "macrodataFlag",
      "thirdPartyDetails",
    ]) ||
    !isIssuedBy(object.value["issuedBy"]) ||
    !isRecipientCount(object.value["recipientCount"]) ||
    !isTaxKind(object.value["taxKind"]) ||
    !isRegimeCode(object.value["regimeCode"])
  ) {
    return invalidInput("");
  }
  const fingerprint = fingerprintResult.value;
  const facts: AltaBusinessFacts = Object.freeze({
    taxpayerNif,
    currentDate,
    rectificationType: object.value["rectificationType"],
    correctedInvoices: object.value.correctedInvoices,
    substitutedInvoices: object.value.substitutedInvoices,
    rectificationAmounts: object.value.rectificationAmounts,
    ...(operationDate === undefined ? {} : { operationDate }),
    simplifiedFlag: object.value.simplifiedFlag,
    unidentifiedRecipientFlag: object.value.unidentifiedRecipientFlag,
    macrodataFlag: object.value.macrodataFlag,
    issuedBy: object.value["issuedBy"],
    thirdPartyDetails: object.value.thirdPartyDetails,
    recipientCount: object.value["recipientCount"],
    taxKind: object.value["taxKind"],
    regimeCode: object.value["regimeCode"],
  });
  const diagnostics = altaRuleDiagnostics(fingerprint, facts);
  return diagnostics.length === 0
    ? valid(Object.freeze({ kind: "alta", fingerprint, facts, evaluatedRuleIds: ALTA_RULE_IDS }))
    : invalid(diagnostics);
}

function validateAnulacionRecord(input: unknown): ValidationResult<ValidatedAnulacionRecord> {
  const object = inspectExactObject(input, ANULACION_KEYS);
  if (!object.ok) return invalidInput(object.path);
  const fingerprintResult = validateFingerprintInput(object.value["fingerprint"]);
  const taxpayerNif = Nif.parse(object.value["taxpayerNif"]);
  if (
    fingerprintResult.status !== "valid" ||
    fingerprintResult.value.kind !== "anulacion" ||
    taxpayerNif === undefined ||
    !isGeneratedBy(object.value["generatedBy"]) ||
    typeof object.value["generatorDetails"] !== "boolean" ||
    !isPriorRecordState(object.value["priorRecord"]) ||
    typeof object.value["withoutPriorRecordFlag"] !== "boolean"
  ) {
    return invalidInput("");
  }
  const fingerprint = fingerprintResult.value;
  const facts: AnulacionBusinessFacts = Object.freeze({
    taxpayerNif,
    generatedBy: object.value["generatedBy"],
    generatorDetails: object.value["generatorDetails"],
    priorRecord: object.value["priorRecord"],
    withoutPriorRecordFlag: object.value["withoutPriorRecordFlag"],
  });
  const diagnostics: Diagnostic[] = [];
  if (fingerprint.issuerNif.value !== taxpayerNif.value)
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.4-IDFACTURA-ISSUER", "/fingerprint/issuerNif"));
  if ((facts.generatedBy === "none") === facts.generatorDetails)
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.4-GENERATOR", "/generatorDetails"));
  if (facts.priorRecord === "unknown") {
    return indeterminate([
      createDiagnostic({
        code: "VF_RECORD_EXTERNAL_FACT_MISSING",
        severity: "warning",
        phase: "record",
        path: "/priorRecord",
        ruleId: "VAL-AEAT-6.2-PRIOR-RECORD",
      }),
    ]);
  }
  if (facts.withoutPriorRecordFlag !== (facts.priorRecord === "absent"))
    diagnostics.push(ruleFailure("VAL-AEAT-6.2-PRIOR-RECORD", "/withoutPriorRecordFlag"));
  return diagnostics.length === 0
    ? valid(
        Object.freeze({
          kind: "anulacion",
          fingerprint,
          facts,
          evaluatedRuleIds: ANULACION_RULE_IDS,
        }),
      )
    : invalid(diagnostics);
}

function altaRuleDiagnostics(
  fingerprint: AltaFingerprintInput,
  facts: AltaBusinessFacts,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const type = fingerprint.invoiceType;
  const rectifying = type.startsWith("R");
  if (fingerprint.issuerNif.value !== facts.taxpayerNif.value)
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.3-IDFACTURA-ISSUER", "/fingerprint/issuerNif"));
  if (
    fingerprint.issueDate.compare(MINIMUM_ISSUE_DATE) < 0 ||
    fingerprint.issueDate.compare(facts.currentDate) > 0
  )
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.3-IDFACTURA-DATE", "/fingerprint/issueDate"));
  if (
    rectifying !== (facts.rectificationType !== "none") ||
    (facts.correctedInvoices && !rectifying)
  )
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.3-RECTIFICATION", "/rectificationType"));
  if (facts.substitutedInvoices !== (type === "F3"))
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.3-SUBSTITUTION", "/substitutedInvoices"));
  if (facts.rectificationAmounts !== (facts.rectificationType === "substitution"))
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.3-RECTIFICATION", "/rectificationAmounts"));
  if (
    facts.operationDate !== undefined &&
    (facts.operationDate.year < facts.currentDate.year - 20 ||
      facts.operationDate.year > facts.currentDate.year + 1 ||
      ((facts.taxKind === "01" || facts.taxKind === "03") &&
        fingerprint.issueDate.compare(facts.operationDate) < 0 &&
        facts.regimeCode !== "14" &&
        facts.regimeCode !== "15"))
  )
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.3-OPERATION-DATE", "/operationDate"));
  if (facts.simplifiedFlag && !["F1", "F3", "R1", "R2", "R3", "R4"].includes(type))
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.3-FLAGS", "/simplifiedFlag"));
  if (facts.unidentifiedRecipientFlag && type !== "F2" && type !== "R5")
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.3-FLAGS", "/unidentifiedRecipientFlag"));
  if (fingerprint.totalAmount.compareAbsoluteInteger(10_000_000_000n) >= 0 !== facts.macrodataFlag)
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.3-MACRODATA", "/macrodataFlag"));
  if ((facts.issuedBy === "third-party") !== facts.thirdPartyDetails)
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.3-ISSUED-BY", "/thirdPartyDetails"));
  const recipientsRequired = ["F1", "F3", "R1", "R2", "R3", "R4"].includes(type);
  if (
    (recipientsRequired && facts.recipientCount === 0) ||
    (!recipientsRequired && facts.recipientCount > 0)
  )
    diagnostics.push(ruleFailure("VAL-AEAT-3.1.3-RECIPIENTS", "/recipientCount"));
  return diagnostics;
}

function ruleFailure(ruleId: string, path: string): Diagnostic {
  return createDiagnostic({
    code: "VF_RECORD_RULE_FAILED",
    severity: "error",
    phase: "record",
    ruleId,
    path,
  });
}

function invalidInput<T>(path: string): ValidationResult<T> {
  return invalid([
    createDiagnostic({
      code: "VF_INPUT_VALUE_INVALID",
      severity: "error",
      phase: "input",
      ...(path.length === 0 ? {} : { path }),
    }),
  ]);
}

function isBooleanFields<const T extends string>(
  value: Readonly<Record<string, unknown>>,
  fields: readonly T[],
): value is Readonly<Record<string, unknown>> & Readonly<Record<T, boolean>> {
  return fields.every((field) => typeof value[field] === "boolean");
}

function isRectificationType(value: unknown): value is RectificationType {
  return value === "substitution" || value === "differences" || value === "none";
}

function isIssuedBy(value: unknown): value is IssuedBy {
  return value === "issuer" || value === "third-party" || value === "recipient";
}

function isGeneratedBy(value: unknown): value is AnulacionBusinessFacts["generatedBy"] {
  return isIssuedBy(value) || value === "none";
}

function isRecipientCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 1_000;
}

function isTaxKind(value: unknown): value is AltaBusinessFacts["taxKind"] {
  return value === "01" || value === "02" || value === "03" || value === "05";
}

function isRegimeCode(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}$/u.test(value);
}

function isPriorRecordState(value: unknown): value is PriorRecordState {
  return value === "exists" || value === "absent" || value === "unknown";
}

function requiredDate(value: string): AeatDate {
  const parsed = AeatDate.parse(value);
  if (parsed === undefined) throw new Error("invalid embedded regulatory date");
  return parsed;
}
