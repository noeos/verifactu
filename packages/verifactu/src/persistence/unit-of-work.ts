import { createFiscalContext, sameContext } from "../domain/context.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalInstant } from "../domain/date-time.js";
import type {
  ArtifactDescriptor,
  EvidenceClaim,
  IdempotencyBinding,
  ImmutableRecord,
  JournalEntry,
  OutboxItem,
  RecoveryCheckpoint,
  Sha256,
  SequenceHead,
  StoreResult,
} from "./model.js";
import {
  contextMatches,
  isSafeStoreToken,
  storeFailure,
  validateArtifact,
  validateEvidenceClaim,
  validateRecord,
} from "./model.js";
import { validateHeadAdvance } from "./head-cas.js";
import { isIdentity } from "../domain/identities.js";
import type {
  HostPublicationFact,
  PersistencePorts,
  TransactionToken,
} from "./ports.js";
import { PERSISTENCE_PORT_CONTRACT_VERSION } from "./ports.js";

export interface BeginUnitOfWorkInput {
  readonly context: FiscalContext;
  readonly commandId: string;
  readonly canonicalDigest: string;
  readonly signal?: AbortSignal;
}

export type UnitOfWorkState =
  | "active"
  | "committed"
  | "rolled-back"
  | "indeterminate";

export interface UnitOfWorkSession {
  readonly token: TransactionToken;
  readonly state: UnitOfWorkState;
  stagePublication(
    publication: HostPublicationFact,
  ): Promise<StoreResult<"staged">>;
  appendRecord(
    record: ImmutableRecord,
    identity: IdempotencyBinding,
  ): Promise<StoreResult<"created" | "replayed">>;
  putArtifact(
    descriptor: ArtifactDescriptor,
    bytes: Uint8Array,
  ): Promise<StoreResult<"created" | "replayed">>;
  appendEvidence(
    claim: EvidenceClaim,
  ): Promise<StoreResult<"created" | "replayed">>;
  appendJournal(
    entry: JournalEntry,
  ): Promise<StoreResult<"created" | "replayed">>;
  appendRecoveryCheckpoint(
    checkpoint: RecoveryCheckpoint,
    expectedPreviousDigest: Sha256 | null,
  ): Promise<StoreResult<"created" | "replayed">>;
  appendOutbox(item: OutboxItem): Promise<StoreResult<"created" | "replayed">>;
  compareAndAppendHead(
    expected: SequenceHead,
    next: SequenceHead,
    record: ImmutableRecord,
  ): Promise<StoreResult<"advanced">>;
  commit(): Promise<StoreResult<{ readonly commitId: string }>>;
  rollback(): Promise<StoreResult<"rolled-back" | "already-terminal">>;
}

const validDigest = (value: unknown): value is string =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value);

