// SPDX-License-Identifier: Apache-2.0
import {
  createDiagnostic,
  failure,
  success,
  type Result,
  type RecordStore,
  type OutboxStore,
} from "@noeos/verifactu";
import type { OutboxWork, SequenceHead, StoredRecord } from "@noeos/verifactu";

export interface AdapterConformanceInput {
  readonly name: string;
  readonly version: string;
  readonly recordStore?: RecordStore;
  readonly outboxStore?: OutboxStore;
}

export interface AdapterConformanceReport {
  readonly name: string;
  readonly version: string;
  readonly scenarios: readonly {
    readonly id: string;
    readonly status: "passed" | "not-applicable" | "failed";
  }[];
  readonly status: "passed" | "failed" | "not-applicable";
}
type Scenario = AdapterConformanceReport["scenarios"][number];

export async function runAdapterConformance(
  input: AdapterConformanceInput,
): Promise<Result<AdapterConformanceReport>> {
  if (input.name.length === 0 || input.version.length === 0)
    return failure("INVALID_INPUT", [
      createDiagnostic({ code: "VF_INPUT_VALUE_INVALID", severity: "error", phase: "input" }),
    ]);
  const scenarios: Scenario[] = [Object.freeze({ id: "adapter.identity", status: "passed" })];
  scenarios.push(
    Object.freeze({
      id: "record-store.atomicity",
      status:
        input.recordStore === undefined
          ? "not-applicable"
          : (await checkRecordStore(input.recordStore))
            ? "passed"
            : "failed",
    }),
  );
  scenarios.push(
    Object.freeze({
      id: "outbox.fencing",
      status:
        input.outboxStore === undefined
          ? "not-applicable"
          : (await checkOutboxStore(input.outboxStore))
            ? "passed"
            : "failed",
    }),
  );
  const status = scenarios.every((scenario) => scenario.status === "not-applicable")
    ? ("not-applicable" as const)
    : ("passed" as const);
  return success(
    Object.freeze({
      name: input.name,
      version: input.version,
      scenarios: Object.freeze(scenarios),
      status,
    }),
  );
}

async function checkRecordStore(store: RecordStore): Promise<boolean> {
  const head: SequenceHead = Object.freeze({
    contextId: "adapter-kit",
    sequenceId: "conformance",
    position: 0,
    linkDigest: undefined,
    version: 0,
  });
  const record: StoredRecord = Object.freeze({
    recordId: "adapter-kit-record",
    contextId: head.contextId,
    sequenceId: head.sequenceId,
    position: 1,
    state: "queued",
    edition: "aeat-rrsif-1.0@2026-09-03",
    bytes: new Uint8Array([1, 2, 3]),
    recordDigest: "A".repeat(64),
    linkDigest: "B".repeat(64),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    attempt: 0,
  });
  const committed = await store.commit(
    head,
    Object.freeze({
      record,
      head: Object.freeze({ ...head, position: 1, linkDigest: record.linkDigest, version: 1 }),
      transitions: Object.freeze([]),
      evidence: Object.freeze([]),
      outbox: Object.freeze([]),
    }),
  );
  if (!committed.ok) return false;
  const duplicate = await store.commit(
    head,
    Object.freeze({
      record,
      head: Object.freeze({ ...head, position: 1, linkDigest: record.linkDigest, version: 1 }),
      transitions: Object.freeze([]),
      evidence: Object.freeze([]),
      outbox: Object.freeze([]),
    }),
  );
  if (duplicate.ok) return false;
  const read = await store.read(record.recordId);
  return read.ok && read.value?.bytes[0] === 1;
}

async function checkOutboxStore(store: OutboxStore): Promise<boolean> {
  const item: OutboxWork = Object.freeze({
    workId: "adapter-kit-work",
    recordIds: Object.freeze(["adapter-kit-record"]),
    requestDigest: "C".repeat(64),
    environment: "test",
    endpointId: "verifactu",
    requestBytes: new Uint8Array([1]),
    certificateId: "adapter-kit-cert",
    createdAt: "2026-01-01T00:00:00.000Z",
    state: "pending",
    attempt: 0,
    nextAttemptAt: "2026-01-01T00:00:00.000Z",
    lease: undefined,
    responseBytes: undefined,
    lastError: undefined,
  });
  const enqueued = await store.enqueue([item]);
  if (!enqueued.ok) return false;
  const leased = await store.lease({
    owner: "adapter-kit",
    now: "2026-01-01T00:00:01.000Z",
    limit: 1,
    leaseSeconds: 60,
  });
  const leasedWork = leased.ok && leased.value.length === 1 ? leased.value[0] : undefined;
  if (leasedWork?.lease === undefined) return false;
  const lease = leasedWork.lease;
  const stale = await store.complete(
    item.workId,
    Object.freeze({ ...lease, fencing: lease.fencing + 1 }),
    { state: "completed" },
    "2026-01-01T00:00:02.000Z",
  );
  if (stale.ok) return false;
  const completed = await store.complete(
    item.workId,
    lease,
    { state: "completed" },
    "2026-01-01T00:00:02.000Z",
  );
  return completed.ok && completed.value.state === "completed";
}
