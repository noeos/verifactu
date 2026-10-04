import { createHash } from "node:crypto";
import { createFiscalContext, sameContext } from "../domain/context.js";
import { createFiscalInstant } from "../domain/date-time.js";
import type { FiscalContext } from "../domain/context.js";
import type { StoreResult } from "./model.js";
import { isSafeStoreToken, storeFailure } from "./model.js";

export interface RetentionObject {
  readonly objectId: string;
  readonly context: FiscalContext;
  readonly dataClass: string;
  readonly createdAt: string;
  readonly minimumRetainUntil: string;
  readonly legalHold: boolean | "unknown";
  readonly dependencies: readonly string[];
  readonly closureComplete: boolean;
  readonly version: number;
}

export interface RetentionPolicy {
  readonly policyId: string;
  readonly digest: string;
  readonly dataClasses: readonly string[];
  readonly jurisdiction: string;
  readonly fiscalPeriod: string;
  readonly legalHoldResolved: boolean;
  readonly approvalRequired: true;
}

export interface RetentionPlan {
  readonly status: "eligible" | "blocked";
  readonly context: FiscalContext;
  readonly policyId: string;
  readonly policyDigest: string;
  readonly asOf: string;
  readonly candidates: readonly {
    readonly objectId: string;
    readonly version: number;
    readonly dataClass: string;
  }[];
  readonly blocked: readonly {
    readonly objectId: string;
    readonly reason: string;
  }[];
  readonly planDigest: string;
}

export interface RetentionAdapter {
  dryRun(input: {
    readonly context: FiscalContext;
    readonly dataClasses: readonly string[];
    readonly asOf: string;
    readonly limit: number;
  }): Promise<StoreResult<readonly RetentionObject[]>>;
  archive(input: {
    readonly context: FiscalContext;
    readonly objects: readonly RetentionObject[];
    readonly manifestDigest: string;
    readonly archiveIdentity: string;
  }): Promise<
    StoreResult<{
      readonly archivedCount: number;
      readonly archiveManifestDigest: string;
    }>
  >;
  purge(input: {
    readonly context: FiscalContext;
    readonly objects: readonly {
      readonly objectId: string;
      readonly version: number;
    }[];
    readonly policyDigest: string;
    readonly approvalEvidenceId: string;
    readonly tombstoneId: string;
    readonly expectedPlanDigest: string;
  }): Promise<
    StoreResult<{
      readonly purgedCount: number;
      readonly tombstoneDigest: string;
    }>
  >;
}

export interface RetentionApprovalPort {
  verify(input: {
    readonly context: FiscalContext;
    readonly evidenceId: string;
    readonly policyDigest: string;
    readonly planDigest: string;
    readonly tombstoneId: string;
  }): Promise<StoreResult<true>>;
}

function hashCanonical(value: unknown): string {
  const canonicalize = (item: unknown): unknown =>
    Array.isArray(item)
      ? item.map(canonicalize)
      : item && typeof item === "object"
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [
                key,
                canonicalize((item as Record<string, unknown>)[key]),
              ]),
          )
        : item;
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex")}`;
}

