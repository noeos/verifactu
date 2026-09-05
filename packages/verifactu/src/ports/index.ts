// SPDX-License-Identifier: Apache-2.0

import type { Result } from "../diagnostics/result.js";
import type { CertificateHandle, CertificateProvider } from "../certificates/index.js";
import type { SignatureProfile, SignatureResult, XadesBackend } from "../signatures/index.js";
import type {
  OutboxWork,
  RecordCommitBundle,
  SequenceHead,
  StateTransition,
  StoredRecord,
  RecordState,
} from "../state/model.js";
import type { AeatEndpointId } from "../transport/endpoints.js";

export interface RecordStore {
  readHead(
    contextId: string,
    sequenceId: string,
    signal?: AbortSignal,
  ): Promise<Result<SequenceHead>>;
  commit(
    expected: SequenceHead,
    bundle: RecordCommitBundle,
    signal?: AbortSignal,
  ): Promise<Result<CommitReceipt>>;
  read(recordId: string, signal?: AbortSignal): Promise<Result<StoredRecord | undefined>>;
  transition(
    recordId: string,
    expected: RecordState,
    next: RecordState,
    transition: StateTransition,
    signal?: AbortSignal,
  ): Promise<Result<StoredRecord>>;
  scan(input: RecordScanInput, signal?: AbortSignal): AsyncIterable<StoredRecord>;
  checkpoint(
    contextId: string,
    sequenceId: string,
    signal?: AbortSignal,
  ): Promise<Result<SequenceHead>>;
  verifyFreshness(checkpoint: SequenceHead, signal?: AbortSignal): Promise<Result<true>>;
}

export interface CommitReceipt {
  readonly recordId: string;
  readonly head: SequenceHead;
  readonly state: RecordState;
}

export interface RecordScanInput {
  readonly contextId: string;
  readonly sequenceId: string;
  readonly states?: readonly RecordState[];
  readonly afterPosition?: number;
  readonly limit: number;
}

export interface OutboxStore {
  enqueue(
    work: readonly OutboxWork[],
    signal?: AbortSignal,
  ): Promise<Result<readonly OutboxWork[]>>;
  lease(input: LeaseRequest, signal?: AbortSignal): Promise<Result<readonly OutboxWork[]>>;
  markSubmitting(
    workId: string,
    lease: Lease,
    now: string,
    signal?: AbortSignal,
  ): Promise<Result<OutboxWork>>;
  complete(
    workId: string,
    lease: Lease,
    result: OutboxCompletion,
    now: string,
    signal?: AbortSignal,
  ): Promise<Result<OutboxWork>>;
  release(
    workId: string,
    lease: Lease,
    nextAttemptAt: string,
    reason: string,
    now: string,
    signal?: AbortSignal,
  ): Promise<Result<OutboxWork>>;
  inspect(workId: string, signal?: AbortSignal): Promise<Result<OutboxWork | undefined>>;
}

export interface LeaseRequest {
  readonly owner: string;
  readonly now: string;
  readonly limit: number;
  readonly leaseSeconds: number;
}

export interface Lease {
  readonly token: string;
  readonly fencing: number;
  readonly owner: string;
  readonly expiresAt: string;
}

export interface OutboxCompletion {
  readonly state: "completed" | "retryable" | "indeterminate" | "dead-letter";
  readonly responseBytes?: Uint8Array;
  readonly error?: string;
}

export interface AeatTransport {
  send(request: AeatRequest, signal?: AbortSignal): Promise<Result<AeatObservation>>;
}

export interface AeatRequest {
  readonly environment: "test" | "production";
  readonly endpointId: AeatEndpointId;
  readonly body: Uint8Array;
  readonly requestDigest: string;
  readonly certificateId: string;
}

export interface AeatObservation {
  readonly requestDigest: string;
  readonly responseBytes: Uint8Array | undefined;
  readonly httpStatus: number | undefined;
  readonly bytesWritten: number;
  readonly bytesRead: number;
  readonly completed: boolean;
  readonly receivedAt: string;
}

export interface Observer {
  emit(event: ObservedEvent): void;
}

export interface ObservedEvent {
  readonly name: string;
  readonly version: 1;
  readonly phase: string;
  readonly correlationId: string;
  readonly outcome: "started" | "completed" | "failed" | "aborted";
  readonly edition: string;
}

export interface Clock {
  now(): Date;
}

export interface SignerPort {
  describe(): Readonly<{ readonly id: string; readonly profiles: readonly SignatureProfile[] }>;
  sign(
    recordXml: Uint8Array,
    recordId: string,
    profile: SignatureProfile,
    signal?: AbortSignal,
  ): Promise<Result<SignatureResult>>;
}

export interface CertificatePort extends CertificateProvider {
  readonly id: string;
  chain(
    handle: CertificateHandle,
    signal?: AbortSignal,
  ): Promise<Result<readonly CertificateHandle[]>>;
}

export interface XmlPort {
  serialize(record: unknown, signal?: AbortSignal): Result<Uint8Array>;
  parse(xml: Uint8Array, signal?: AbortSignal): Result<unknown>;
}

export type SignatureBackendPort = XadesBackend;
