import { createHash } from "node:crypto";
import { invalid, ok, type Result } from "../contracts/results.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalContext } from "../domain/context.js";
import type { FiscalInstant } from "../domain/date-time.js";
import { createFiscalInstant } from "../domain/date-time.js";
import type { Identity, IdentityKind } from "../domain/identities.js";
import { identityKey, isIdentity } from "../domain/identities.js";

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

export function validateRecord(
  record: ImmutableRecord,
): StoreResult<ImmutableRecord> {
  if (
    !record ||
    typeof record !== "object" ||
    record.schemaVersion !== PERSISTENCE_SCHEMA_VERSION ||
    !isIdentity(record.id, "record") ||
    !isIdentity(record.editionId, "edition") ||
    (record.predecessorId !== null &&
      !isIdentity(record.predecessorId, "record")) ||
    record.predecessorId?.value === record.id.value ||
    createFiscalContext(record.context).status !== "ok" ||
    record.context.editionId.value !== record.editionId.value ||
    !["alta", "anulacion", "correction", "substitution"].includes(
      record.kind,
    ) ||
    !(record.canonicalBytes instanceof Uint8Array) ||
    record.canonicalBytes.byteLength === 0 ||
    record.canonicalBytes.byteLength > 1_048_576 ||
    record.semanticDigest !== sha256Digest(record.canonicalBytes) ||
    !Number.isSafeInteger(record.sequence) ||
    record.sequence < 1 ||
    createFiscalInstant(record.createdAt).status !== "ok"
  )
    return storeFailure("invalid", "invalid-input");
  return storeOk(
    Object.freeze({ ...record, canonicalBytes: record.canonicalBytes.slice() }),
  );
}

export function validateArtifact(
  descriptor: ArtifactDescriptor,
  bytes: Uint8Array,
): StoreResult<ArtifactObject> {
  if (
    !descriptor ||
    typeof descriptor !== "object" ||
    descriptor.schemaVersion !== PERSISTENCE_SCHEMA_VERSION ||
    createFiscalContext(descriptor.context).status !== "ok" ||
    !isIdentity(descriptor.id, "operation") ||
    !isSafeStoreToken(descriptor.artifactId) ||
    !/^[a-zA-Z0-9][a-zA-Z0-9.+/-]{0,126}[a-zA-Z0-9]$/u.test(
      descriptor.mediaType,
    ) ||
    !Number.isSafeInteger(descriptor.byteLength) ||
    descriptor.byteLength < 0 ||
    descriptor.byteLength > 1_048_576 ||
    !(bytes instanceof Uint8Array) ||
    bytes.byteLength !== descriptor.byteLength ||
    sha256Digest(bytes) !== descriptor.sha256 ||
    sha512Digest(bytes) !== descriptor.sha512 ||
    createFiscalInstant(descriptor.createdAt).status !== "ok"
  )
    return storeFailure("invalid", "invalid-input");
  return storeOk(
    Object.freeze({
      descriptor: Object.freeze({ ...descriptor }),
      bytes: bytes.slice(),
    }),
  );
}

export function validateEvidenceClaim(
  claim: EvidenceClaim,
): StoreResult<EvidenceClaim> {
  if (
    !claim ||
    typeof claim !== "object" ||
    claim.schemaVersion !== PERSISTENCE_SCHEMA_VERSION ||
    !isIdentity(claim.id, "operation") ||
    createFiscalContext(claim.context).status !== "ok" ||
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
      context: Object.freeze({ ...claim.context }),
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
