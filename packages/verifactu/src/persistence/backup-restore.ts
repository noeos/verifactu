import { createHash } from "node:crypto";
import { createFiscalContext } from "../domain/context.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalInstant } from "../domain/date-time.js";
import type { OutboxState } from "./model.js";
import { isSafeStoreToken, storeFailure } from "./model.js";
import type { StoreResult } from "./model.js";

export interface BackupObjectReference {
  readonly objectId: string;
  readonly class:
    | "record"
    | "artifact"
    | "event"
    | "evidence"
    | "outbox"
    | "journal"
    | "checkpoint"
    | "edition";
  readonly byteLength: number;
  readonly sha256: string;
}

export interface BackupManifestUnsigned {
  readonly manifestVersion: 1;
  readonly storeId: string;
  readonly targetStoreIdentity: string;
  readonly schemaVersion: number;
  readonly contexts: readonly FiscalContext[];
  readonly editionIds: readonly string[];
  readonly entityCounts: Readonly<Record<string, number>>;
  readonly headsDigest: string;
  readonly journalPosition: number;
  readonly outboxPosition: number;
  readonly objectReferences: readonly BackupObjectReference[];
  readonly encryptionKeyReferences: readonly string[];
  readonly toolVersion: string;
  readonly checkpointDigest: string;
  readonly createdAt: string;
}

export interface BackupManifest extends BackupManifestUnsigned {
  readonly manifestDigest: string;
  readonly signerHandle: string;
  readonly signature: Uint8Array;
}

export interface BackupSigningPort {
  readonly signerId: string;
  sign(handle: string, bytes: Uint8Array): Promise<StoreResult<Uint8Array>>;
  verify(
    handle: string,
    bytes: Uint8Array,
    signature: Uint8Array,
  ): Promise<StoreResult<boolean>>;
}

export interface RestoreIntegrity {
  readonly targetStoreId: string;
  readonly manifestValid: boolean;
  readonly signatureValid: boolean;
  readonly allBytesVerified: boolean;
  readonly countsVerified: boolean;
  readonly constraintsRebuilt: boolean;
  readonly chainsVerified: boolean;
  readonly checkpointVerified: boolean;
  readonly schemaSupported: boolean;
  readonly contextMappingVerified: boolean;
  readonly outboxStates: readonly OutboxState[];
}

export interface RestoreDecision {
  readonly status: "ready" | "blocked";
  readonly workersEnabled: boolean;
  readonly networkEnabled: boolean;
  readonly attemptStartedItemsToReconcile: number;
  readonly reasons: readonly string[];
}

const canonical = (value: unknown): string => JSON.stringify(sortJson(value));
function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortJson((value as Record<string, unknown>)[key])]),
    );
  return value;
}
const digest = (bytes: Uint8Array): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

export async function createSignedBackupManifest(
  input: BackupManifestUnsigned,
  signer: BackupSigningPort,
  signerHandle: string,
): Promise<StoreResult<BackupManifest>> {
  if (
    !input ||
    input.manifestVersion !== 1 ||
    !isSafeStoreToken(input.storeId) ||
    !isSafeStoreToken(input.targetStoreIdentity) ||
    input.storeId === input.targetStoreIdentity ||
    !Number.isSafeInteger(input.schemaVersion) ||
    input.schemaVersion < 1 ||
    !Array.isArray(input.contexts) ||
    input.contexts.length === 0 ||
    input.contexts.some(
      (context) => createFiscalContext(context).status !== "ok",
    ) ||
    !Array.isArray(input.objectReferences) ||
    !Array.isArray(input.editionIds) ||
    !Array.isArray(input.encryptionKeyReferences) ||
    !Number.isSafeInteger(input.journalPosition) ||
    input.journalPosition < 0 ||
    !Number.isSafeInteger(input.outboxPosition) ||
    input.outboxPosition < 0 ||
    createFiscalInstant(input.createdAt).status !== "ok" ||
    !/^sha256:[0-9a-f]{64}$/u.test(input.headsDigest) ||
    !/^sha256:[0-9a-f]{64}$/u.test(input.checkpointDigest) ||
    !input.entityCounts ||
    typeof input.entityCounts !== "object" ||
    Array.isArray(input.entityCounts) ||
    Object.values(input.entityCounts).some(
      (count) => !Number.isSafeInteger(count) || count < 0,
    ) ||
    !isSafeStoreToken(input.toolVersion) ||
    !isSafeStoreToken(signerHandle) ||
    !signer ||
    typeof signer.sign !== "function" ||
    !isSafeStoreToken(signer.signerId) ||
    input.editionIds.some((editionId) => !isSafeStoreToken(editionId)) ||
    input.encryptionKeyReferences.some(
      (reference) => !isSafeStoreToken(reference),
    ) ||
    input.objectReferences.some(
      (entry) =>
        !entry ||
        !isSafeStoreToken(entry.objectId) ||
        ![
          "record",
          "artifact",
          "event",
          "evidence",
          "outbox",
          "journal",
          "checkpoint",
          "edition",
        ].includes(entry.class) ||
        !Number.isSafeInteger(entry.byteLength) ||
        entry.byteLength < 0 ||
        entry.byteLength > 1_073_741_824 ||
        !/^sha256:[0-9a-f]{64}$/u.test(entry.sha256),
    )
  )
    return storeFailure("invalid", "invalid-input");
  const normalizedContexts: FiscalContext[] = [];
  for (const candidate of input.contexts) {
    const validated = createFiscalContext(candidate);
    if (validated.status !== "ok")
      return storeFailure("invalid", "context-mismatch");
    normalizedContexts.push(validated.value);
  }
  const unsigned = Object.freeze({
    ...input,
    contexts: Object.freeze(normalizedContexts),
    editionIds: Object.freeze([...input.editionIds].sort()),
    objectReferences: Object.freeze(
      [...input.objectReferences].sort((a, b) =>
        a.objectId.localeCompare(b.objectId),
      ),
    ),
    encryptionKeyReferences: Object.freeze(
      [...input.encryptionKeyReferences].sort(),
    ),
    entityCounts: Object.freeze({ ...input.entityCounts }),
  });
  const bytes = new TextEncoder().encode(canonical(unsigned));
  let signature: StoreResult<Uint8Array>;
  try {
    signature = await signer.sign(signerHandle, bytes);
  } catch {
    return storeFailure("unavailable", "unavailable");
  }
  if (
    signature.status !== "ok" ||
    !(signature.value instanceof Uint8Array) ||
    signature.value.length === 0 ||
    signature.value.length > 16_384
  )
    return storeFailure("unavailable", "unavailable");
  return {
    status: "ok",
    value: Object.freeze({
      ...unsigned,
      manifestDigest: digest(bytes),
      signerHandle,
      signature: signature.value.slice(),
    }),
  };
}

