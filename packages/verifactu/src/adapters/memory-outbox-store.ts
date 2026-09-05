// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/require-await -- the memory adapter mirrors async persistence semantics. */

import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";
import type { LeaseRequest, OutboxCompletion, OutboxStore } from "../ports/index.js";
import type { Lease, OutboxWork } from "../state/model.js";

/** Deterministic adapter for tests; it is not a production persistence engine. */
export class MemoryOutboxStore implements OutboxStore {
  private readonly works = new Map<string, OutboxWork>();
  private fencing = 0;
  private token = 0;

  async enqueue(work: readonly OutboxWork[]): Promise<Result<readonly OutboxWork[]>> {
    const pending = new Set<string>();
    for (const item of work) {
      if (
        item.workId.length === 0 ||
        item.requestDigest.length !== 64 ||
        item.recordIds.length < 1 ||
        item.requestBytes.byteLength === 0 ||
        !Number.isInteger(item.attempt) ||
        item.attempt < 0 ||
        !Number.isFinite(Date.parse(item.createdAt)) ||
        !Number.isFinite(Date.parse(item.nextAttemptAt))
      )
        return limitFailure();
      const existing = this.works.get(item.workId);
      if (existing !== undefined) {
        if (existing.requestDigest !== item.requestDigest) return duplicate();
        continue;
      }
      if (pending.has(item.workId)) return duplicate();
      pending.add(item.workId);
    }
    for (const item of work)
      if (!this.works.has(item.workId)) this.works.set(item.workId, cloneWork(item));
    return success(Object.freeze(work.map(cloneWork)));
  }

  async lease(input: LeaseRequest): Promise<Result<readonly OutboxWork[]>> {
    if (input.limit < 1 || input.leaseSeconds < 1) return limitFailure();
    const now = Date.parse(input.now);
    if (!Number.isFinite(now)) return limitFailure();
    const selected: OutboxWork[] = [];
    for (const item of [...this.works.values()].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    )) {
      if (selected.length >= input.limit) break;
      const expired = item.lease !== undefined && Date.parse(item.lease.expiresAt) <= now;
      if (!expired && item.state !== "pending" && item.state !== "retryable") continue;
      if (expired)
        this.works.set(
          item.workId,
          Object.freeze({ ...item, state: "retryable", lease: undefined }),
        );
      if (Date.parse(item.nextAttemptAt) > now) continue;
      const lease: Lease = Object.freeze({
        token: `lease-${String(++this.token)}`,
        fencing: ++this.fencing,
        owner: input.owner,
        expiresAt: new Date(now + input.leaseSeconds * 1_000).toISOString(),
      });
      const leased = Object.freeze({ ...item, state: "leased" as const, lease });
      this.works.set(item.workId, leased);
      selected.push(leased);
    }
    return success(Object.freeze(selected.map(cloneWork)));
  }

  async markSubmitting(workId: string, lease: Lease, now: string): Promise<Result<OutboxWork>> {
    return this.updateLeased(workId, lease, "submitting", now);
  }

  async complete(
    workId: string,
    lease: Lease,
    result: OutboxCompletion,
    now: string,
  ): Promise<Result<OutboxWork>> {
    const current = this.checked(workId, lease, now);
    if (!current.ok) return current;
    const updated = Object.freeze({
      ...current.value,
      state: result.state,
      lease: undefined,
      responseBytes:
        result.responseBytes === undefined ? undefined : new Uint8Array(result.responseBytes),
      lastError: result.error,
    });
    this.works.set(workId, updated);
    return success(cloneWork(updated));
  }

  async release(
    workId: string,
    lease: Lease,
    nextAttemptAt: string,
    reason: string,
    now: string,
  ): Promise<Result<OutboxWork>> {
    const current = this.checked(workId, lease, now);
    if (!current.ok) return current;
    const updated = Object.freeze({
      ...current.value,
      state: "retryable" as const,
      lease: undefined,
      nextAttemptAt,
      lastError: reason,
    });
    this.works.set(workId, updated);
    return success(cloneWork(updated));
  }

  async inspect(workId: string): Promise<Result<OutboxWork | undefined>> {
    const value = this.works.get(workId);
    return success(value === undefined ? undefined : cloneWork(value));
  }

  private updateLeased(
    workId: string,
    lease: Lease,
    state: "submitting",
    now: string,
  ): Result<OutboxWork> {
    const current = this.checked(workId, lease, now);
    if (!current.ok) return current;
    const updated = Object.freeze({ ...current.value, state, lease });
    this.works.set(workId, updated);
    return success(cloneWork(updated));
  }

  private checked(workId: string, lease: Lease, now: string): Result<OutboxWork> {
    const current = this.works.get(workId);
    if (
      current === undefined ||
      current.lease?.token !== lease.token ||
      current.lease.fencing !== lease.fencing ||
      Date.parse(current.lease.expiresAt) <= Date.parse(now)
    )
      return failure("INVALID_INPUT", [
        createDiagnostic({ code: "VF_OUTBOX_LEASE_INVALID", severity: "error", phase: "state" }),
      ]);
    return success(current);
  }
}

function cloneWork(value: OutboxWork): OutboxWork {
  return Object.freeze({
    ...value,
    recordIds: Object.freeze([...value.recordIds]),
    requestBytes: new Uint8Array(value.requestBytes),
    responseBytes:
      value.responseBytes === undefined ? undefined : new Uint8Array(value.responseBytes),
    lease: value.lease === undefined ? undefined : Object.freeze({ ...value.lease }),
  });
}
function duplicate(): Result<never> {
  return failure("INVALID_INPUT", [
    createDiagnostic({ code: "VF_OUTBOX_DUPLICATE", severity: "error", phase: "state" }),
  ]);
}
function limitFailure(): Result<never> {
  return failure("INVALID_INPUT", [
    createDiagnostic({ code: "VF_OUTBOX_LIMIT_EXCEEDED", severity: "error", phase: "limits" }),
  ]);
}
