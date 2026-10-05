import { createHash } from "node:crypto";
import { invalid, ok, type Result } from "../contracts/results.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalContext } from "../domain/context.js";
import type { FiscalInstant } from "../domain/date-time.js";
import { createFiscalInstant } from "../domain/date-time.js";
import type { Identity, IdentityKind } from "../domain/identities.js";
import {
  createIdentity,
  identityKey,
  isIdentity,
} from "../domain/identities.js";

export const PERSISTENCE_SCHEMA_VERSION = 1 as const;
export type Sha256 = `sha256:${string}`;
export type StoreCapabilityLevel = "standalone-test" | "atomic-host";

export interface ScopedIdentity<K extends IdentityKind = IdentityKind> {
  readonly id: Identity<K>;
  readonly context: FiscalContext;
}

export interface ImmutableRecord extends ScopedIdentity<"record"> {
  readonly schemaVersion: typeof PERSISTENCE_SCHEMA_VERSION;
  readonly editionId: Identity<"edition">;
  readonly kind: "alta" | "anulacion" | "correction" | "substitution";
  readonly predecessorId: Identity<"record"> | null;
  readonly semanticDigest: Sha256;
  readonly canonicalBytes: Uint8Array;
  readonly createdAt: FiscalInstant;
  readonly sequence: number;
}

export interface ArtifactDescriptor extends ScopedIdentity<"operation"> {
  readonly schemaVersion: typeof PERSISTENCE_SCHEMA_VERSION;
  readonly artifactId: string;
  readonly mediaType: string;
  readonly byteLength: number;
  readonly sha256: Sha256;
  readonly sha512: `sha512:${string}`;
  readonly createdAt: FiscalInstant;
}

export interface ArtifactObject {
  readonly descriptor: ArtifactDescriptor;
  readonly bytes: Uint8Array;
}

export interface EvidenceClaim extends ScopedIdentity<"operation"> {
  readonly schemaVersion: typeof PERSISTENCE_SCHEMA_VERSION;
  readonly claimId: string;
  readonly subjectDigest: Sha256;
  readonly verifierId: string;
  readonly profileId: string;
  readonly result: "verified" | "rejected" | "indeterminate";
  readonly supportingArtifactIds: readonly string[];
  readonly validatedAt: FiscalInstant;
}

export interface JournalEntry extends ScopedIdentity<"event"> {
  readonly schemaVersion: typeof PERSISTENCE_SCHEMA_VERSION;
  readonly aggregateId: string;
  readonly version: number;
  readonly eventCode: string;
  readonly commandId: string;
  readonly causationId: string | null;
  readonly correlationId: string;
  readonly priorState: string | null;
  readonly nextState: string;
  readonly occurredAt: FiscalInstant;
  readonly instantSource: "host" | "backend" | "protocol";
  readonly artifactIds: readonly string[];
  readonly claimIds: readonly string[];
  readonly safeDiagnostics: readonly string[];
}

export interface SequenceHead extends ScopedIdentity<"chain"> {
  readonly schemaVersion: typeof PERSISTENCE_SCHEMA_VERSION;
  readonly generation: number;
  readonly lastRecordId: Identity<"record"> | null;
  readonly officialFingerprint: Sha256 | null;
  readonly generatedAt: FiscalInstant | null;
  readonly commitId: string | null;
}

export type OutboxState =
  | "pending"
  | "leased"
  | "attempt-started"
  | "indeterminate"
  | "retry-wait"
  | "reconciliation-required"
  | "accepted"
  | "accepted-with-errors"
  | "rejected"
  | "permanently-failed";

export interface OutboxItem extends ScopedIdentity<"operation"> {
  readonly schemaVersion: typeof PERSISTENCE_SCHEMA_VERSION;
  readonly outboxId: string;
  readonly recordIds: readonly Identity<"record">[];
  readonly artifactIds: readonly string[];
  readonly operationId: string;
  readonly environment: "test" | "production";
  readonly orderingScope: string;
  readonly eligibleAt: FiscalInstant;
  readonly state: OutboxState;
  readonly version: number;
  readonly attemptCount: number;
  readonly fencingToken: number;
  readonly lastObservationId: string | null;
  readonly reconciliationRequired: boolean;
}