export async function verifyBackupManifest(
  manifest: BackupManifest,
  signer: BackupSigningPort,
): Promise<StoreResult<true>> {
  if (
    !manifest ||
    !signer ||
    !isSafeStoreToken(manifest.signerHandle) ||
    !/^sha256:[0-9a-f]{64}$/u.test(manifest.manifestDigest) ||
    !(manifest.signature instanceof Uint8Array) ||
    typeof signer.verify !== "function"
  )
    return storeFailure("invalid", "invalid-input");
  const { manifestDigest, signerHandle, signature, ...unsigned } = manifest;
  const bytes = new TextEncoder().encode(canonical(unsigned));
  if (digest(bytes) !== manifestDigest)
    return storeFailure("indeterminate", "corruption");
  let verified: StoreResult<boolean>;
  try {
    verified = await signer.verify(signerHandle, bytes, signature.slice());
  } catch {
    return storeFailure("unavailable", "unavailable");
  }
  if (verified.status !== "ok") return verified;
  return verified.value
    ? { status: "ok", value: true }
    : storeFailure("indeterminate", "corruption");
}

export function verifyBackupObjects(
  manifest: BackupManifest,
  objects: ReadonlyMap<string, Uint8Array>,
): StoreResult<true> {
  if (
    !manifest ||
    !objects ||
    objects.size !== manifest.objectReferences.length
  )
    return storeFailure("indeterminate", "corruption");
  for (const reference of manifest.objectReferences) {
    const bytes = objects.get(reference.objectId);
    if (
      !(bytes instanceof Uint8Array) ||
      bytes.byteLength !== reference.byteLength ||
      digest(bytes) !== reference.sha256
    )
      return storeFailure("indeterminate", "corruption");
  }
  return { status: "ok", value: true };
}

export function authorizeRestoredStore(
  integrity: RestoreIntegrity,
): StoreResult<RestoreDecision> {
  if (
    !integrity ||
    !isSafeStoreToken(integrity.targetStoreId) ||
    !Array.isArray(integrity.outboxStates) ||
    integrity.outboxStates.some(
      (state) =>
        ![
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
        ].includes(state),
    )
  )
    return storeFailure("invalid", "invalid-input");
  const reasons: string[] = [];
  for (const [name, valid] of [
    ["DIAG-RESTORE-MANIFEST", integrity.manifestValid],
    ["DIAG-RESTORE-SIGNATURE", integrity.signatureValid],
    ["DIAG-RESTORE-BYTES", integrity.allBytesVerified],
    ["DIAG-RESTORE-COUNTS", integrity.countsVerified],
    ["DIAG-RESTORE-CONSTRAINTS", integrity.constraintsRebuilt],
    ["DIAG-RESTORE-CHAINS", integrity.chainsVerified],
    ["DIAG-RESTORE-CHECKPOINT", integrity.checkpointVerified],
    ["DIAG-RESTORE-SCHEMA", integrity.schemaSupported],
    ["DIAG-RESTORE-CONTEXT", integrity.contextMappingVerified],
  ] as const)
    if (!valid) reasons.push(name);
  const uncertain = integrity.outboxStates.filter(
    (state) => state === "attempt-started" || state === "indeterminate",
  ).length;
  if (uncertain > 0) reasons.push("DIAG-RECONCILIATION-REQUIRED");
  const verified = reasons.length === 0;
  return {
    status: "ok",
    value: Object.freeze({
      status: verified ? "ready" : "blocked",
      workersEnabled: verified,
      networkEnabled: verified,
      attemptStartedItemsToReconcile: uncertain,
      reasons: Object.freeze(reasons.sort()),
    }),
  };
}