export async function planRetention(
  adapter: RetentionAdapter,
  input: {
    readonly context: FiscalContext;
    readonly policy: RetentionPolicy;
    readonly asOf: string;
    readonly limit: number;
  },
): Promise<StoreResult<RetentionPlan>> {
  if (
    !adapter ||
    !input ||
    !input.policy ||
    !/^sha256:[0-9a-f]{64}$/u.test(input.policy.digest) ||
    createFiscalContext(input.context).status !== "ok" ||
    !isSafeStoreToken(input.policy.policyId) ||
    !isSafeStoreToken(input.policy.jurisdiction) ||
    !isSafeStoreToken(input.policy.fiscalPeriod) ||
    !input.policy.legalHoldResolved ||
    createFiscalInstant(input.asOf).status !== "ok" ||
    !Number.isSafeInteger(input.limit) ||
    input.limit < 1 ||
    input.limit > 500 ||
    !Array.isArray(input.policy.dataClasses) ||
    input.policy.dataClasses.length === 0 ||
    input.policy.dataClasses.some((value) => !isSafeStoreToken(value))
  )
    return storeFailure("invalid", "invalid-input");
  let objects: StoreResult<readonly RetentionObject[]>;
  try {
    objects = await adapter.dryRun({
      context: input.context,
      dataClasses: input.policy.dataClasses,
      asOf: input.asOf,
      limit: input.limit,
    });
  } catch {
    return storeFailure("unavailable", "unavailable");
  }
  if (objects.status !== "ok") return objects;
  if (!Array.isArray(objects.value))
    return storeFailure("indeterminate", "corruption");
  if (objects.value.length > input.limit)
    return storeFailure("indeterminate", "limit-exceeded");
  if (
    objects.value.some(
      (item) => !item || !sameContext(item.context, input.context),
    )
  )
    return storeFailure("indeterminate", "context-mismatch");
  if (
    new Set(objects.value.map((item) => item.objectId)).size !==
    objects.value.length
  )
    return storeFailure("indeterminate", "corruption");
  const candidates: { objectId: string; version: number; dataClass: string }[] =
    [];
  const blocked: { objectId: string; reason: string }[] = [];
  for (const item of objects.value) {
    let reason: string | null = null;
    if (
      !isSafeStoreToken(item.objectId) ||
      !isSafeStoreToken(item.dataClass) ||
      !Number.isSafeInteger(item.version) ||
      item.version < 1
    )
      reason = "DIAG-RETENTION-OBJECT-INVALID";
    else if (!input.policy.dataClasses.includes(item.dataClass))
      reason = "DIAG-RETENTION-POLICY-UNKNOWN";
    else if (item.legalHold !== false || !input.policy.legalHoldResolved)
      reason = "DIAG-RETENTION-LEGAL-HOLD";
    else if (
      createFiscalInstant(item.minimumRetainUntil).status !== "ok" ||
      Date.parse(input.asOf) <= Date.parse(item.minimumRetainUntil)
    )
      reason = "DIAG-RETENTION-MINIMUM";
    else if (!item.closureComplete) reason = "DIAG-RETENTION-CLOSURE";
    else if (
      !Array.isArray(item.dependencies) ||
      item.dependencies.some(
        (dependency: string) => !isSafeStoreToken(dependency),
      )
    )
      reason = "DIAG-RETENTION-DEPENDENCY";
    if (reason)
      blocked.push({
        objectId: isSafeStoreToken(item.objectId)
          ? item.objectId
          : "invalid-object",
        reason,
      });
    else
      candidates.push({
        objectId: item.objectId,
        version: item.version,
        dataClass: item.dataClass,
      });
  }
  const purgeSet = new Set(candidates.map((candidate) => candidate.objectId));
  let changed = true;
  while (changed) {
    changed = false;
    for (let index = candidates.length - 1; index >= 0; index -= 1) {
      const candidate = candidates[index]!;
      const object = objects.value.find(
        (item) => item.objectId === candidate.objectId,
      );
      if (
        object?.dependencies.some(
          (dependency: string) => !purgeSet.has(dependency),
        )
      ) {
        blocked.push({
          objectId: candidate.objectId,
          reason: "DIAG-RETENTION-DEPENDENCY",
        });
        candidates.splice(index, 1);
        purgeSet.delete(candidate.objectId);
        changed = true;
      }
    }
  }
  const normalized = Object.freeze({
    context: Object.freeze({ ...input.context }),
    policyId: input.policy.policyId,
    policyDigest: input.policy.digest,
    asOf: input.asOf,
    candidates: Object.freeze(
      candidates.sort((a, b) => a.objectId.localeCompare(b.objectId)),
    ),
    blocked: Object.freeze(
      blocked.sort((a, b) => a.objectId.localeCompare(b.objectId)),
    ),
  });
  const planDigest = hashCanonical(normalized);
  return {
    status: "ok",
    value: Object.freeze({
      status:
        blocked.length === 0 && candidates.length > 0 ? "eligible" : "blocked",
      ...normalized,
      planDigest,
    }),
  };
}

export async function archiveRetentionClosure(
  adapter: RetentionAdapter,
  input: {
    readonly context: FiscalContext;
    readonly objects: readonly RetentionObject[];
    readonly archiveIdentity: string;
  },
): Promise<
  StoreResult<{
    readonly archivedCount: number;
    readonly archiveManifestDigest: string;
  }>
