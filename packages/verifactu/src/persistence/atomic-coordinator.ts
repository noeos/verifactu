import { sameContext } from "../domain/context.js";
import type {
  ArtifactDescriptor,
  EvidenceClaim,
  IdempotencyBinding,
  ImmutableRecord,
  JournalEntry,
  OutboxItem,
  RecoveryCheckpoint,
  SequenceHead,
  StoreResult,
} from "./model.js";
import { isSafeStoreToken, storeFailure } from "./model.js";
import type { PersistencePorts, HostPublicationFact } from "./ports.js";
import { beginUnitOfWork, type UnitOfWorkSession } from "./unit-of-work.js";

export interface AtomicCommitInput {
  readonly context: ImmutableRecord["context"];
  readonly commandId: string;
  readonly canonicalDigest: string;
  readonly publication: HostPublicationFact;
  readonly record: ImmutableRecord;
  readonly artifacts: readonly {
    readonly descriptor: ArtifactDescriptor;
    readonly bytes: Uint8Array;
  }[];
  readonly evidence: readonly EvidenceClaim[];
  readonly journal: readonly JournalEntry[];
  readonly outbox: readonly OutboxItem[];
  readonly expectedHead: SequenceHead;
  readonly nextHead: SequenceHead;
  /** Optional durable checkpoint advancement, staged with the full publication UoW. */
  readonly checkpoint?: RecoveryCheckpoint;
  readonly signal?: AbortSignal;
  /** Best-effort notification after commit; durable outbox discovery is authoritative. */
  readonly notifyOutbox?: () => Promise<void>;
}

export type AtomicCommitResult =
  | { readonly status: "committed"; readonly commitId: string }
  | {
      readonly status: "indeterminate";
      readonly code: "local-commit-indeterminate";
    }
  | {
      readonly status: "conflict" | "invalid" | "unavailable";
      readonly code: string;
    };

function asCommitFailure(
  result: Exclude<StoreResult<unknown>, { readonly status: "ok" }>,
): AtomicCommitResult {
  if (result.status === "indeterminate" || result.code === "unknown-commit")
    return { status: "indeterminate", code: "local-commit-indeterminate" };
  return { status: result.status, code: result.code };
}

const isDigest = (value: unknown): value is string =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value);

