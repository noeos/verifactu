// SPDX-License-Identifier: Apache-2.0

import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";
import type { AeatTransport, Clock, Observer, OutboxStore, RecordStore } from "../ports/index.js";
import { parseAeatResponse, type AeatLineStatus } from "../transport/response.js";
import type { OutboxEnqueue, OutboxWork, RecordState } from "../state/model.js";
import { transitionRecord } from "../state/transitions.js";
import { decideRetry, type RetryPolicy } from "../outbox/retry-policy.js";

export interface QueueProcessOptions {
  readonly owner: string;
  readonly limit: number;
  readonly leaseSeconds: number;
  readonly clock: Clock;
  readonly outbox: OutboxStore;
  readonly transport: AeatTransport;
  readonly recordStore?: RecordStore;
  readonly observer?: Observer;
  readonly retryPolicy?: RetryPolicy;
  readonly signal?: AbortSignal;
}

export interface QueueProcessReport {
  readonly leased: number;
  readonly submitted: number;
  readonly completed: number;
  readonly indeterminate: number;
  readonly retryable: number;
}

export function createOutboxWork(input: OutboxEnqueue, now: string): OutboxWork {
  return Object.freeze({
    ...input,
    requestBytes: new Uint8Array(input.requestBytes),
    state: "pending",
    attempt: 0,
    nextAttemptAt: now,
    lease: undefined,
    responseBytes: undefined,
    lastError: undefined,
  });
}

export async function processQueueOnce(
  options: QueueProcessOptions,
): Promise<Result<QueueProcessReport>> {
  if (options.signal?.aborted === true)
    return failure("ABORTED", [
      createDiagnostic({ code: "VF_INPUT_ABORTED", severity: "error", phase: "state" }),
    ]);
  const now = options.clock.now().toISOString();
  const leased = await options.outbox.lease(
    { owner: options.owner, now, limit: options.limit, leaseSeconds: options.leaseSeconds },
    options.signal,
  );
  if (!leased.ok) return leased;
  let submitted = 0;
  let completed = 0;
  let indeterminate = 0;
  let retryable = 0;
  for (const work of leased.value) {
    if (isAborted(options.signal))
      return failure("ABORTED", [
        createDiagnostic({ code: "VF_INPUT_ABORTED", severity: "error", phase: "state" }),
      ]);
    if (work.lease === undefined) continue;
    const active = await options.outbox.markSubmitting(
      work.workId,
      work.lease,
      now,
      options.signal,
    );
    if (!active.ok || active.value.lease === undefined) {
      retryable += 1;
      continue;
    }
    if (options.recordStore !== undefined) {
      const moved = await moveRecords(options.recordStore, work, "submitting", now, options.signal);
      if (!moved) {
        const decision = retryDecision(
          options.retryPolicy,
          now,
          active.value.attempt,
          "record-state-conflict",
        );
        if (!decision.ok) return decision;
        if (decision.value.retry && decision.value.nextAttemptAt !== undefined)
          await options.outbox.release(
            work.workId,
            active.value.lease,
            decision.value.nextAttemptAt,
            "record-state-conflict",
            now,
            options.signal,
          );
        else
          await options.outbox.complete(
            work.workId,
            active.value.lease,
            { state: "dead-letter", error: "record-state-conflict" },
            now,
            options.signal,
          );
        retryable += 1;
        continue;
      }
    }
    submitted += 1;
    options.observer?.emit({
      name: "submission.started",
      version: 1,
      phase: "transport",
      correlationId: work.workId,
      outcome: "started",
      edition: "runtime",
    });
    const observation = await options.transport.send(
      {
        environment: work.environment,
        endpointId: work.endpointId,
        body: work.requestBytes,
        requestDigest: work.requestDigest,
        certificateId: work.certificateId,
      },
      options.signal,
    );
    if (!observation.ok) {
      const decision = retryDecision(
        options.retryPolicy,
        now,
        active.value.attempt,
        observation.error.code,
      );
      if (!decision.ok) return decision;
      if (!decision.value.retry || decision.value.nextAttemptAt === undefined) {
        await options.outbox.complete(
          work.workId,
          active.value.lease,
          { state: "dead-letter", error: observation.error.code },
          now,
          options.signal,
        );
        continue;
      }
      const released = await options.outbox.release(
        work.workId,
        active.value.lease,
        decision.value.nextAttemptAt,
        observation.error.code,
        now,
        options.signal,
      );
      if (released.ok) retryable += 1;
      continue;
    }
    if (
      observation.value.requestDigest !== work.requestDigest ||
      !observation.value.completed ||
      observation.value.responseBytes === undefined ||
      observation.value.httpStatus === undefined ||
      observation.value.httpStatus < 200 ||
      observation.value.httpStatus >= 300
    ) {
      await options.outbox.complete(
        work.workId,
        active.value.lease,
        { state: "indeterminate", error: "possible-delivery-without-response" },
        now,
        options.signal,
      );
      indeterminate += 1;
      continue;
    }
    const parsed = parseAeatResponse(observation.value.responseBytes);
    if (!parsed.ok) {
      await options.outbox.complete(
        work.workId,
        active.value.lease,
        {
          state: "indeterminate",
          responseBytes: observation.value.responseBytes,
          error: "response-unclassifiable",
        },
        now,
        options.signal,
      );
      indeterminate += 1;
      continue;
    }
    if (parsed.value.soapFault) {
      await options.outbox.complete(
        work.workId,
        active.value.lease,
        {
          state: "indeterminate",
          responseBytes: observation.value.responseBytes,
          error: "soap-fault",
        },
        now,
        options.signal,
      );
      indeterminate += 1;
      continue;
    }
    if (options.recordStore !== undefined)
      await applyResponseStates(
        options.recordStore,
        work,
        parsed.value.status,
        parsed.value.lines,
        now,
        options.signal,
      );
    await options.outbox.complete(
      work.workId,
      active.value.lease,
      { state: "completed", responseBytes: observation.value.responseBytes },
      now,
    );
    completed += 1;
    options.observer?.emit({
      name: "submission.completed",
      version: 1,
      phase: "transport",
      correlationId: work.workId,
      outcome: "completed",
      edition: parsed.value.status,
    });
  }
  return success(
    Object.freeze({ leased: leased.value.length, submitted, completed, indeterminate, retryable }),
  );
}