> {
  if (
    !adapter ||
    !input ||
    !isSafeStoreToken(input.archiveIdentity) ||
    !Array.isArray(input.objects) ||
    createFiscalContext(input.context).status !== "ok" ||
    input.objects.length === 0 ||
    input.objects.length > 500 ||
    input.objects.some(
      (item) =>
        !item ||
        !isSafeStoreToken(item.objectId) ||
        !isSafeStoreToken(item.dataClass) ||
        !Number.isSafeInteger(item.version) ||
        item.version < 1 ||
        !Array.isArray(item.dependencies) ||
        item.dependencies.some(
          (dependency: string) => !isSafeStoreToken(dependency),
        ) ||
        !item.closureComplete ||
        item.legalHold !== false ||
        !sameContext(item.context, input.context),
    ) ||
    new Set(input.objects.map((item) => item?.objectId)).size !==
      input.objects.length
  )
    return storeFailure("invalid", "invalid-input");
  const manifestDigest = hashCanonical(
    input.objects
      .map((item) => ({
        objectId: item.objectId,
        dataClass: item.dataClass,
        version: item.version,
        dependencies: [...item.dependencies].sort(),
      }))
      .sort((a, b) => a.objectId.localeCompare(b.objectId)),
  );
  let archived: StoreResult<{
    readonly archivedCount: number;
    readonly archiveManifestDigest: string;
  }>;
  try {
    archived = await adapter.archive({ ...input, manifestDigest });
  } catch {
    return storeFailure("indeterminate", "unknown-commit");
  }
  if (archived.status !== "ok") return archived;
  if (
    archived.value.archivedCount !== input.objects.length ||
    !/^sha256:[0-9a-f]{64}$/u.test(archived.value.archiveManifestDigest)
  )
    return storeFailure("indeterminate", "corruption");
  return archived;
}

export async function purgeRetentionPlan(
  adapter: RetentionAdapter,
  approval: RetentionApprovalPort,
  input: {
    readonly context: FiscalContext;
    readonly plan: RetentionPlan;
    readonly approvalEvidenceId: string;
    readonly tombstoneId: string;
    readonly confirmedPlanDigest: string;
  },
): Promise<
  StoreResult<{
    readonly purgedCount: number;
    readonly tombstoneDigest: string;
  }>
> {
  if (
    !adapter ||
    !approval ||
    !input ||
    !input.plan ||
    input.plan.status !== "eligible" ||
    !Array.isArray(input.plan.blocked) ||
    input.plan.blocked.length !== 0 ||
    !Array.isArray(input.plan.candidates) ||
    !/^sha256:[0-9a-f]{64}$/u.test(input.plan.policyDigest) ||
    !/^sha256:[0-9a-f]{64}$/u.test(input.plan.planDigest) ||
    !isSafeStoreToken(input.plan.policyId) ||
    !input.plan.context ||
    createFiscalContext(input.plan.context).status !== "ok" ||
    !sameContext(input.plan.context, input.context) ||
    input.confirmedPlanDigest !== input.plan.planDigest ||
    !isSafeStoreToken(input.approvalEvidenceId) ||
    !isSafeStoreToken(input.tombstoneId) ||
    input.plan.candidates.length === 0 ||
    input.plan.candidates.some(
      (candidate) =>
        !candidate ||
        !isSafeStoreToken(candidate.objectId) ||
        !isSafeStoreToken(candidate.dataClass) ||
        !Number.isSafeInteger(candidate.version) ||
        candidate.version < 1,
    ) ||
    new Set(input.plan.candidates.map((candidate) => candidate.objectId))
      .size !== input.plan.candidates.length
  )
    return storeFailure("invalid", "unsupported-capability");
  let authorized: StoreResult<true>;
  try {
    authorized = await approval.verify({
      context: input.context,
      evidenceId: input.approvalEvidenceId,
      policyDigest: input.plan.policyDigest,
      planDigest: input.plan.planDigest,
      tombstoneId: input.tombstoneId,
    });
  } catch {
    return storeFailure("unavailable", "unavailable");
  }
  if (authorized.status !== "ok") return authorized;
  if (authorized.value !== true)
    return storeFailure("invalid", "unsupported-capability");
  let result: StoreResult<{
    readonly purgedCount: number;
    readonly tombstoneDigest: string;
  }>;
  try {
    result = await adapter.purge({
      context: input.context,
      objects: input.plan.candidates.map(({ objectId, version }) => ({
        objectId,
        version,
      })),
      policyDigest: input.plan.policyDigest,
      approvalEvidenceId: input.approvalEvidenceId,
      tombstoneId: input.tombstoneId,
      expectedPlanDigest: input.plan.planDigest,
    });
  } catch {
    return storeFailure("indeterminate", "unknown-commit");
  }
  if (result.status !== "ok") return result;
  if (
    result.value.purgedCount !== input.plan.candidates.length ||
    !/^sha256:[0-9a-f]{64}$/u.test(result.value.tombstoneDigest)
  )
    return storeFailure("indeterminate", "corruption");
  return result;
}