export interface IdempotencyBinding {
  readonly context: FiscalContext;
  readonly commandId: string;
  readonly canonicalDigest: Sha256;
  readonly resultDigest: Sha256 | null;
}

/** Immutable, identity-bound recovery marker retained across store restarts. */
export interface RecoveryCheckpoint {
  readonly storeId: string;
  readonly context: FiscalContext;
  readonly schemaVersion: number;
  readonly generation: number;
  readonly headDigest: Sha256 | null;
  readonly journalVersion: number;
  readonly manifestDigest: Sha256;
  readonly previousCheckpointDigest: Sha256 | null;
  readonly createdAt: string;
  readonly externalAnchorDigest: Sha256;
}

export type StoreErrorCode =
  | "invalid-input"
  | "context-mismatch"
  | "idempotency-conflict"
  | "compare-and-set-conflict"
  | "corruption"
  | "unknown-commit"
  | "unavailable"
  | "unsupported-capability"
  | "not-found"
  | "limit-exceeded"
  | "fenced";

export type StoreResult<T> =
  | { readonly status: "ok"; readonly value: T }
  | {
      readonly status: "conflict" | "invalid" | "indeterminate" | "unavailable";
      readonly code: StoreErrorCode;
    };

export const storeOk = <T>(value: T): StoreResult<T> => ({
  status: "ok",
  value,
});
export const storeFailure = <T = never>(
  status: Exclude<StoreResult<T>["status"], "ok">,
  code: StoreErrorCode,
): StoreResult<T> => ({ status, code });

export function contextStoreKey(context: FiscalContext): string {
  return identityKey([
    context.tenantId,
    context.taxpayerId,
    context.installationId,
    context.editionId,
  ]);
}

export function isSafeStoreToken(
  value: unknown,
  maximum = 256,
): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maximum &&
    value === value.trim() &&
    !/[\u0000-\u001f\u007f]/u.test(value)
  );
}