export async function commitFiscalPublication(
  ports: PersistencePorts,
  input: AtomicCommitInput,
): Promise<AtomicCommitResult> {
  if (
    !input ||
    !input.context ||
    !input.record ||
    !sameContext(input.context, input.record.context) ||
    !isSafeStoreToken(input.commandId) ||
    !/^sha256:[0-9a-f]{64}$/u.test(input.canonicalDigest) ||
    !input.publication ||
    !input.expectedHead ||
    !input.nextHead ||
    input.publication.commandId !== input.commandId ||
    input.publication.canonicalDigest !== input.canonicalDigest ||
    !Array.isArray(input.artifacts) ||
    !Array.isArray(input.evidence) ||
    !Array.isArray(input.journal) ||
    !Array.isArray(input.outbox) ||
    input.artifacts.length > 500 ||
    input.evidence.length > 500 ||
    input.journal.length > 1000 ||
    input.outbox.length > 500
  )
    return { status: "invalid", code: "invalid-input" };
  if (
    input.checkpoint &&
    (!isSafeStoreToken(input.checkpoint.storeId) ||
      !input.checkpoint.context ||
      !sameContext(input.checkpoint.context, input.context) ||
      input.checkpoint.schemaVersion !== input.nextHead.schemaVersion ||
      input.checkpoint.generation !== input.nextHead.generation ||
      input.checkpoint.headDigest !== input.nextHead.officialFingerprint ||
      !Number.isSafeInteger(input.checkpoint.journalVersion) ||
      input.checkpoint.journalVersion < 0 ||
      !isDigest(input.checkpoint.manifestDigest) ||
      (input.checkpoint.previousCheckpointDigest !== null &&
        !isDigest(input.checkpoint.previousCheckpointDigest)) ||
      !isDigest(input.checkpoint.externalAnchorDigest))
  )
    return { status: "invalid", code: "invalid-input" };

  const opened = await beginUnitOfWork(ports, {
    context: input.context,
    commandId: input.commandId,
    canonicalDigest: input.canonicalDigest,
    ...(input.signal ? { signal: input.signal } : {}),
  });
  if (opened.status !== "ok") return asCommitFailure(opened);
  const unit = opened.value;
  const identity: IdempotencyBinding = Object.freeze({
    context: input.context,
    commandId: input.commandId,
    canonicalDigest: input.canonicalDigest as `sha256:${string}`,
    resultDigest: null,
  });
  const record = await unit.appendRecord(input.record, identity);
  if (record.status !== "ok") return rollbackAfterStageFailure(unit, record);

  for (const artifact of input.artifacts) {
    const result = await unit.putArtifact(artifact.descriptor, artifact.bytes);
    if (result.status !== "ok") return rollbackAfterStageFailure(unit, result);
  }
  for (const claim of input.evidence) {
    const result = await unit.appendEvidence(claim);
    if (result.status !== "ok") return rollbackAfterStageFailure(unit, result);
  }
  for (const entry of input.journal) {
    const result = await unit.appendJournal(entry);
    if (result.status !== "ok") return rollbackAfterStageFailure(unit, result);
  }
  for (const item of input.outbox) {
    const result = await unit.appendOutbox(item);
    if (result.status !== "ok") return rollbackAfterStageFailure(unit, result);
  }

  const head = await unit.compareAndAppendHead(
    input.expectedHead,
    {
      ...input.nextHead,
      commitId: unit.token.transactionId,
    },
    input.record,
  );
  if (head.status !== "ok") return rollbackAfterStageFailure(unit, head);
  if (input.checkpoint) {
    const checkpoint = await unit.appendRecoveryCheckpoint(
      input.checkpoint,
      input.checkpoint.previousCheckpointDigest,
    );
    if (checkpoint.status !== "ok")
      return rollbackAfterStageFailure(unit, checkpoint);
  }
  const host = await unit.stagePublication(input.publication);
  if (host.status !== "ok") return rollbackAfterStageFailure(unit, host);
  const result = await unit.commit();
  if (result.status !== "ok") {
    if (unit.state === "active") {
      const rolledBack = await unit.rollback();
      if (rolledBack.status !== "ok")
        return { status: "indeterminate", code: "local-commit-indeterminate" };
      return asCommitFailure(result);
    }
    if (unit.state === "indeterminate") {
      let resolution: StoreResult<{
        readonly committed: boolean;
        readonly commitId: string | null;
      }>;
      try {
        resolution = await ports.hostUnitOfWork.resolveUnknownCommit({
          context: input.context,
          commandId: input.commandId,
          canonicalDigest: input.canonicalDigest,
        });
      } catch {
        return { status: "indeterminate", code: "local-commit-indeterminate" };
      }
      if (
        resolution.status !== "ok" ||
        !resolution.value ||
        typeof resolution.value.committed !== "boolean" ||
        (resolution.value.committed
          ? !isSafeStoreToken(resolution.value.commitId)
          : resolution.value.commitId !== null)
      )
        return { status: "indeterminate", code: "local-commit-indeterminate" };
      if (resolution.value.committed)
        return { status: "committed", commitId: resolution.value.commitId! };
      return { status: "unavailable", code: "local-commit-not-applied" };
    }
    return asCommitFailure(result);
  }
  if (input.notifyOutbox) {
    try {
      await input.notifyOutbox();
    } catch {
      /* polling finds the committed outbox item */
    }
  }
  return { status: "committed", commitId: result.value.commitId };
}

async function rollbackAfterStageFailure(
  unit: UnitOfWorkSession,
  failure: Exclude<StoreResult<unknown>, { readonly status: "ok" }>,
): Promise<AtomicCommitResult> {
  try {
    const rolledBack = await unit.rollback();
    if (rolledBack.status === "ok") return asCommitFailure(failure);
  } catch {
    // An unacknowledged rollback leaves the transaction outcome unknown.
  }
  return { status: "indeterminate", code: "local-commit-indeterminate" };
}
