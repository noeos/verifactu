import type { StoreResult } from "./model.js";
import { isSafeStoreToken, storeFailure } from "./model.js";

export interface MigrationDefinition {
  readonly migrationId: string;
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly online: boolean;
  readonly maximumBatchItems: number;
  readonly requiredBackupDigest: string;
  readonly affectedEntities: readonly string[];
}

export interface MigrationCheckpoint {
  readonly migrationId: string;
  readonly sourceVersion: number;
  readonly targetVersion: number;
  readonly cursor: string | null;
  readonly processedItems: number;
  readonly status: "started" | "running" | "verifying" | "complete";
  readonly fencingToken: number;
}

export interface MigrationBatch {
  readonly nextCursor: string | null;
  readonly processedItems: number;
  readonly complete: boolean;
  readonly sourceDigest: string;
  readonly outputDigest: string;
}

export interface MigrationAdapter {
  readonly schemaVersion: number;
  readonly writable: boolean;
  readonly fencingToken: number;
  loadCheckpoint(
    migrationId: string,
  ): Promise<StoreResult<MigrationCheckpoint | null>>;
  verifyBackup(digest: string): Promise<StoreResult<true>>;
  begin(
    definition: MigrationDefinition,
  ): Promise<StoreResult<MigrationCheckpoint>>;
  applyBatch(
    definition: MigrationDefinition,
    checkpoint: MigrationCheckpoint,
  ): Promise<StoreResult<MigrationBatch>>;
  saveCheckpoint(
    checkpoint: MigrationCheckpoint,
  ): Promise<StoreResult<MigrationCheckpoint>>;
  verify(definition: MigrationDefinition): Promise<
    StoreResult<{
      readonly sourceDigest: string;
      readonly outputDigest: string;
      readonly valid: boolean;
    }>
  >;
  finish(
    checkpoint: MigrationCheckpoint,
  ): Promise<StoreResult<MigrationCheckpoint>>;
}

export type MigrationOutcome =
  | { readonly status: "complete"; readonly checkpoint: MigrationCheckpoint }
  | { readonly status: "read-only"; readonly reason: "unknown-newer-schema" }
  | {
      readonly status: "blocked";
      readonly code: string;
      readonly checkpoint: MigrationCheckpoint | null;
    };

function validDefinition(definition: MigrationDefinition): boolean {
  return (
    !!definition &&
    isSafeStoreToken(definition.migrationId) &&
    Number.isSafeInteger(definition.fromVersion) &&
    definition.fromVersion >= 1 &&
    Number.isSafeInteger(definition.toVersion) &&
    definition.toVersion === definition.fromVersion + 1 &&
    Number.isSafeInteger(definition.maximumBatchItems) &&
    definition.maximumBatchItems > 0 &&
    definition.maximumBatchItems <= 10_000 &&
    /^sha256:[0-9a-f]{64}$/u.test(definition.requiredBackupDigest) &&
    Array.isArray(definition.affectedEntities) &&
    definition.affectedEntities.length > 0 &&
    definition.affectedEntities.every((item) => isSafeStoreToken(item))
  );
}

