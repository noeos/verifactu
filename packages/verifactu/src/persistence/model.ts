import { createHash } from "node:crypto";
import { invalid, ok, type Result } from "../contracts/results.js";
import type { FiscalContext } from "../domain/context.js";
import type { FiscalInstant } from "../domain/date-time.js";
import { createFiscalInstant } from "../domain/date-time.js";
import type { Identity, IdentityKind } from "../domain/identities.js";
import { createIdentity, identityKey } from "../domain/identities.js";

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

function ownDataProperties(
  value: unknown,
  names: readonly string[],
): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(descriptors);
  if (
    keys.length !== names.length ||
    keys.some((key) => typeof key !== "string" || !names.includes(key))
  )
    return null;
  const result: Record<string, unknown> = Object.create(null);
  for (const name of names) {
    const descriptor = descriptors[name];
    if (!descriptor || !Object.hasOwn(descriptor, "value")) return null;
    result[name] = descriptor.value;
  }
  return result;
}

function snapshotIdentity<K extends IdentityKind>(
  value: unknown,
  kind: K,
): Identity<K> | null {
  const input = ownDataProperties(value, ["kind", "value"]);
  if (
    !input ||
    input.kind !== kind ||
    typeof input.value !== "string" ||
    input.value.length < 1 ||
    input.value.length > 128 ||
    input.value !== input.value.trim() ||
    /[\u0000-\u001f\u007f]/u.test(input.value)
  )
    return null;
  const result = createIdentity(kind, input.value);
  return result.status === "ok" ? result.value : null;
}

function snapshotContext(value: unknown): FiscalContext | null {
  const input = ownDataProperties(value, [
    "tenantId",
    "taxpayerId",
    "installationId",
    "editionId",
  ]);
  if (!input) return null;
  const tenantId = snapshotIdentity(input.tenantId, "tenant");
  const taxpayerId = snapshotIdentity(input.taxpayerId, "taxpayer");
  const installationId = snapshotIdentity(input.installationId, "installation");
  const editionId = snapshotIdentity(input.editionId, "edition");
  if (!tenantId || !taxpayerId || !installationId || !editionId) return null;
  return Object.freeze({ tenantId, taxpayerId, installationId, editionId });
}

function snapshotStringArray(value: unknown, maximum: number): string[] | null {
  if (!Array.isArray(value)) return null;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const properties = descriptors as unknown as Record<
    string,
    PropertyDescriptor
  >;
  const lengthDescriptor = properties.length;
  if (
    !lengthDescriptor ||
    !Object.hasOwn(lengthDescriptor, "value") ||
    !Number.isSafeInteger(lengthDescriptor.value) ||
    lengthDescriptor.value < 0 ||
    lengthDescriptor.value > maximum
  )
    return null;
  const length = lengthDescriptor.value as number;
  const keys = Reflect.ownKeys(descriptors);
  if (
    keys.length !== length + 1 ||
    keys.some(
      (key) =>
        key !== "length" &&
        (typeof key !== "string" || !/^(0|[1-9]\d*)$/u.test(key)),
    )
  )
    return null;
  const result: string[] = [];
  for (let index = 0; index < length; index += 1) {
    const descriptor = descriptors[index];
    if (!descriptor || !Object.hasOwn(descriptor, "value")) return null;
    if (typeof descriptor.value !== "string") return null;
    result.push(descriptor.value);
  }
  return result;
}

export function validateRecord(
  record: ImmutableRecord,
): StoreResult<ImmutableRecord> {
  try {
    const input = ownDataProperties(record, [
      "id",
      "context",
      "schemaVersion",
      "editionId",
      "kind",
      "predecessorId",
      "semanticDigest",
      "canonicalBytes",
      "createdAt",
      "sequence",
    ]);
    if (!input) return storeFailure("invalid", "invalid-input");
    const context = snapshotContext(input.context);
    const canonicalBytes =
      input.canonicalBytes instanceof Uint8Array
        ? Uint8Array.from(input.canonicalBytes)
        : null;
    const recordId = snapshotIdentity(input.id, "record");
    const editionId = snapshotIdentity(input.editionId, "edition");
    const predecessorId: Identity<"record"> | null =
      input.predecessorId === null
        ? null
        : snapshotIdentity(input.predecessorId, "record");
    if (
      input.schemaVersion !== PERSISTENCE_SCHEMA_VERSION ||
      !recordId ||
      !editionId ||
      (input.predecessorId !== null && !predecessorId) ||
      predecessorId?.value === recordId.value ||
      !context ||
      context.editionId.value !== editionId.value ||
      !["alta", "anulacion", "correction", "substitution"].includes(
        input.kind as string,
      ) ||
      !canonicalBytes ||
      canonicalBytes.byteLength === 0 ||
      canonicalBytes.byteLength > 1_048_576 ||
      input.semanticDigest !== sha256Digest(canonicalBytes) ||
      !Number.isSafeInteger(input.sequence) ||
      (input.sequence as number) < 1 ||
      createFiscalInstant(input.createdAt as string).status !== "ok"
    )
      return storeFailure("invalid", "invalid-input");
    const snapshot = {
      id: recordId,
      context,
      schemaVersion: PERSISTENCE_SCHEMA_VERSION,
      editionId,
      kind: input.kind as ImmutableRecord["kind"],
      predecessorId,
      semanticDigest: input.semanticDigest as Sha256,
      createdAt: input.createdAt as FiscalInstant,
      sequence: input.sequence as number,
      canonicalBytes,
    };
    Object.defineProperty(snapshot, "canonicalBytes", {
      enumerable: true,
      get: () => Uint8Array.from(canonicalBytes),
    });
    return storeOk(Object.freeze(snapshot));
  } catch {
    return storeFailure("invalid", "invalid-input");
  }
}

