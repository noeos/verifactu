import { sameContext } from "../domain/context.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalInstant } from "../domain/date-time.js";
import type {
  OutboxState,
  RecoveryCheckpoint,
  SequenceHead,
  StoreResult,
} from "./model.js";
import { isSafeStoreToken, storeFailure } from "./model.js";
import {
  PERSISTENCE_PORT_CONTRACT_VERSION,
  type RecoveryCheckpointStore,
} from "./ports.js";

export type { RecoveryCheckpoint } from "./model.js";

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

const MAX_CHECKPOINT_READ_TIMEOUT_MS = 3_600_000;

function blockedRecovery(
  input: Omit<
    RecoveryObservation,
    "latestCheckpoint" | "checkpointChainVerified"
  >,
  diagnostic: string,
): StoreResult<RecoveryDecision> {
  const assessed = assessStartupRecovery({
    ...input,
    latestCheckpoint: null,
    checkpointChainVerified: false,
  });
  if (assessed.status !== "ok") return assessed;
  return {
    status: "ok",
    value: Object.freeze({
      ...assessed.value,
      status: "blocked",
      workerDiscoveryAllowed: false,
      networkAllowed: false,
      reasons: Object.freeze(
        [...new Set([...assessed.value.reasons, diagnostic])].sort(),
      ),
    }),
  };
}

/**
 * Read the persisted checkpoint through its bounded adapter port before
 * assessing startup. Timeout, cancellation, thrown adapter errors and
 * unavailable results all fence workers and network activity.
 */
export async function assessStartupRecoveryFromStore(
  input: Omit<
    RecoveryObservation,
    "latestCheckpoint" | "checkpointChainVerified"
  >,
  checkpoints: RecoveryCheckpointStore,
  options: { readonly timeoutMs: number; readonly signal?: AbortSignal },
): Promise<StoreResult<RecoveryDecision>> {
  if (
    !input ||
    !checkpoints ||
    !options ||
    checkpoints.contractVersion !== PERSISTENCE_PORT_CONTRACT_VERSION ||
    typeof checkpoints.readLatest !== "function" ||
    !Number.isSafeInteger(options?.timeoutMs) ||
    options.timeoutMs < 1 ||
    options.timeoutMs > MAX_CHECKPOINT_READ_TIMEOUT_MS
  )
    return storeFailure("invalid", "invalid-input");
  if (options.signal?.aborted)
    return blockedRecovery(input, "DIAG-CHECKPOINT-READ-ABORTED");

  const controller = new globalThis.AbortController();
  let onAbort: (() => void) | undefined;
  let resolveTimeout!: (value: { readonly kind: "timeout" }) => void;
  let resolveAbort!: (value: { readonly kind: "aborted" }) => void;
  const timeout = new Promise<{ readonly kind: "timeout" }>((resolve) => {
    resolveTimeout = resolve;
  });
  const aborted = new Promise<{ readonly kind: "aborted" }>((resolve) => {
    resolveAbort = resolve;
  });
  const timeoutHandle = globalThis.setTimeout(() => {
    controller.abort();
    resolveTimeout({ kind: "timeout" });
  }, options.timeoutMs);
  if (options.signal) {
    onAbort = () => {
      controller.abort();
      resolveAbort({ kind: "aborted" });
    };
    options.signal.addEventListener("abort", onAbort, { once: true });
  }

  const read = Promise.resolve()
    .then(() =>
      checkpoints.readLatest({
        storeId: input.storeId,
        context: input.context,
        signal: controller.signal,
      }),
    )
    .then(
      (result) => ({ kind: "result" as const, result }),
      () => ({ kind: "unavailable" as const }),
    );
  try {
    const outcome = await Promise.race([read, timeout, aborted]);
    if (outcome.kind === "timeout")
      return blockedRecovery(input, "DIAG-CHECKPOINT-READ-TIMEOUT");
    if (outcome.kind === "aborted")
      return blockedRecovery(input, "DIAG-CHECKPOINT-READ-ABORTED");
    if (outcome.kind === "unavailable" || outcome.result.status !== "ok")
      return blockedRecovery(input, "DIAG-CHECKPOINT-READ-UNAVAILABLE");
    const value = outcome.result.value;
    if (
      !value ||
      typeof value.chainVerified !== "boolean" ||
      (value.checkpoint !== null && typeof value.checkpoint !== "object")
    )
      return blockedRecovery(input, "DIAG-CHECKPOINT-READ-UNAVAILABLE");
    return assessStartupRecovery({
      ...input,
      latestCheckpoint: value.checkpoint,
      checkpointChainVerified: value.chainVerified,
    });
  } finally {
    globalThis.clearTimeout(timeoutHandle);
    if (options.signal && onAbort)
      options.signal.removeEventListener("abort", onAbort);
  }
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
      checkpoint.createdAt &&
      createFiscalInstant(checkpoint.createdAt).status === "ok" &&
      Date.parse(checkpoint.createdAt) > Date.parse(input.observedAt)
    )
      reasons.add("DIAG-CHECKPOINT-FUTURE");
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
      (checkpoint.generation === 0
        ? checkpoint.headDigest !== null
        : typeof checkpoint.headDigest !== "string" ||
          !/^sha256:[0-9a-f]{64}$/u.test(checkpoint.headDigest)) ||
      (checkpoint.previousCheckpointDigest !== null &&
        !/^sha256:[0-9a-f]{64}$/u.test(checkpoint.previousCheckpointDigest)) ||
      typeof checkpoint.externalAnchorDigest !== "string" ||
      !/^sha256:[0-9a-f]{64}$/u.test(checkpoint.externalAnchorDigest)
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
    reasons.has("DIAG-CHECKPOINT-FUTURE") ||
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
