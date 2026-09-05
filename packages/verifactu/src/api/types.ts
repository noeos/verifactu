// SPDX-License-Identifier: Apache-2.0

import type { EditionInfo, EditionId } from "../index.js";
import type { Result, ValidationResult } from "../diagnostics/result.js";
import type { ApplicabilityDecision, ApplicabilityFacts } from "../domain/applicability.js";
import type { ValidatedBillingRecord } from "../validation/record.js";
import type { InternalRecordEvidence } from "../evidence/record-profile.js";
import type { SequenceHead, StoredRecord } from "../state/model.js";
import type {
  RecordStore,
  OutboxStore,
  AeatTransport,
  Observer,
  Clock,
  SignerPort,
  CertificatePort,
} from "../ports/index.js";
import type { RetryPolicy } from "../outbox/retry-policy.js";
import type { QrCode, QrInvoiceData } from "../qr/index.js";
import type { AeatSubmissionResponse } from "../transport/response.js";
import type { SubmissionBatch } from "../submissions/model.js";

export interface VerifactuConfig {
  readonly edition?: EditionId;
  readonly mode: "verifactu" | "no-verifactu";
  readonly taxpayerScopeId: string;
  readonly installationId: string;
  readonly sequenceId: string;
  readonly recordStore?: RecordStore;
  readonly outboxStore?: OutboxStore;
  readonly transport?: AeatTransport;
  readonly signer?: SignerPort;
  readonly certificates?: CertificatePort;
  readonly clock?: Clock;
  readonly observer?: Observer;
  readonly retryPolicy?: RetryPolicy;
  readonly limits?: Readonly<{
    readonly maxRecordBytes?: number;
    readonly maxExportRecords?: number;
  }>;
}

export interface AltaInput {
  readonly recordId: string;
  readonly record: unknown;
}
export interface AnulacionInput {
  readonly recordId: string;
  readonly record: unknown;
}
export interface EventInput {
  readonly recordId: string;
  readonly event: unknown;
}

export interface PreparedArtifact {
  readonly recordId: string;
  readonly kind: "alta" | "anulacion" | "event";
  readonly edition: string;
  readonly mode: VerifactuConfig["mode"];
  readonly bytes: Uint8Array;
  readonly fingerprint: string;
  readonly internalEvidence?: InternalRecordEvidence;
  readonly validated: ValidatedBillingRecord | Record<string, unknown>;
}

export interface CommittedArtifact {
  readonly record: StoredRecord;
  readonly head: SequenceHead;
  readonly artifact: PreparedArtifact;
}
export interface VerifyRecordInput {
  readonly artifact: unknown;
  readonly expectedFingerprint?: string;
}
export interface RecordVerification {
  readonly status: "valid" | "invalid" | "indeterminate" | "aborted";
  readonly recordId?: string;
}
export interface VerifyChainInput {
  readonly contextId?: string;
  readonly sequenceId?: string;
  readonly limit: number;
}
export interface BuildSubmissionInput {
  readonly batchId: string;
  readonly records: readonly StoredRecord[];
  readonly environment: "test" | "production";
  readonly endpointId: string;
  readonly header?: Readonly<Record<string, string>>;
  readonly createdAt: string;
}
export interface InspectResponseInput {
  readonly bytes: Uint8Array;
}
export interface ProcessQueueInput {
  readonly owner: string;
  readonly limit: number;
  readonly leaseSeconds: number;
}
export interface ReconcileInput {
  readonly workId: string;
}
export interface ExportInput {
  readonly contextId: string;
  readonly sequenceId: string;
  readonly limit: number;
}
export interface ProcessReport {
  readonly leased: number;
  readonly submitted: number;
  readonly completed: number;
  readonly indeterminate: number;
  readonly retryable: number;
}
export interface ReconciliationReport {
  readonly workId: string;
  readonly status: "resolved" | "indeterminate" | "unsupported";
  readonly response?: AeatSubmissionResponse;
}

export interface Verifactu {
  readonly edition: EditionInfo;
  evaluateApplicability(input: ApplicabilityFacts): Result<ApplicabilityDecision>;
  prepareAlta(input: AltaInput, signal?: AbortSignal): Promise<Result<PreparedArtifact>>;
  prepareAnulacion(input: AnulacionInput, signal?: AbortSignal): Promise<Result<PreparedArtifact>>;
  prepareEvent(input: EventInput, signal?: AbortSignal): Promise<Result<PreparedArtifact>>;
  commit(
    prepared: PreparedArtifact,
    expectedHead: SequenceHead,
    signal?: AbortSignal,
  ): Promise<Result<CommittedArtifact>>;
  verifyRecord(
    input: VerifyRecordInput,
    signal?: AbortSignal,
  ): Promise<ValidationResult<RecordVerification>>;
  verifyChain(input: VerifyChainInput, signal?: AbortSignal): AsyncIterable<RecordVerification>;
  buildQr(input: QrInvoiceData): Result<QrCode>;
  verifyQr(input: { readonly payload: string; readonly expected: QrInvoiceData }): Result<true>;
  buildSubmission(input: BuildSubmissionInput): Promise<Result<SubmissionBatch>>;
  inspectResponse(input: InspectResponseInput): Result<AeatSubmissionResponse>;
  processQueue(input: ProcessQueueInput, signal?: AbortSignal): Promise<Result<ProcessReport>>;
  reconcile(input: ReconcileInput, signal?: AbortSignal): Promise<Result<ReconciliationReport>>;
  export(input: ExportInput, signal?: AbortSignal): AsyncIterable<Uint8Array>;
}