export function validateArtifact(
  candidate: ArtifactDescriptor,
  bytes: Uint8Array,
): StoreResult<ArtifactObject> {
  try {
    const input = ownDataProperties(candidate, [
      "id",
      "context",
      "schemaVersion",
      "artifactId",
      "mediaType",
      "byteLength",
      "sha256",
      "sha512",
      "createdAt",
    ]);
    if (!input) return storeFailure("invalid", "invalid-input");
    const descriptor = input;
    const context = snapshotContext(input.context);
    const identity = snapshotIdentity(input.id, "operation");
    const exactBytes =
      bytes instanceof Uint8Array ? Uint8Array.from(bytes) : null;
    if (
      input.schemaVersion !== PERSISTENCE_SCHEMA_VERSION ||
      !context ||
      !identity ||
      !isSafeStoreToken(input.artifactId) ||
      typeof input.mediaType !== "string" ||
      !/^[a-zA-Z0-9][a-zA-Z0-9.+/-]{0,126}[a-zA-Z0-9]$/u.test(
        input.mediaType,
      ) ||
      !Number.isSafeInteger(input.byteLength) ||
      (input.byteLength as number) < 0 ||
      (input.byteLength as number) > 1_048_576 ||
      !exactBytes ||
      exactBytes.byteLength !== input.byteLength ||
      sha256Digest(exactBytes) !== descriptor.sha256 ||
      sha512Digest(exactBytes) !== input.sha512 ||
      createFiscalInstant(input.createdAt as string).status !== "ok"
    )
      return storeFailure("invalid", "invalid-input");
    const acceptedDescriptor: ArtifactDescriptor = Object.freeze({
      id: identity,
      context,
      schemaVersion: PERSISTENCE_SCHEMA_VERSION,
      artifactId: input.artifactId as string,
      mediaType: input.mediaType as string,
      byteLength: input.byteLength as number,
      sha256: input.sha256 as Sha256,
      sha512: input.sha512 as `sha512:${string}`,
      createdAt: input.createdAt as FiscalInstant,
    });
    const snapshot = { descriptor: acceptedDescriptor, bytes: exactBytes };
    Object.defineProperty(snapshot, "bytes", {
      enumerable: true,
      get: () => Uint8Array.from(exactBytes),
    });
    return storeOk(Object.freeze(snapshot));
  } catch {
    return storeFailure("invalid", "invalid-input");
  }
}

export function validateEvidenceClaim(
  claim: EvidenceClaim,
): StoreResult<EvidenceClaim> {
  try {
    const input = ownDataProperties(claim, [
      "id",
      "context",
      "schemaVersion",
      "claimId",
      "subjectDigest",
      "verifierId",
      "profileId",
      "result",
      "supportingArtifactIds",
      "validatedAt",
    ]);
    if (!input) return storeFailure("invalid", "invalid-input");
    const context = snapshotContext(input.context);
    const identity = snapshotIdentity(input.id, "operation");
    const supportingArtifactIds = snapshotStringArray(
      input.supportingArtifactIds,
      500,
    );
    if (
      input.schemaVersion !== PERSISTENCE_SCHEMA_VERSION ||
      !identity ||
      !context ||
      !isSafeStoreToken(input.claimId) ||
      typeof input.subjectDigest !== "string" ||
      !/^sha256:[0-9a-f]{64}$/u.test(input.subjectDigest) ||
      !isSafeStoreToken(input.verifierId) ||
      !isSafeStoreToken(input.profileId) ||
      !["verified", "rejected", "indeterminate"].includes(
        input.result as string,
      ) ||
      !supportingArtifactIds ||
      supportingArtifactIds.some((id) => !isSafeStoreToken(id)) ||
      new Set(supportingArtifactIds).size !== supportingArtifactIds.length ||
      createFiscalInstant(input.validatedAt as string).status !== "ok"
    )
      return storeFailure("invalid", "invalid-input");
    return storeOk(
      Object.freeze({
        id: identity,
        context,
        schemaVersion: PERSISTENCE_SCHEMA_VERSION,
        claimId: input.claimId as string,
        subjectDigest: input.subjectDigest as Sha256,
        verifierId: input.verifierId as string,
        profileId: input.profileId as string,
        result: input.result as EvidenceClaim["result"],
        supportingArtifactIds: Object.freeze(supportingArtifactIds),
        validatedAt: input.validatedAt as FiscalInstant,
      }),
    );
  } catch {
    return storeFailure("invalid", "invalid-input");
  }
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