class Session implements UnitOfWorkSession {
  private currentState: UnitOfWorkState = "active";
  private hostPublicationStaged = false;
  private tail: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly ports: PersistencePorts,
    readonly token: TransactionToken,
    private readonly signal?: AbortSignal,
  ) {}

  get state(): UnitOfWorkState {
    return this.currentState;
  }

  stagePublication(
    publication: HostPublicationFact,
  ): Promise<StoreResult<"staged">> {
    return this.stage(async () => {
      if (this.hostPublicationStaged)
        return storeFailure("conflict", "idempotency-conflict");
      if (
        !publication ||
        !isSafeStoreToken(publication.publicationId) ||
        !Number.isSafeInteger(publication.revision) ||
        publication.revision < 1 ||
        publication.commandId !== this.token.commandId ||
        publication.canonicalDigest !== this.token.canonicalDigest ||
        !validInstant(publication.createdAt)
      )
        return storeFailure("invalid", "invalid-input");
      const result = await this.ports.hostUnitOfWork.stageHostPublication(
        this.token,
        Object.freeze({ ...publication }),
      );
      if (result.status === "ok") this.hostPublicationStaged = true;
      return result;
    });
  }

  appendRecord(
    record: ImmutableRecord,
    identity: IdempotencyBinding,
  ): Promise<StoreResult<"created" | "replayed">> {
    return this.stage(async () => {
      const validated = validateRecord(record);
      if (validated.status !== "ok") return validated;
      if (
        !sameContext(record.context, this.token.context) ||
        !identity ||
        !sameContext(identity.context, this.token.context) ||
        identity.commandId !== this.token.commandId ||
        identity.canonicalDigest !== this.token.canonicalDigest
      )
        return storeFailure("invalid", "context-mismatch");
      return this.ports.records.append(
        this.token,
        validated.value,
        Object.freeze({ ...identity }),
      );
    });
  }

  putArtifact(
    descriptor: ArtifactDescriptor,
    bytes: Uint8Array,
  ): Promise<StoreResult<"created" | "replayed">> {
    return this.stage(async () => {
      if (
        !descriptor ||
        !descriptor.context ||
        !contextMatches(descriptor.context, this.token.context)
      )
        return storeFailure("invalid", "context-mismatch");
      const validated = validateArtifact(descriptor, bytes);
      if (validated.status !== "ok") return validated;
      return this.ports.artifacts.put(
        this.token,
        validated.value.descriptor,
        validated.value.bytes,
      );
    });
  }

  appendEvidence(
    claim: EvidenceClaim,
  ): Promise<StoreResult<"created" | "replayed">> {
    return this.stage(async () => {
      const checked = validateEvidenceClaim(claim);
      if (checked.status !== "ok") return checked;
      if (!contextMatches(checked.value.context, this.token.context))
        return storeFailure("invalid", "context-mismatch");
      return this.ports.evidence.append(this.token, checked.value);
    });
  }

  appendJournal(
    entry: JournalEntry,
  ): Promise<StoreResult<"created" | "replayed">> {
    return this.stage(async () => {
      if (
        !entry ||
        !contextMatches(entry.context, this.token.context) ||
        !isIdentity(entry.id, "event") ||
        !isSafeStoreToken(entry.aggregateId) ||
        !isSafeStoreToken(entry.commandId) ||
        entry.commandId !== this.token.commandId ||
        !validInstant(entry.occurredAt) ||
        !Number.isSafeInteger(entry.version) ||
        entry.version < 1 ||
        !Array.isArray(entry.safeDiagnostics) ||
        entry.safeDiagnostics.length > 32 ||
        entry.safeDiagnostics.some(
          (value) => !/^DIAG-[A-Z0-9_-]{1,100}$/u.test(value),
        )
      )
        return storeFailure("invalid", "invalid-input");
      return this.ports.journal.append(this.token, freezeJournal(entry));
    });
  }

  appendRecoveryCheckpoint(
    checkpoint: RecoveryCheckpoint,
    expectedPreviousDigest: Sha256 | null,
  ): Promise<StoreResult<"created" | "replayed">> {
    return this.stage(async () => {
      if (
        !checkpoint ||
        !isSafeStoreToken(checkpoint.storeId) ||
        !sameContext(checkpoint.context, this.token.context) ||
        !Number.isSafeInteger(checkpoint.schemaVersion) ||
        checkpoint.schemaVersion < 1 ||
        !Number.isSafeInteger(checkpoint.generation) ||
        checkpoint.generation < 0 ||
        !Number.isSafeInteger(checkpoint.journalVersion) ||
        checkpoint.journalVersion < 0 ||
        (checkpoint.headDigest !== null &&
          !validDigest(checkpoint.headDigest)) ||
        !validDigest(checkpoint.manifestDigest) ||
        (expectedPreviousDigest !== null &&
          !validDigest(expectedPreviousDigest)) ||
        checkpoint.previousCheckpointDigest !== expectedPreviousDigest ||
        !validDigest(checkpoint.externalAnchorDigest) ||
        !validInstant(checkpoint.createdAt)
      )
        return storeFailure("invalid", "invalid-input");
      return this.ports.checkpoints.compareAndAppend(
        this.token,
        expectedPreviousDigest,
        Object.freeze({
          ...checkpoint,
          context: Object.freeze({ ...checkpoint.context }),
        }),
      );
    });
  }

  appendOutbox(item: OutboxItem): Promise<StoreResult<"created" | "replayed">> {
    return this.stage(async () => {
      if (
        !item ||
        !contextMatches(item.context, this.token.context) ||
        !isSafeStoreToken(item.outboxId) ||
        !isSafeStoreToken(item.operationId) ||
        !validInstant(item.eligibleAt) ||
        !Array.isArray(item.recordIds) ||
        item.recordIds.length === 0 ||
        item.recordIds.some((id) => !isIdentity(id, "record")) ||
        !Array.isArray(item.artifactIds) ||
        item.artifactIds.some((id) => !isSafeStoreToken(id)) ||
        !Number.isSafeInteger(item.version) ||
        item.version < 1 ||
        item.state !== "pending" ||
        item.attemptCount !== 0 ||
        item.fencingToken !== 0 ||
        item.reconciliationRequired
      )
        return storeFailure("invalid", "invalid-input");
      return this.ports.outbox.append(this.token, freezeOutbox(item));
    });
  }

  compareAndAppendHead(
    expected: SequenceHead,
    next: SequenceHead,
    record: ImmutableRecord,
  ): Promise<StoreResult<"advanced">> {
    return this.stage(async () => {
      if (
        !expected ||
        !next ||
        !sameContext(expected.context, this.token.context) ||
        !sameContext(next.context, this.token.context) ||
        !sameContext(record.context, this.token.context) ||
        next.generation !== expected.generation + 1 ||
        next.lastRecordId?.value !== record.id.value ||
        next.officialFingerprint !== record.semanticDigest
      )
        return storeFailure("invalid", "context-mismatch");
      const checked = validateHeadAdvance(
        expected,
        { ...next, commitId: this.token.transactionId },
        record,
      );
      if (checked.status !== "ok") return checked;
      return this.ports.heads.compareAndAppend(
        this.token,
        expected,
        { ...next, commitId: this.token.transactionId },
        record,
      );
    });
  }

  async commit(): Promise<StoreResult<{ readonly commitId: string }>> {
    return this.enqueue(async () => {
      if (this.currentState !== "active")
        return storeFailure("conflict", "invalid-input");
      if (this.signal?.aborted) {
        try {
          const rolledBack = await this.ports.hostUnitOfWork.rollback(
            this.token,
          );
          this.currentState =
            rolledBack.status === "ok" ? "rolled-back" : "indeterminate";
          return rolledBack.status === "ok"
            ? storeFailure("unavailable", "unavailable")
            : rolledBack;
        } catch {
          this.currentState = "indeterminate";
          return storeFailure("indeterminate", "unknown-commit");
        }
      }
      if (
        this.token.capabilityLevel === "atomic-host" &&
        !this.hostPublicationStaged
      )
        return storeFailure("invalid", "unsupported-capability");
      let result: StoreResult<{ readonly commitId: string }>;
      try {
        result = await this.ports.hostUnitOfWork.commit(this.token);
      } catch {
        this.currentState = "indeterminate";
        return storeFailure("indeterminate", "unknown-commit");
      }
      if (result.status === "ok") this.currentState = "committed";
      else if (
        result.status === "indeterminate" ||
        result.code === "unknown-commit"
      )
        this.currentState = "indeterminate";
      return result;
    });
  }

  async rollback(): Promise<StoreResult<"rolled-back" | "already-terminal">> {
    return this.enqueue(async () => {
      if (
        this.currentState === "committed" ||
        this.currentState === "indeterminate"
      )
        return storeFailure("conflict", "unknown-commit");
      if (this.currentState === "rolled-back")
        return { status: "ok", value: "already-terminal" };
      let result: StoreResult<"rolled-back" | "already-terminal">;
      try {
        result = await this.ports.hostUnitOfWork.rollback(this.token);
      } catch {
        this.currentState = "indeterminate";
        return storeFailure("indeterminate", "unknown-commit");
      }
      if (result.status === "ok") this.currentState = "rolled-back";
      else this.currentState = "indeterminate";
      return result;
    });
  }

  private stage<T>(
    operation: () => Promise<StoreResult<T>>,
  ): Promise<StoreResult<T>> {
    return this.enqueue(async () => {
      if (this.currentState !== "active")
        return storeFailure("conflict", "invalid-input");
      if (this.signal?.aborted)
        return storeFailure("unavailable", "unavailable");
      try {
        return await operation();
      } catch {
        return storeFailure("unavailable", "unavailable");
      }
    });
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const current = this.tail.then(operation, operation);
    this.tail = current.then(
      () => undefined,
      () => undefined,
    );
    return current;
  }
}