export async function applyResumableMigration(
  adapter: MigrationAdapter,
  definition: MigrationDefinition,
  maximumBatches = 100_000,
): Promise<MigrationOutcome> {
  if (
    !adapter ||
    !validDefinition(definition) ||
    !Number.isSafeInteger(maximumBatches) ||
    maximumBatches < 1
  )
    return {
      status: "blocked",
      code: "DIAG-MIGRATION-INVALID",
      checkpoint: null,
    };
  if (adapter.schemaVersion > definition.fromVersion)
    return { status: "read-only", reason: "unknown-newer-schema" };
  if (
    !adapter.writable ||
    adapter.schemaVersion !== definition.fromVersion ||
    !Number.isSafeInteger(adapter.fencingToken) ||
    adapter.fencingToken < 1
  )
    return {
      status: "blocked",
      code: "DIAG-MIGRATION-SCHEMA",
      checkpoint: null,
    };
  let backup: StoreResult<true>;
  try {
    backup = await adapter.verifyBackup(definition.requiredBackupDigest);
  } catch {
    return {
      status: "blocked",
      code: "DIAG-MIGRATION-BACKUP",
      checkpoint: null,
    };
  }
  if (backup.status !== "ok")
    return {
      status: "blocked",
      code: "DIAG-MIGRATION-BACKUP",
      checkpoint: null,
    };

  let loaded: StoreResult<MigrationCheckpoint | null>;
  try {
    loaded = await adapter.loadCheckpoint(definition.migrationId);
  } catch {
    return {
      status: "blocked",
      code: "DIAG-MIGRATION-CHECKPOINT",
      checkpoint: null,
    };
  }
  if (loaded.status !== "ok")
    return {
      status: "blocked",
      code: "DIAG-MIGRATION-CHECKPOINT",
      checkpoint: null,
    };
  let checkpoint = loaded.value;
  if (!checkpoint) {
    let begun: StoreResult<MigrationCheckpoint>;
    try {
      begun = await adapter.begin(definition);
    } catch {
      return {
        status: "blocked",
        code: "DIAG-MIGRATION-BEGIN",
        checkpoint: null,
      };
    }
    if (begun.status !== "ok")
      return {
        status: "blocked",
        code: "DIAG-MIGRATION-BEGIN",
        checkpoint: null,
      };
    checkpoint = begun.value;
  }
  if (!validCheckpoint(checkpoint, definition, adapter.fencingToken))
    return { status: "blocked", code: "DIAG-MIGRATION-FENCE", checkpoint };

  for (
    let index = 0;
    checkpoint.status !== "verifying" && checkpoint.status !== "complete";
    index += 1
  ) {
    if (index >= maximumBatches)
      return { status: "blocked", code: "DIAG-MIGRATION-BOUND", checkpoint };
    let batch: StoreResult<MigrationBatch>;
    try {
      batch = await adapter.applyBatch(definition, checkpoint);
    } catch {
      return { status: "blocked", code: "DIAG-MIGRATION-BATCH", checkpoint };
    }
    if (batch.status !== "ok")
      return { status: "blocked", code: "DIAG-MIGRATION-BATCH", checkpoint };
    if (
      !Number.isSafeInteger(batch.value.processedItems) ||
      batch.value.processedItems < 0 ||
      batch.value.processedItems > definition.maximumBatchItems ||
      !/^sha256:[0-9a-f]{64}$/u.test(batch.value.sourceDigest) ||
      !/^sha256:[0-9a-f]{64}$/u.test(batch.value.outputDigest) ||
      (!batch.value.complete &&
        (!batch.value.nextCursor ||
          batch.value.nextCursor === checkpoint.cursor)) ||
      (batch.value.complete && batch.value.nextCursor !== null)
    )
      return {
        status: "blocked",
        code: "DIAG-MIGRATION-BATCH-INVALID",
        checkpoint,
      };
    const nextCheckpoint = Object.freeze({
      ...checkpoint,
      cursor: batch.value.nextCursor,
      processedItems: checkpoint.processedItems + batch.value.processedItems,
      status: batch.value.complete ? "verifying" : "running",
      fencingToken: adapter.fencingToken,
    });
    let saved: StoreResult<MigrationCheckpoint>;
    try {
      saved = await adapter.saveCheckpoint(nextCheckpoint);
    } catch {
      return {
        status: "blocked",
        code: "DIAG-MIGRATION-CHECKPOINT-WRITE",
        checkpoint,
      };
    }
    if (
      saved.status !== "ok" ||
      !validCheckpoint(saved.value, definition, adapter.fencingToken)
    )
      return {
        status: "blocked",
        code: "DIAG-MIGRATION-CHECKPOINT-WRITE",
        checkpoint,
      };
    checkpoint = saved.value;
  }

  let verification: StoreResult<{
    readonly sourceDigest: string;
    readonly outputDigest: string;
    readonly valid: boolean;
  }>;
  try {
    verification = await adapter.verify(definition);
  } catch {
    return { status: "blocked", code: "DIAG-MIGRATION-VERIFY", checkpoint };
  }
  if (
    verification.status !== "ok" ||
    !verification.value.valid ||
    !/^sha256:[0-9a-f]{64}$/u.test(verification.value.sourceDigest) ||
    !/^sha256:[0-9a-f]{64}$/u.test(verification.value.outputDigest)
  )
    return { status: "blocked", code: "DIAG-MIGRATION-VERIFY", checkpoint };
  let finished: StoreResult<MigrationCheckpoint>;
  try {
    finished = await adapter.finish(
      Object.freeze({ ...checkpoint, status: "complete" }),
    );
  } catch {
    return { status: "blocked", code: "DIAG-MIGRATION-FINISH", checkpoint };
  }
  if (
    finished.status !== "ok" ||
    !validCheckpoint(finished.value, definition, adapter.fencingToken) ||
    finished.value.status !== "complete"
  )
    return { status: "blocked", code: "DIAG-MIGRATION-FINISH", checkpoint };
  return { status: "complete", checkpoint: finished.value };
}

function validCheckpoint(
  checkpoint: MigrationCheckpoint,
  definition: MigrationDefinition,
  fence: number,
): boolean {
  return (
    !!checkpoint &&
    checkpoint.migrationId === definition.migrationId &&
    checkpoint.sourceVersion === definition.fromVersion &&
    checkpoint.targetVersion === definition.toVersion &&
    ["started", "running", "verifying", "complete"].includes(
      checkpoint.status,
    ) &&
    Number.isSafeInteger(checkpoint.processedItems) &&
    checkpoint.processedItems >= 0 &&
    checkpoint.fencingToken === fence
  );
}
