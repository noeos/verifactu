import type { FiscalContext } from "../domain/context.js";
import type {
  ArtifactDescriptor,
  ArtifactObject,
  EvidenceClaim,
  IdempotencyBinding,
  ImmutableRecord,
  JournalEntry,
  OutboxItem,
  SequenceHead,
  StoreCapabilityLevel,
  StoreResult,
} from "./model.js";

/** Runtime value shared by every host and store port in this contract. */
export const PERSISTENCE_PORT_CONTRACT_VERSION = 1 as const;

export interface StorePage<T> {
  readonly items: readonly T[];
  readonly snapshotId: string;
  readonly nextCursor: string | null;
  readonly complete: boolean;
}

export interface PageQuery {
  readonly context: FiscalContext;
  readonly limit: number;
  readonly cursor?: string;
  readonly snapshotId?: string;
}

/** The token is created by one adapter and is valid only for its live UoW. */
export interface TransactionToken {
  readonly adapterId: string;
  readonly transactionId: string;
  readonly context: FiscalContext;
  readonly commandId: string;
  readonly canonicalDigest: string;
  readonly capabilityLevel: StoreCapabilityLevel;
}

export interface RecordStore {
  readonly contractVersion: typeof PERSISTENCE_PORT_CONTRACT_VERSION;
  append(
    token: TransactionToken,
    record: ImmutableRecord,
    idempotency: IdempotencyBinding,
  ): Promise<StoreResult<"created" | "replayed">>;
  get(
    context: FiscalContext,
    recordId: string,
  ): Promise<StoreResult<ImmutableRecord>>;
  list(query: PageQuery): Promise<StoreResult<StorePage<ImmutableRecord>>>;
}

export interface ArtifactStore {
  readonly contractVersion: typeof PERSISTENCE_PORT_CONTRACT_VERSION;
  put(
    token: TransactionToken,
    descriptor: ArtifactDescriptor,
    bytes: Uint8Array,
  ): Promise<StoreResult<"created" | "replayed">>;
  get(
    context: FiscalContext,
    artifactId: string,
    maximumBytes: number,
  ): Promise<StoreResult<ArtifactObject>>;
  list(query: PageQuery): Promise<StoreResult<StorePage<ArtifactDescriptor>>>;
}

export interface EvidenceStore {
  readonly contractVersion: typeof PERSISTENCE_PORT_CONTRACT_VERSION;
  append(
    token: TransactionToken,
    claim: EvidenceClaim,
  ): Promise<StoreResult<"created" | "replayed">>;
  get(
    context: FiscalContext,
    claimId: string,
  ): Promise<StoreResult<EvidenceClaim>>;
  list(query: PageQuery): Promise<StoreResult<StorePage<EvidenceClaim>>>;
}

export interface JournalStore {
  readonly contractVersion: typeof PERSISTENCE_PORT_CONTRACT_VERSION;
  append(
    token: TransactionToken,
    entry: JournalEntry,
  ): Promise<StoreResult<"created" | "replayed">>;
  list(
    query: PageQuery & { readonly aggregateId: string },
  ): Promise<StoreResult<StorePage<JournalEntry>>>;
}

export interface OutboxStore {
  readonly contractVersion: typeof PERSISTENCE_PORT_CONTRACT_VERSION;
  append(
    token: TransactionToken,
    item: OutboxItem,
  ): Promise<StoreResult<"created" | "replayed">>;
  get(
    context: FiscalContext,
    outboxId: string,
  ): Promise<StoreResult<OutboxItem>>;
  discover(
    query: PageQuery & { readonly now: string },
  ): Promise<StoreResult<StorePage<OutboxItem>>>;
}

export interface SequenceHeadStore {
  readonly contractVersion: typeof PERSISTENCE_PORT_CONTRACT_VERSION;
  read(
    context: FiscalContext,
    chainId: string,
  ): Promise<StoreResult<SequenceHead>>;
  compareAndAppend(
    token: TransactionToken,
    expected: SequenceHead,
    next: SequenceHead,
    record: ImmutableRecord,
  ): Promise<StoreResult<"advanced">>;
}

