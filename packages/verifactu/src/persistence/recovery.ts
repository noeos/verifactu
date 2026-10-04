import { sameContext } from "../domain/context.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalInstant } from "../domain/date-time.js";
import type { OutboxState, SequenceHead, StoreResult } from "./model.js";
import { isSafeStoreToken, storeFailure } from "./model.js";

export interface RecoveryCheckpoint {
  readonly storeId: string;
  readonly context: FiscalContext;
  readonly schemaVersion: number;
  readonly generation: number;
  readonly headDigest: string | null;
  readonly journalVersion: number;
  readonly manifestDigest: string;
  readonly previousCheckpointDigest: string | null;
  readonly createdAt: string;
  readonly externalAnchorDigest: string | null;
}

export interface RecoveryObservation {
  readonly storeId: string;
  readonly context: FiscalContext;
  readonly schemaVersion: number;
  readonly generation: number;
  readonly head: SequenceHead;
  readonly journalVersion: number;
  readonly latestCheckpoint: RecoveryCheckpoint | null;
  readonly checkpointChainVerified: boolean;
  readonly artifactClosureVerified: boolean;
  readonly eventChainVerified: boolean;
  readonly observedAt: string;
  readonly pendingOutboxStates: readonly OutboxState[];
}

export interface RecoveryDecision {
  readonly status: "ready" | "blocked";
  readonly workerDiscoveryAllowed: boolean;
  readonly networkAllowed: boolean;
  readonly attemptsRequiringReconciliation: number;
  readonly reasons: readonly string[];
}

export function assessStartupRecovery(
  input: RecoveryObservation,
): StoreResult<RecoveryDecision> {
  const outboxStates: readonly OutboxState[] = [
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
  ];
  if (
    !input ||
    !isSafeStoreToken(input.storeId) ||
    !input.context ||
    !input.head ||
    !Number.isSafeInteger(input.schemaVersion) ||
    input.schemaVersion < 1 ||
    !Number.isSafeInteger(input.generation) ||
    input.generation < 0 ||
    !Number.isSafeInteger(input.journalVersion) ||
    input.journalVersion < 0 ||
    createFiscalInstant(input.observedAt).status !== "ok" ||
    !Array.isArray(input.pendingOutboxStates) ||
    input.pendingOutboxStates.some((state) => !outboxStates.includes(state)) ||
    !Number.isSafeInteger(input.head.generation) ||
    input.head.generation < 0 ||
    input.head.schemaVersion !== input.schemaVersion
  )
    return storeFailure("invalid", "invalid-input");

  const reasons = new Set<string>();
  const checkpoint = input.latestCheckpoint;
  if (!checkpoint) reasons.add("DIAG-CHECKPOINT-MISSING");
  else {
    if (
      checkpoint.storeId !== input.storeId ||
      !sameContext(checkpoint.context, input.context) ||
      checkpoint.schemaVersion !== input.schemaVersion ||
      !Number.isSafeInteger(checkpoint.generation) ||
      checkpoint.generation < 0 ||
      !Number.isSafeInteger(checkpoint.journalVersion) ||
      checkpoint.journalVersion < 0 ||
      createFiscalInstant(checkpoint.createdAt).status !== "ok"
    )
      reasons.add("DIAG-CHECKPOINT-IDENTITY");
    if (
      input.generation < checkpoint.generation ||
      input.journalVersion < checkpoint.journalVersion
    )
      reasons.add("DIAG-ROLLBACK-DETECTED");
    if (
      input.generation === checkpoint.generation &&
      input.head.officialFingerprint !== checkpoint.headDigest
    )
      reasons.add("DIAG-CHECKPOINT-HEAD-MISMATCH");
    if (
      !input.checkpointChainVerified ||
      typeof checkpoint.manifestDigest !== "string" ||
      !/^sha256:[0-9a-f]{64}$/u.test(checkpoint.manifestDigest) ||
      (checkpoint.previousCheckpointDigest !== null &&
        !/^sha256:[0-9a-f]{64}$/u.test(checkpoint.previousCheckpointDigest))
    )
      reasons.add("DIAG-CHECKPOINT-CHAIN");
  }
  if (!input.artifactClosureVerified) reasons.add("DIAG-ARTIFACT-CLOSURE");
  if (!input.eventChainVerified) reasons.add("DIAG-JOURNAL-CLOSURE");
  if (input.head.generation !== input.generation)
    reasons.add("DIAG-HEAD-READBACK");
  if (!sameContext(input.head.context, input.context))
    reasons.add("DIAG-CONTEXT-MISMATCH");
  const uncertain = input.pendingOutboxStates.filter(
    (state) => state === "attempt-started" || state === "indeterminate",
  ).length;
  if (uncertain > 0) reasons.add("DIAG-RECONCILIATION-REQUIRED");
  const blocked =
    reasons.has("DIAG-CHECKPOINT-MISSING") ||
    reasons.has("DIAG-CHECKPOINT-IDENTITY") ||
    reasons.has("DIAG-ROLLBACK-DETECTED") ||
    reasons.has("DIAG-CHECKPOINT-HEAD-MISMATCH") ||
    reasons.has("DIAG-CHECKPOINT-CHAIN") ||
    reasons.has("DIAG-ARTIFACT-CLOSURE") ||
    reasons.has("DIAG-JOURNAL-CLOSURE") ||
    reasons.has("DIAG-HEAD-READBACK") ||
    reasons.has("DIAG-CONTEXT-MISMATCH");
  return {
    status: "ok",
    value: Object.freeze({
      status: blocked ? "blocked" : "ready",
      workerDiscoveryAllowed: !blocked,
      networkAllowed: !blocked,
      attemptsRequiringReconciliation: uncertain,
      reasons: Object.freeze([...reasons].sort()),
    }),
  };
}
