// SPDX-License-Identifier: Apache-2.0

import { createDiagnostic, type Diagnostic } from "./diagnostics/diagnostic.js";
import { failure, success, type Result } from "./diagnostics/result.js";
import { deepFreeze } from "./domain/immutable.js";
import { editionInfo as generatedEditionInfo } from "./generated/edition.js";

export type EditionId = string & { readonly __brand: "NoeosEditionId" };
export type EditionInfo = typeof generatedEditionInfo;
export {
  VERIFACTU_DIAGNOSTIC_SCHEMA,
  createDiagnostic,
  type DiagnosticCode,
  type DiagnosticDetail,
  type DiagnosticInput,
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
export { failure, success, valid, invalid, indeterminate, aborted } from "./diagnostics/result.js";
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
export {
  parseSecureXml,
  serializeXml,
  canonicalizeXml,
  type XmlElement,
  type XmlNode,
  type XmlLimits,
} from "./xml/codec.js";
export { serializeBillingRecord } from "./xml/records.js";
export {
  buildQrPayload,
  renderQr,
  type QrCode,
  type QrEnvironment,
  type QrInvoiceData,
} from "./qr/index.js";
export {
  assertCertificateUsable,
  describeCertificate,
  type CertificateDescriptor,
  type CertificateHandle,
  type CertificateProvider,
} from "./certificates/index.js";
export {
  VERIFACTU_SIGNATURE_POLICY,
  createDssBackend,
  createSignatureRequest,
  validateXadesEnvelope,
  type SignatureProfile,
  type SignatureRequest,
  type SignatureResult,
  type DssBridge,
  type XadesBackend,
} from "./signatures/index.js";
export type {
  CertificatePort,
  Clock,
  AeatObservation,
  AeatRequest,
  AeatTransport,
  CommitReceipt,
  LeaseRequest,
  Observer,
  ObservedEvent,
  OutboxCompletion,
  OutboxStore,
  RecordScanInput,
  RecordStore,
  SignerPort,
  SignatureBackendPort,
  XmlPort,
} from "./ports/index.js";
export {
  genesisHead,
  nextHead,
  assertFreshness,
  canTransition,
  transitionRecord,
  type Lease,
  type OutboxEnqueue,
  type OutboxState,
  type OutboxWork,
  type RecordCommitBundle,
  type RecordState,
  type SequenceHead,
  type StateTransition,
  type StoredRecord,
} from "./state/index.js";
export {
  buildSubmissionBatch,
  MAX_BATCH_RECORDS,
  type SubmissionBatch,
} from "./submissions/index.js";
export {
  listAeatEndpoints,
  resolveAeatEndpoint,
  buildSoapRequest,
  parseSoapEnvelope,
  parseAeatResponse,
  type AeatEndpoint,
  type AeatEndpointId,
  type AeatEnvironment,
  type AeatResponseLine,
  type AeatSubmissionResponse,
  type AeatLineStatus,
  type AeatSubmissionStatus,
  type SoapRequest,
} from "./transport/index.js";
export {
  commitSecuredRecord,
  createOutboxWork,
  processQueueOnce,
  type QueueProcessOptions,
  type QueueProcessReport,
} from "./application/index.js";
export { decideRetry, type RetryDecision, type RetryPolicy } from "./outbox/index.js";
export { createVerifactu } from "./api/create-verifactu.js";
export { VECTOR_SET, type VectorSet } from "./vectors.js";
export type {
  AltaInput,
  AnulacionInput,
  BuildSubmissionInput,
  CommittedArtifact,
  EventInput,
  ExportInput,
  InspectResponseInput,
  ProcessQueueInput,
  ProcessReport,
  PreparedArtifact,
  ReconcileInput,
  ReconciliationReport,
  RecordVerification,
  Verifactu,
  VerifactuConfig,
  VerifyChainInput,
  VerifyRecordInput,
} from "./api/types.js";

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
