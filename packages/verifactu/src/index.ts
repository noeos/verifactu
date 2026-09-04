// SPDX-License-Identifier: Apache-2.0

import { createDiagnostic, type Diagnostic } from "./diagnostics/diagnostic.js";
import { failure, success, type Result } from "./diagnostics/result.js";
import { deepFreeze } from "./domain/immutable.js";
import { editionInfo as generatedEditionInfo } from "./generated/edition.js";

export type EditionId = string & { readonly __brand: "NoeosEditionId" };
export type EditionInfo = typeof generatedEditionInfo;
export {
  VERIFACTU_DIAGNOSTIC_SCHEMA,
  type DiagnosticCode,
  type DiagnosticDetail,
  type DiagnosticPhase,
  type DiagnosticSeverity,
  type Diagnostic,
} from "./diagnostics/diagnostic.js";
export type {
  Result,
  ValidationResult,
  VerifactuError,
  VerifactuErrorCode,
} from "./diagnostics/result.js";
export {
  evaluateApplicability,
  type ApplicabilityFactId,
  type ApplicabilityDecision,
  type ApplicabilityFacts,
  type DeclaredFact,
  type TaxpayerCategory,
  type Territory,
} from "./domain/applicability.js";
export {
  AeatDate,
  AeatDateTime,
  DecimalLexeme,
  Nif,
  OpaqueId,
  OfficialText,
  RrsifFingerprint,
} from "./domain/values.js";
export {
  createInternalRecordEvidence,
  encodeInternalEvidenceSubject,
  VERIFACTU_EDITION,
  VERIFACTU_RECORD_PROFILE_ID,
  VERIFACTU_RECORD_PROFILE_VERSION,
  verifactuRecordProfile,
  verifyInternalRecordEvidence,
  type InternalEvidenceSubject,
  type InternalRecordEvidence,
  type InternalRecordClass,
} from "./evidence/record-profile.js";
export {
  buildRrsifPreimage,
  calculateRrsifFingerprint,
  validateFingerprintInput,
  verifyRrsifFingerprint,
  type FingerprintComputation,
  type FingerprintInput,
  type AltaFingerprintInput,
  type AnulacionFingerprintInput,
  type EventFingerprintInput,
  type EventType,
  type InvoiceType,
  type PreviousFingerprint,
  type ProducerFingerprintIdentity,
} from "./fingerprint/rrsif.js";
export {
  validateBillingRecord,
  type AltaBusinessFacts,
  type AnulacionBusinessFacts,
  type IssuedBy,
  type PriorRecordState,
  type RectificationType,
  type ValidatedAltaRecord,
  type ValidatedAnulacionRecord,
  type ValidatedBillingRecord,
} from "./validation/record.js";
export { validateBreakdownTotals, type BreakdownTotals } from "./validation/totals.js";

export const editionInfo: EditionInfo = deepFreeze(generatedEditionInfo);

const EDITIONS: readonly EditionInfo[] = Object.freeze([editionInfo]);

export function getEdition(id?: EditionId): Result<EditionInfo> {
  if (id !== undefined && (typeof id !== "string" || id !== editionInfo.edition)) {
    const diagnostics: readonly Diagnostic[] = Object.freeze([
      createDiagnostic({
        code: "VF_EDITION_UNKNOWN",
        severity: "error",
        phase: "compatibility",
      }),
    ]);
    return failure("UNSUPPORTED_EDITION", diagnostics);
  }
  return success(editionInfo);
}

export function listEditions(): readonly EditionInfo[] {
  return EDITIONS;
}
