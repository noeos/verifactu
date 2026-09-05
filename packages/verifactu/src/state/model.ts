// SPDX-License-Identifier: Apache-2.0

import type { AeatEndpointId } from "../transport/endpoints.js";

export type RecordState =
  | "prepared"
  | "secured"
  | "persisted"
  | "queued"
  | "submitting"
  | "accepted"
  | "accepted-with-errors"
  | "rejected"
  | "retryable"
  | "correction-required"
  | "cancelled"
  | "indeterminate";

export type StateActor = "application" | "outbox-worker" | "reconciler" | "recovery";

export interface SequenceHead {
  readonly contextId: string;
  readonly sequenceId: string;
  readonly position: number;
  readonly linkDigest: string | undefined;
  readonly version: number;
}

export interface StateTransition {
  readonly recordId: string;
  readonly from: RecordState;
  readonly to: RecordState;
  readonly reason: string;
  readonly attempt: number;
  readonly actor: StateActor;
  readonly at: string;
}

export interface StoredRecord {
  readonly recordId: string;
  readonly contextId: string;
  readonly sequenceId: string;
  readonly position: number;
  readonly state: RecordState;
  readonly edition: string;
  readonly bytes: Uint8Array;
  readonly recordDigest: string;
  readonly linkDigest: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly attempt: number;
}

export interface RecordCommitBundle {
  readonly record: StoredRecord;
  readonly head: SequenceHead;
  readonly transitions: readonly StateTransition[];
  readonly evidence: readonly Uint8Array[];
  readonly outbox: readonly OutboxEnqueue[];
}

export interface OutboxEnqueue {
  readonly workId: string;
  readonly recordIds: readonly string[];
  readonly requestDigest: string;
  readonly environment: "test" | "production";
  readonly endpointId: AeatEndpointId;
  readonly requestBytes: Uint8Array;
  readonly certificateId: string;
  readonly createdAt: string;
}

export interface OutboxWork extends OutboxEnqueue {
  readonly state: OutboxState;
  readonly attempt: number;
  readonly nextAttemptAt: string;
  readonly lease: Lease | undefined;
  readonly responseBytes: Uint8Array | undefined;
  readonly lastError: string | undefined;
}

export type OutboxState =
  | "pending"
  | "leased"
  | "submitting"
  | "completed"
  | "retryable"
  | "indeterminate"
  | "dead-letter"
  | "cancelled";

export interface Lease {
  readonly token: string;
  readonly fencing: number;
  readonly owner: string;
  readonly expiresAt: string;
}
