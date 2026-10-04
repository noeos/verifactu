import { createFiscalContext } from "../domain/context.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalInstant } from "../domain/date-time.js";
import {
  PERSISTENCE_PORT_CONTRACT_VERSION,
  type LeaseRecord,
  type LeaseStore,
} from "./ports.js";
import type { OutboxItem, StoreResult } from "./model.js";
import { isSafeStoreToken, storeFailure } from "./model.js";

export interface LeaseRequest {
  readonly context: FiscalContext;
  readonly outboxId: string;
  readonly ownerInstanceId: string;
  readonly ttlMs: number;
  readonly expectedVersion: number;
}

const MIN_TTL_MS = 1_000;
const MAX_TTL_MS = 300_000;

function validRequest(input: LeaseRequest): boolean {
  return (
    !!input &&
    createFiscalContext(input.context).status === "ok" &&
    isSafeStoreToken(input.outboxId) &&
    isSafeStoreToken(input.ownerInstanceId) &&
    Number.isSafeInteger(input.ttlMs) &&
    input.ttlMs >= MIN_TTL_MS &&
    input.ttlMs <= MAX_TTL_MS &&
    Number.isSafeInteger(input.expectedVersion) &&
    input.expectedVersion >= 0
  );
}

function validLease(
  lease: LeaseRecord,
  context: FiscalContext,
  outboxId?: string,
): boolean {
  return (
    !!lease &&
    isSafeStoreToken(lease.outboxId) &&
    (outboxId === undefined || lease.outboxId === outboxId) &&
    isSafeStoreToken(lease.ownerInstanceId) &&
    Number.isSafeInteger(lease.fencingToken) &&
    lease.fencingToken > 0 &&
    Number.isSafeInteger(lease.version) &&
    lease.version > 0 &&
    lease.authoritativeClock === true &&
    isSafeStoreToken(lease.clockPolicyId) &&
    createFiscalInstant(lease.acquiredAt).status === "ok" &&
    createFiscalInstant(lease.expiresAt).status === "ok" &&
    Date.parse(lease.expiresAt) > Date.parse(lease.acquiredAt) &&
    createFiscalContext(context).status === "ok"
  );
}

/** Claims are backend-timed. This wrapper never substitutes worker wall time. */
export async function claimOutboxLease(
  store: LeaseStore,
  input: LeaseRequest,
): Promise<StoreResult<LeaseRecord>> {
  if (
    !store ||
    store.contractVersion !== PERSISTENCE_PORT_CONTRACT_VERSION ||
    !validRequest(input)
  )
    return storeFailure("invalid", "invalid-input");
  const result = await store.claim(input);
  if (result.status !== "ok") return result;
  if (
    !validLease(result.value, input.context, input.outboxId) ||
    result.value.ownerInstanceId !== input.ownerInstanceId ||
    result.value.version !== input.expectedVersion + 1
  )
    return storeFailure("indeterminate", "corruption");
  return { status: "ok", value: Object.freeze({ ...result.value }) };
}

/** A lease that may have expired must be reacquired to obtain a higher fence. */
export async function renewOutboxLease(
  store: LeaseStore,
  context: FiscalContext,
  lease: LeaseRecord,
  ttlMs: number,
): Promise<StoreResult<LeaseRecord>> {
  if (
    !store ||
    store.contractVersion !== PERSISTENCE_PORT_CONTRACT_VERSION ||
    !validLease(lease, context) ||
    !Number.isSafeInteger(ttlMs) ||
    ttlMs < MIN_TTL_MS ||
    ttlMs > MAX_TTL_MS
  )
    return storeFailure("invalid", "invalid-input");
  const result = await store.renew({ context, lease, ttlMs });
  if (result.status !== "ok") return result;
  if (
    !validLease(result.value, context, lease.outboxId) ||
    result.value.ownerInstanceId !== lease.ownerInstanceId ||
    result.value.fencingToken !== lease.fencingToken ||
    result.value.version !== lease.version + 1 ||
    Date.parse(result.value.expiresAt) <= Date.parse(lease.expiresAt)
  )
    return storeFailure("indeterminate", "corruption");
  return { status: "ok", value: Object.freeze({ ...result.value }) };
}

export async function releaseOutboxLease(
  store: LeaseStore,
  context: FiscalContext,
  lease: LeaseRecord,
): Promise<StoreResult<"released">> {
  if (
    !store ||
    store.contractVersion !== PERSISTENCE_PORT_CONTRACT_VERSION ||
    !validLease(lease, context)
  )
    return storeFailure("invalid", "invalid-input");
  return store.release({ context, lease });
}

export async function completeOutboxWithLease(
  store: LeaseStore,
  input: {
    readonly context: FiscalContext;
    readonly lease: LeaseRecord;
    readonly expectedOutboxVersion: number;
    readonly nextState: OutboxItem["state"];
    readonly observationId: string | null;
  },
): Promise<StoreResult<OutboxItem>> {
  if (
    !store ||
    store.contractVersion !== PERSISTENCE_PORT_CONTRACT_VERSION ||
    !validLease(input.lease, input.context) ||
    !Number.isSafeInteger(input.expectedOutboxVersion) ||
    input.expectedOutboxVersion < 1 ||
    ![
      "attempt-started",
      "indeterminate",
      "retry-wait",
      "reconciliation-required",
      "accepted",
      "accepted-with-errors",
      "rejected",
      "permanently-failed",
    ].includes(input.nextState) ||
    (input.observationId !== null && !isSafeStoreToken(input.observationId))
  )
    return storeFailure("invalid", "invalid-input");
  const result = await store.complete(input);
  if (result.status !== "ok") return result;
  if (
    result.value.fencingToken !== input.lease.fencingToken ||
    result.value.version !== input.expectedOutboxVersion + 1 ||
    result.value.outboxId !== input.lease.outboxId ||
    result.value.state !== input.nextState ||
    result.value.lastObservationId !== input.observationId
  )
    return storeFailure("indeterminate", "corruption");
  return result;
}