export function sha256Digest(bytes: Uint8Array): Sha256 {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export function sha512Digest(bytes: Uint8Array): `sha512:${string}` {
  return `sha512:${createHash("sha512").update(bytes).digest("hex")}`;
}

function snapshotIdentity<K extends IdentityKind>(
  value: unknown,
  kind: K,
): Identity<K> | null {
  if (!isIdentity(value, kind)) return null;
  const result = createIdentity(kind, value.value);
  return result.status === "ok" ? result.value : null;
}

export function validateRecord(
  record: ImmutableRecord,
): StoreResult<ImmutableRecord> {
  const context = record && createFiscalContext(record.context);
  const canonicalBytes =
    record?.canonicalBytes instanceof Uint8Array
      ? Uint8Array.from(record.canonicalBytes)
      : null;
  const recordId = record ? snapshotIdentity(record.id, "record") : null;
  const editionId = record
    ? snapshotIdentity(record.editionId, "edition")
    : null;
  const predecessorId: Identity<"record"> | null =
    record?.predecessorId === null
      ? null
      : record
        ? snapshotIdentity(record.predecessorId, "record")
        : null;
  if (
    !record ||
    typeof record !== "object" ||
    record.schemaVersion !== PERSISTENCE_SCHEMA_VERSION ||
    !recordId ||
    !editionId ||
    (record.predecessorId !== null && !predecessorId) ||
    predecessorId?.value === recordId.value ||
    context?.status !== "ok" ||
    context.value.editionId.value !== editionId.value ||
    !["alta", "anulacion", "correction", "substitution"].includes(
      record.kind,
    ) ||
    !canonicalBytes ||
    canonicalBytes.byteLength === 0 ||
    canonicalBytes.byteLength > 1_048_576 ||
    record.semanticDigest !== sha256Digest(canonicalBytes) ||
    !Number.isSafeInteger(record.sequence) ||
    record.sequence < 1 ||
    createFiscalInstant(record.createdAt).status !== "ok"
  )
    return storeFailure("invalid", "invalid-input");
  return storeOk(
    Object.freeze({
      ...record,
      id: recordId,
      context: context.value,
      editionId,
      predecessorId,
      canonicalBytes,
    }),
  );
}

export function validateArtifact(
  descriptor: ArtifactDescriptor,
  bytes: Uint8Array,
): StoreResult<ArtifactObject> {
  const context = descriptor && createFiscalContext(descriptor.context);
  const identity = descriptor
    ? snapshotIdentity(descriptor.id, "operation")
    : null;
  const exactBytes =
    bytes instanceof Uint8Array ? Uint8Array.from(bytes) : null;
  if (
    !descriptor ||
    typeof descriptor !== "object" ||
    descriptor.schemaVersion !== PERSISTENCE_SCHEMA_VERSION ||
    context?.status !== "ok" ||
    !identity ||
    !isSafeStoreToken(descriptor.artifactId) ||
    !/^[a-zA-Z0-9][a-zA-Z0-9.+/-]{0,126}[a-zA-Z0-9]$/u.test(
      descriptor.mediaType,
    ) ||
    !Number.isSafeInteger(descriptor.byteLength) ||
    descriptor.byteLength < 0 ||
    descriptor.byteLength > 1_048_576 ||
    !exactBytes ||
    exactBytes.byteLength !== descriptor.byteLength ||
    sha256Digest(exactBytes) !== descriptor.sha256 ||
    sha512Digest(exactBytes) !== descriptor.sha512 ||
    createFiscalInstant(descriptor.createdAt).status !== "ok"
  )
    return storeFailure("invalid", "invalid-input");
  return storeOk(
    Object.freeze({
      descriptor: Object.freeze({
        ...descriptor,
        id: identity,
        context: context.value,
      }),
      bytes: exactBytes,
    }),
  );
}

export function validateEvidenceClaim(
  claim: EvidenceClaim,
): StoreResult<EvidenceClaim> {
  const context = claim && createFiscalContext(claim.context);
  const identity = claim ? snapshotIdentity(claim.id, "operation") : null;
  if (
    !claim ||
    typeof claim !== "object" ||
    claim.schemaVersion !== PERSISTENCE_SCHEMA_VERSION ||
    !identity ||
    context?.status !== "ok" ||
    !isSafeStoreToken(claim.claimId) ||
    !/^sha256:[0-9a-f]{64}$/u.test(claim.subjectDigest) ||
    !isSafeStoreToken(claim.verifierId) ||
    !isSafeStoreToken(claim.profileId) ||
    !["verified", "rejected", "indeterminate"].includes(claim.result) ||
    !Array.isArray(claim.supportingArtifactIds) ||
    claim.supportingArtifactIds.length > 500 ||
    claim.supportingArtifactIds.some((id) => !isSafeStoreToken(id)) ||
    new Set(claim.supportingArtifactIds).size !==
      claim.supportingArtifactIds.length ||
    createFiscalInstant(claim.validatedAt).status !== "ok"
  )
    return storeFailure("invalid", "invalid-input");
  return storeOk(
    Object.freeze({
      ...claim,
      id: identity,
      context: context.value,
      supportingArtifactIds: Object.freeze([...claim.supportingArtifactIds]),
    }),
  );
}

export function parseSha256(value: unknown): Result<Sha256> {
  if (typeof value !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(value))
    return invalid("DIAG-PERSIST-DIGEST", "domain");
  return ok(value as Sha256);
}

export function contextMatches(
  left: FiscalContext,
  right: FiscalContext,
): boolean {
  return contextStoreKey(left) === contextStoreKey(right);
}
