import { invalid, ok, type Result } from "../contracts/results.js";
import type { BillingRecord } from "../domain/records.js";
import { createAltaRecord, createAnulacionRecord } from "../domain/records.js";
import { digestBytes, type DigestPort } from "../ports/digest.js";
import { createOperationPlan, type OperationPlan } from "./operation-plan.js";

export interface RecordPlanInput {
  readonly record: BillingRecord;
  readonly expectedHead: string | null;
  readonly operationId: Parameters<
    typeof createOperationPlan
  >[0]["operationId"];
  readonly expiresAt: string;
  readonly digest: DigestPort;
}
export interface RecordPlan extends OperationPlan {
  readonly recordId: string;
  readonly recordKind: BillingRecord["kind"];
  readonly semanticDigest: string;
}
function canonical(value: unknown): string {
  if (typeof value === "bigint") return JSON.stringify(value.toString());
  if (value === null || typeof value !== "object")
    return JSON.stringify(value) ?? "null";
  const object = value as Record<string, unknown>;
  return (
    "{" +
    Object.keys(object)
      .sort()
      .map((key) => JSON.stringify(key) + ":" + canonical(object[key]))
      .join(",") +
    "}"
  );
}
export function planRecord(input: RecordPlanInput): Result<RecordPlan> {
  const allowed =
    input?.record?.kind === "alta"
      ? new Set([
          "kind",
          "id",
          "context",
          "document",
          "issueDate",
          "generatedAt",
          "total",
          "predecessorId",
          "editionId",
        ])
      : new Set([
          "kind",
          "id",
          "context",
          "target",
          "cause",
          "generatedAt",
          "predecessorId",
          "editionId",
        ]);
  if (
    !input?.record ||
    Reflect.ownKeys(input.record).some(
      (key) => typeof key !== "string" || !allowed.has(key),
    )
  )
    return invalid("DIAG-PLAN-RECORD", "domain");
  const record =
    input?.record?.kind === "alta"
      ? createAltaRecord(input.record)
      : input?.record?.kind === "anulacion"
        ? createAnulacionRecord(input.record)
        : null;
  if (record?.status !== "ok") return invalid("DIAG-PLAN-RECORD", "domain");
  const plan = createOperationPlan({
    operationId: input.operationId,
    context: record.value.context,
    editionId: record.value.editionId,
    expectedHead: input.expectedHead,
    expiresAt: input.expiresAt,
    actions: ["validate", "project", "fingerprint", "serialize"],
    effects: [],
  });
  if (plan.status !== "ok") return plan;
  const payload = new TextEncoder().encode(canonical(record.value));
  const semanticDigest = digestBytes(input.digest, "sha256", payload);
  if (semanticDigest.status !== "ok") return semanticDigest;
  return ok(
    Object.freeze({
      ...plan.value,
      recordId: record.value.id.value,
      recordKind: record.value.kind,
      semanticDigest: semanticDigest.value,
    }),
  );
}