export interface LeaseRecord {
  readonly outboxId: string;
  readonly ownerInstanceId: string;
  readonly fencingToken: number;
  readonly acquiredAt: string;
  readonly expiresAt: string;
  readonly version: number;
  readonly clockPolicyId: string;
  readonly authoritativeClock: true;
}

export interface LeaseStore {
  readonly contractVersion: typeof PERSISTENCE_PORT_CONTRACT_VERSION;
  /** Time is chosen by the backend; callers cannot supply a grant time. */
  claim(input: {
    readonly context: FiscalContext;
    readonly outboxId: string;
    readonly ownerInstanceId: string;
    readonly ttlMs: number;
    readonly expectedVersion: number;
  }): Promise<StoreResult<LeaseRecord>>;
  renew(input: {
    readonly context: FiscalContext;
    readonly lease: LeaseRecord;
    readonly ttlMs: number;
  }): Promise<StoreResult<LeaseRecord>>;
  release(input: {
    readonly context: FiscalContext;
    readonly lease: LeaseRecord;
  }): Promise<StoreResult<"released">>;
  complete(input: {
    readonly context: FiscalContext;
    readonly lease: LeaseRecord;
    readonly expectedOutboxVersion: number;
    readonly nextState: OutboxItem["state"];
    readonly observationId: string | null;
  }): Promise<StoreResult<OutboxItem>>;
}

export interface HostPublicationFact {
  readonly publicationId: string;
  readonly revision: number;
  readonly commandId: string;
  readonly canonicalDigest: string;
  readonly createdAt: string;
}

export interface HostUnitOfWorkPort {
  readonly contractVersion: typeof PERSISTENCE_PORT_CONTRACT_VERSION;
  readonly capabilityLevel: StoreCapabilityLevel;
  readonly adapterId: string;
  begin(input: {
    readonly context: FiscalContext;
    readonly commandId: string;
    readonly canonicalDigest: string;
    readonly signal?: AbortSignal;
  }): Promise<StoreResult<TransactionToken>>;
  stageHostPublication(
    token: TransactionToken,
    publication: HostPublicationFact,
  ): Promise<StoreResult<"staged">>;
  commit(
    token: TransactionToken,
  ): Promise<StoreResult<{ readonly commitId: string }>>;
  rollback(
    token: TransactionToken,
  ): Promise<StoreResult<"rolled-back" | "already-terminal">>;
  resolveUnknownCommit(input: {
    readonly context: FiscalContext;
    readonly commandId: string;
    readonly canonicalDigest: string;
  }): Promise<
    StoreResult<{
      readonly committed: boolean;
      readonly commitId: string | null;
    }>
  >;
}

export interface PersistencePorts {
  readonly capabilityLevel: StoreCapabilityLevel;
  readonly adapterId: string;
  readonly hostUnitOfWork: HostUnitOfWorkPort;
  readonly records: RecordStore;
  readonly artifacts: ArtifactStore;
  readonly evidence: EvidenceStore;
  readonly journal: JournalStore;
  readonly outbox: OutboxStore;
  readonly heads: SequenceHeadStore;
  readonly leases: LeaseStore;
}

export interface PersistenceAdapterDescriptor {
  readonly adapterId: string;
  readonly adapterVersion: string;
  readonly capabilityLevel: StoreCapabilityLevel;
  readonly contractVersion: typeof PERSISTENCE_PORT_CONTRACT_VERSION;
  readonly backendTime: boolean;
  readonly maximumTransactionBytes: number;
  readonly maximumPageItems: number;
  readonly durabilityAcknowledgement: "committed" | "local-only" | "unknown";
  readonly supportedIsolation: readonly string[];
}