function validInstant(value: unknown): value is string {
  return (
    typeof value === "string" && createFiscalInstant(value).status === "ok"
  );
}
function freezeJournal(entry: JournalEntry): JournalEntry {
  return Object.freeze({
    ...entry,
    context: Object.freeze({ ...entry.context }),
    artifactIds: Object.freeze([...entry.artifactIds]),
    claimIds: Object.freeze([...entry.claimIds]),
    safeDiagnostics: Object.freeze([...entry.safeDiagnostics]),
  });
}
function freezeOutbox(item: OutboxItem): OutboxItem {
  return Object.freeze({
    ...item,
    context: Object.freeze({ ...item.context }),
    recordIds: Object.freeze(
      item.recordIds.map((id) => Object.freeze({ ...id })),
    ),
    artifactIds: Object.freeze([...item.artifactIds]),
  });
}

export async function beginUnitOfWork(
  ports: PersistencePorts,
  input: BeginUnitOfWorkInput,
): Promise<StoreResult<UnitOfWorkSession>> {
  const context = input?.context ? createFiscalContext(input.context) : null;
  const validPort = (
    port: { readonly contractVersion?: number } | null | undefined,
    methods: readonly string[],
  ): boolean =>
    !!port &&
    port.contractVersion === PERSISTENCE_PORT_CONTRACT_VERSION &&
    methods.every(
      (method) =>
        typeof (port as unknown as Readonly<Record<string, unknown>>)[
          method
        ] === "function",
    );
  const portFamiliesValid =
    !!ports &&
    validPort(ports.records, ["append", "get", "list"]) &&
    validPort(ports.artifacts, ["put", "get", "list"]) &&
    validPort(ports.evidence, ["append", "get", "list"]) &&
    validPort(ports.journal, ["append", "list"]) &&
    validPort(ports.outbox, ["append", "get", "discover"]) &&
    validPort(ports.heads, ["read", "compareAndAppend"]) &&
    validPort(ports.leases, ["claim", "renew", "release", "complete"]) &&
    validPort(ports.checkpoints, ["readLatest", "compareAndAppend"]);
  if (
    !ports ||
    !ports.hostUnitOfWork ||
    ports.capabilityLevel !== ports.hostUnitOfWork.capabilityLevel ||
    ports.adapterId !== ports.hostUnitOfWork.adapterId ||
    ports.hostUnitOfWork.contractVersion !==
      PERSISTENCE_PORT_CONTRACT_VERSION ||
    ports.hostUnitOfWork.capabilityLevel !== "atomic-host" ||
    !portFamiliesValid ||
    !input ||
    context?.status !== "ok" ||
    !isSafeStoreToken(input.commandId) ||
    !validDigest(input.canonicalDigest) ||
    input.signal?.aborted
  )
    return storeFailure("invalid", "unsupported-capability");
  let result: StoreResult<TransactionToken>;
  try {
    result = await ports.hostUnitOfWork.begin({
      context: context.value,
      commandId: input.commandId,
      canonicalDigest: input.canonicalDigest,
      ...(input.signal ? { signal: input.signal } : {}),
    });
  } catch {
    return storeFailure("unavailable", "unavailable");
  }
  if (result.status !== "ok") return result;
  const token = result.value;
  if (
    token.adapterId !== ports.adapterId ||
    token.capabilityLevel !== "atomic-host" ||
    token.commandId !== input.commandId ||
    token.canonicalDigest !== input.canonicalDigest ||
    !sameContext(token.context, input.context) ||
    !isSafeStoreToken(token.transactionId)
  ) {
    try {
      await ports.hostUnitOfWork.rollback(token);
    } catch {
      /* invalid token cannot be safely adopted */
    }
    return storeFailure("invalid", "context-mismatch");
  }
  return {
    status: "ok",
    value: new Session(ports, Object.freeze({ ...token }), input.signal),
  };
}