function retryDecision(
  policy: RetryPolicy | undefined,
  now: string,
  attempt: number,
  reason: string,
): ReturnType<typeof decideRetry> {
  return decideRetry({
    now,
    attempt,
    reason,
    policy: policy ?? {
      maxAttempts: 8,
      baseDelayMs: 1_000,
      maxDelayMs: 3_600_000,
      jitter: () => 0,
    },
  });
}

function isAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

async function moveRecords(
  store: RecordStore,
  work: OutboxWork,
  next: "submitting",
  now: string,
  signal?: AbortSignal,
): Promise<boolean> {
  for (const recordId of work.recordIds) {
    const transition = transitionRecord({
      recordId,
      from: "queued",
      to: next,
      reason: "submission-started",
      attempt: work.attempt + 1,
      actor: "outbox-worker",
      at: now,
    });
    if (
      !transition.ok ||
      !(await store.transition(recordId, "queued", next, transition.value, signal)).ok
    )
      return false;
  }
  return true;
}

async function applyResponseStates(
  store: RecordStore,
  work: OutboxWork,
  overall: string,
  lines: readonly { readonly invoiceId: string; readonly status: AeatLineStatus }[],
  now: string,
  signal?: AbortSignal,
): Promise<void> {
  for (const recordId of work.recordIds) {
    const line = lines.find((item) => item.invoiceId === recordId);
    const next = line === undefined ? statusToState(overall) : lineState(line.status);
    if (next === undefined) continue;
    const transition = transitionRecord({
      recordId,
      from: "submitting",
      to: next,
      reason: "aeat-response",
      attempt: work.attempt + 1,
      actor: "outbox-worker",
      at: now,
    });
    if (transition.ok)
      await store.transition(recordId, "submitting", next, transition.value, signal);
  }
}

function lineState(status: AeatLineStatus): RecordState {
  return status === "Correcto"
    ? "accepted"
    : status === "AceptadoConErrores"
      ? "accepted-with-errors"
      : "rejected";
}
function statusToState(status: string): RecordState | undefined {
  return status === "Correcto"
    ? "accepted"
    : status === "Incorrecto"
      ? "rejected"
      : status === "ParcialmenteCorrecto"
        ? "indeterminate"
        : undefined;
}
