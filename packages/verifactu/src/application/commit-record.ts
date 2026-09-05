// SPDX-License-Identifier: Apache-2.0

import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";
import type { Observer, RecordStore } from "../ports/index.js";
import { nextHead } from "../state/heads.js";
import type {
  OutboxEnqueue,
  RecordCommitBundle,
  SequenceHead,
  StateTransition,
  StoredRecord,
} from "../state/model.js";
import { transitionRecord } from "../state/transitions.js";

export interface CommitRecordInput {
  readonly record: Omit<StoredRecord, "position" | "state" | "attempt" | "updatedAt"> & {
    readonly state?: "secured";
    readonly attempt?: number;
  };
  readonly expectedHead: SequenceHead;
  readonly evidence: readonly Uint8Array[];
  readonly outbox: readonly OutboxEnqueue[];
  readonly now: string;
  readonly observer?: Observer;
  readonly signal?: AbortSignal;
}

export async function commitSecuredRecord(
  store: RecordStore,
  input: CommitRecordInput,
): Promise<Result<{ readonly record: StoredRecord; readonly head: SequenceHead }>> {
  if (input.signal?.aborted === true)
    return failure("ABORTED", [
      createDiagnostic({ code: "VF_INPUT_ABORTED", severity: "error", phase: "state" }),
    ]);
  const head = nextHead(input.expectedHead, input.record.linkDigest);
  if (!head.ok) return head;
  const record: StoredRecord = Object.freeze({
    ...input.record,
    position: head.value.position,
    state: "queued",
    attempt: input.record.attempt ?? 0,
    updatedAt: input.now,
    bytes: new Uint8Array(input.record.bytes),
  });
  const transitions: StateTransition[] = [];
  for (const [from, to] of [
    [input.record.state ?? "secured", "persisted"],
    ["persisted", "queued"],
  ] as const) {
    const transition = transitionRecord({
      recordId: record.recordId,
      from,
      to,
      reason: "atomic-commit",
      attempt: record.attempt,
      actor: "application",
      at: input.now,
    });
    if (!transition.ok) return transition;
    transitions.push(transition.value);
  }
  const bundle: RecordCommitBundle = Object.freeze({
    record,
    head: Object.freeze({ ...head.value, linkDigest: record.linkDigest }),
    transitions: Object.freeze(transitions),
    evidence: Object.freeze(input.evidence.map((item) => new Uint8Array(item))),
    outbox: Object.freeze(
      input.outbox.map((item) =>
        Object.freeze({ ...item, recordIds: Object.freeze([...item.recordIds]) }),
      ),
    ),
  });
  const committed = await store.commit(input.expectedHead, bundle, input.signal);
  if (!committed.ok) return committed;
  input.observer?.emit({
    name: "record.confirmed",
    version: 1,
    phase: "state",
    correlationId: record.recordId,
    outcome: "completed",
    edition: record.edition,
  });
  return success({ record, head: committed.value.head });
}
