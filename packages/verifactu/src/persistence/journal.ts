import { createFiscalContext, sameContext } from "../domain/context.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalInstant } from "../domain/date-time.js";
import type { JournalEntry, StoreResult } from "./model.js";
import { isSafeStoreToken, storeFailure } from "./model.js";
import {
  PERSISTENCE_PORT_CONTRACT_VERSION,
  type JournalStore,
  type TransactionToken,
} from "./ports.js";

const durableStates = new Set([
  "pending",
  "leased",
  "attempt-started",
  "indeterminate",
  "retry-wait",
  "reconciliation-required",
  "accepted",
  "accepted-with-errors",
  "rejected",
  "permanently-failed",
]);
const transitions: Readonly<Record<string, readonly string[]>> = Object.freeze({
  pending: ["leased", "permanently-failed"],
  leased: ["pending", "attempt-started", "reconciliation-required"],
  "attempt-started": [
    "accepted",
    "accepted-with-errors",
    "rejected",
    "retry-wait",
    "indeterminate",
    "reconciliation-required",
    "permanently-failed",
  ],
  indeterminate: ["reconciliation-required"],
  "retry-wait": ["leased", "reconciliation-required", "permanently-failed"],
  "reconciliation-required": [
    "accepted",
    "accepted-with-errors",
    "rejected",
    "retry-wait",
    "permanently-failed",
  ],
  accepted: [],
  "accepted-with-errors": [],
  rejected: [],
  "permanently-failed": [],
});

export function isAllowedDurableTransition(
  from: string | null,
  to: string,
): boolean {
  if (!durableStates.has(to)) return false;
  if (from === null) return to === "pending";
  return durableStates.has(from) && (transitions[from]?.includes(to) ?? false);
}

export function validateJournalTransition(
  entry: JournalEntry,
  context: FiscalContext,
  expectedVersion: number,
  previousState: string | null,
): StoreResult<JournalEntry> {
  if (
    !entry ||
    createFiscalContext(entry.context).status !== "ok" ||
    !sameContext(entry.context, context) ||
    entry.schemaVersion !== 1 ||
    !isSafeStoreToken(entry.aggregateId) ||
    !isSafeStoreToken(entry.commandId) ||
    !isSafeStoreToken(entry.correlationId) ||
    !isSafeStoreToken(entry.eventCode) ||
    !Number.isSafeInteger(entry.version) ||
    entry.version !== expectedVersion + 1 ||
    entry.priorState !== previousState ||
    !isAllowedDurableTransition(previousState, entry.nextState) ||
    createFiscalInstant(entry.occurredAt).status !== "ok" ||
    !["host", "backend", "protocol"].includes(entry.instantSource) ||
    !Array.isArray(entry.artifactIds) ||
    entry.artifactIds.some((id) => !isSafeStoreToken(id)) ||
    !Array.isArray(entry.claimIds) ||
    entry.claimIds.some((id) => !isSafeStoreToken(id)) ||
    !Array.isArray(entry.safeDiagnostics) ||
    entry.safeDiagnostics.length > 32 ||
    entry.safeDiagnostics.some(
      (code) => !/^DIAG-[A-Z0-9_-]{1,100}$/u.test(code),
    )
  )
    return storeFailure("invalid", "invalid-input");
  return {
    status: "ok",
    value: Object.freeze({
      ...entry,
      context: Object.freeze({ ...entry.context }),
      artifactIds: Object.freeze([...entry.artifactIds]),
      claimIds: Object.freeze([...entry.claimIds]),
      safeDiagnostics: Object.freeze([...entry.safeDiagnostics]),
    }),
  };
}

export async function appendJournalTransition(
  store: JournalStore,
  token: TransactionToken,
  input: {
    readonly entry: JournalEntry;
    readonly expectedVersion: number;
    readonly previousState: string | null;
  },
): Promise<StoreResult<"created" | "replayed">> {
  if (
    !store ||
    store.contractVersion !== PERSISTENCE_PORT_CONTRACT_VERSION ||
    token.capabilityLevel !== "atomic-host" ||
    !sameContext(token.context, input?.entry?.context)
  )
    return storeFailure("invalid", "unsupported-capability");
  const checked = validateJournalTransition(
    input.entry,
    token.context,
    input.expectedVersion,
    input.previousState,
  );
  if (checked.status !== "ok") return checked;
  return store.append(token, checked.value);
}
