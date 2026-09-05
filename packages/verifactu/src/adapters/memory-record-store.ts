// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/require-await -- the memory adapter mirrors async persistence semantics. */

import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";
import { sameHead } from "../state/heads.js";
import type {
  RecordCommitBundle,
  RecordState,
  SequenceHead,
  StateTransition,
  StoredRecord,
} from "../state/model.js";
import type { CommitReceipt, RecordScanInput, RecordStore } from "../ports/index.js";

/** Deterministic adapter for contract, fault-injection and recovery tests only. */
export class MemoryRecordStore implements RecordStore {
  private readonly heads = new Map<string, SequenceHead>();
  private readonly records = new Map<string, StoredRecord>();
  private readonly checkpoints = new Map<string, SequenceHead>();
  readonly committedOutbox: RecordCommitBundle[] = [];

  async readHead(contextId: string, sequenceId: string): Promise<Result<SequenceHead>> {
    const key = sequenceKey(contextId, sequenceId);
    const head = this.heads.get(key);
    return head === undefined
      ? failure("INVALID_INPUT", [
          createDiagnostic({
            code: "VF_INPUT_REQUIRED",
            severity: "error",
            phase: "state",
            path: "/head",
          }),
        ])
      : success(cloneHead(head));
  }

  async commit(expected: SequenceHead, bundle: RecordCommitBundle): Promise<Result<CommitReceipt>> {
    const key = sequenceKey(expected.contextId, expected.sequenceId);
    const actual = this.heads.get(key);
    if (actual !== undefined && !sameHead(expected, actual)) return conflict();
    if (this.records.has(bundle.record.recordId)) return conflict();
    if (
      bundle.record.contextId !== expected.contextId ||
      bundle.record.sequenceId !== expected.sequenceId ||
      bundle.record.position !== expected.position + 1 ||
      bundle.head.position !== bundle.record.position
    )
      return conflict();
    const stored = cloneRecord(bundle.record);
    this.records.set(stored.recordId, stored);
    this.heads.set(key, cloneHead(bundle.head));
    this.committedOutbox.push(cloneBundle(bundle));
    return success({
      recordId: stored.recordId,
      head: cloneHead(bundle.head),
      state: stored.state,
    });
  }

  async read(recordId: string): Promise<Result<StoredRecord | undefined>> {
    const record = this.records.get(recordId);
    return success(record === undefined ? undefined : cloneRecord(record));
  }

  async transition(
    recordId: string,
    expected: RecordState,
    next: RecordState,
    transition: StateTransition,
  ): Promise<Result<StoredRecord>> {
    const current = this.records.get(recordId);
    if (current?.state !== expected || transition.from !== expected || transition.to !== next)
      return conflict();
    const updated = cloneRecord(
      Object.freeze({
        ...current,
        state: next,
        attempt: current.attempt + (next === "submitting" ? 1 : 0),
        updatedAt: transition.at,
      }),
    );
    this.records.set(recordId, updated);
    return success(cloneRecord(updated));
  }

  async *scan(input: RecordScanInput): AsyncIterable<StoredRecord> {
    const values = [...this.records.values()]
      .filter(
        (record) =>
          record.contextId === input.contextId &&
          record.sequenceId === input.sequenceId &&
          (input.afterPosition === undefined || record.position > input.afterPosition) &&
          (input.states === undefined || input.states.includes(record.state)),
      )
      .sort((left, right) => left.position - right.position)
      .slice(0, input.limit);
    for (const record of values) yield cloneRecord(record);
  }

  async checkpoint(contextId: string, sequenceId: string): Promise<Result<SequenceHead>> {
    const head = this.heads.get(sequenceKey(contextId, sequenceId));
    if (head === undefined)
      return failure("INVALID_INPUT", [
        createDiagnostic({ code: "VF_INPUT_REQUIRED", severity: "error", phase: "state" }),
      ]);
    this.checkpoints.set(sequenceKey(contextId, sequenceId), cloneHead(head));
    return success(cloneHead(head));
  }

  async verifyFreshness(checkpoint: SequenceHead): Promise<Result<true>> {
    const actual = this.heads.get(sequenceKey(checkpoint.contextId, checkpoint.sequenceId));
    if (
      actual === undefined ||
      actual.position < checkpoint.position ||
      (actual.position === checkpoint.position && actual.version < checkpoint.version)
    )
      return failure("INVALID_INPUT", [
        createDiagnostic({ code: "VF_STATE_ROLLBACK_DETECTED", severity: "error", phase: "state" }),
      ]);
    return success(true);
  }
}

function sequenceKey(contextId: string, sequenceId: string): string {
  return `${contextId}\u0000${sequenceId}`;
}
function cloneHead(value: SequenceHead): SequenceHead {
  return Object.freeze({ ...value });
}
function cloneRecord(value: StoredRecord): StoredRecord {
  return Object.freeze({ ...value, bytes: new Uint8Array(value.bytes) });
}
function cloneBundle(value: RecordCommitBundle): RecordCommitBundle {
  return Object.freeze({
    ...value,
    record: cloneRecord(value.record),
    head: cloneHead(value.head),
    evidence: Object.freeze(value.evidence.map((item) => new Uint8Array(item))),
    outbox: Object.freeze(
      value.outbox.map((item) =>
        Object.freeze({
          ...item,
          recordIds: Object.freeze([...item.recordIds]),
          requestBytes: new Uint8Array(item.requestBytes),
        }),
      ),
    ),
    transitions: Object.freeze(value.transitions.map((item) => Object.freeze({ ...item }))),
  });
}
function conflict(): Result<never> {
  return failure("INVALID_INPUT", [
    createDiagnostic({ code: "VF_STATE_CONFLICT", severity: "error", phase: "state" }),
  ]);
}
