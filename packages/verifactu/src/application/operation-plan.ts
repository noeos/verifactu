import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "../domain/diagnostics.js";
import type { FiscalInstant } from "../domain/date-time.js";
import type {
  ArtifactId,
  ConfigurationId,
  EditionId,
  IdempotencyKey,
  RecordId,
} from "../domain/identities.js";

export type OperationEffect =
  | {
      readonly kind: "store-artifact";
      readonly artifactId: ArtifactId;
    }
  | { readonly kind: "append-record"; readonly recordId: RecordId }
  | {
      readonly kind: "compare-and-set-head";
      readonly scope: string;
      readonly expectedVersion: string;
      readonly recordId: RecordId;
      readonly fingerprint: string;
    };

export interface ObservedHead {
  readonly scope: string;
  readonly version: string;
  readonly recordId: RecordId | null;
  readonly fingerprint: string | null;
}

export interface PlanBinding {
  readonly semanticInputDigest: string;
  readonly configurationDigest: string;
  readonly contextId: string;
  readonly editionId: EditionId;
  readonly headVersion: string;
  readonly expiresAt: FiscalInstant;
  readonly token: string;
}

export interface OperationPlan {
  readonly version: 1;
  readonly planId: string;
  readonly commandId: string;
  readonly idempotencyKey: IdempotencyKey;
  readonly contextId: string;
  readonly editionId: EditionId;
  readonly configurationId: ConfigurationId;
  readonly preparedAt: FiscalInstant;
  readonly expiresAt: FiscalInstant;
  readonly observedHead: ObservedHead;
  readonly binding: PlanBinding;
  readonly recordId: RecordId;
  readonly artifactIds: readonly ArtifactId[];
  readonly effects: readonly OperationEffect[];
}

const PLAN_KEYS = Object.freeze([
  "version",
  "planId",
  "commandId",
  "idempotencyKey",
  "contextId",
  "editionId",
  "configurationId",
  "preparedAt",
  "expiresAt",
  "observedHead",
  "binding",
  "recordId",
  "artifactIds",
  "effects",
]);
const HEAD_KEYS = Object.freeze([
  "scope",
  "version",
  "recordId",
  "fingerprint",
]);
const BINDING_KEYS = Object.freeze([
  "semanticInputDigest",
  "configurationDigest",
  "contextId",
  "editionId",
  "headVersion",
  "expiresAt",
  "token",
]);
const EFFECT_KEYS: Readonly<
  Record<OperationEffect["kind"], readonly string[]>
> = Object.freeze({
  "store-artifact": Object.freeze(["kind", "artifactId"]),
  "append-record": Object.freeze(["kind", "recordId"]),
  "compare-and-set-head": Object.freeze([
    "kind",
    "scope",
    "expectedVersion",
    "recordId",
    "fingerprint",
  ]),
});

export function defineOperationPlan(
  candidate: unknown,
): OperationResult<OperationPlan> {
  if (!isObject(candidate) || !exactKeys(candidate, PLAN_KEYS))
    return planFailure("DIAG-PLAN-SHAPE");
  const plan = candidate as unknown as OperationPlan;
  if (
    plan.version !== 1 ||
    !nonEmpty(plan.planId) ||
    !nonEmpty(plan.commandId) ||
    !nonEmpty(plan.idempotencyKey) ||
    !nonEmpty(plan.contextId) ||
    !nonEmpty(plan.editionId) ||
    !nonEmpty(plan.configurationId) ||
    !nonEmpty(plan.preparedAt) ||
    !nonEmpty(plan.expiresAt) ||
    !nonEmpty(plan.recordId) ||
    !Array.isArray(plan.artifactIds) ||
    plan.artifactIds.length === 0 ||
    new Set(plan.artifactIds).size !== plan.artifactIds.length ||
    !isObject(plan.observedHead) ||
    !exactKeys(plan.observedHead, HEAD_KEYS) ||
    !nonEmpty(plan.observedHead.scope) ||
    !nonEmpty(plan.observedHead.version) ||
    !validBinding(plan.binding, plan) ||
    !Array.isArray(plan.effects) ||
    plan.effects.length === 0
  )
    return planFailure("DIAG-PLAN-SHAPE");
  for (const effect of plan.effects) {
    if (!validEffect(effect, plan)) return planFailure("DIAG-PLAN-EFFECT");
  }
  if (containsExecutable(candidate)) return planFailure("DIAG-PLAN-EXECUTABLE");
  return succeeded(freezePlan(plan));
}

export function operationPlanBytes(plan: OperationPlan): Uint8Array {
  return new globalThis.TextEncoder().encode(canonicalJson(plan));
}

function validEffect(effect: unknown, plan: OperationPlan): boolean {
  if (!isObject(effect) || typeof effect.kind !== "string") return false;
  if (!(effect.kind in EFFECT_KEYS)) return false;
  const kind = effect.kind as OperationEffect["kind"];
  if (!exactKeys(effect, EFFECT_KEYS[kind]!)) return false;
  if (kind === "store-artifact")
    return (
      nonEmpty(effect.artifactId) &&
      plan.artifactIds.some((artifactId) => artifactId === effect.artifactId)
    );
  if (kind === "append-record") return effect.recordId === plan.recordId;
  return (
    effect.scope === plan.observedHead.scope &&
    effect.expectedVersion === plan.observedHead.version &&
    effect.recordId === plan.recordId &&
    nonEmpty(effect.fingerprint)
  );
}

function freezePlan(plan: OperationPlan): OperationPlan {
  return Object.freeze({
    ...plan,
    observedHead: Object.freeze({ ...plan.observedHead }),
    binding: Object.freeze({ ...plan.binding }),
    artifactIds: Object.freeze([...plan.artifactIds]),
    effects: Object.freeze(
      plan.effects.map((effect) => Object.freeze({ ...effect })),
    ),
  });
}

function validBinding(value: unknown, plan: OperationPlan): boolean {
  if (!isObject(value) || !exactKeys(value, BINDING_KEYS)) return false;
  return (
    isDigest(value.semanticInputDigest) &&
    isDigest(value.configurationDigest) &&
    value.contextId === plan.contextId &&
    value.editionId === plan.editionId &&
    value.headVersion === plan.observedHead.version &&
    value.expiresAt === plan.expiresAt &&
    isDigest(value.token)
  );
}

function isDigest(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isObject(value))
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function containsExecutable(value: unknown): boolean {
  if (typeof value === "function" || typeof value === "symbol") return true;
  if (Array.isArray(value)) return value.some(containsExecutable);
  return isObject(value) && Object.values(value).some(containsExecutable);
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  return (
    actual.length === expected.length &&
    [...expected].sort().every((key, index) => key === actual[index])
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function planFailure(code: `DIAG-${string}`): OperationResult<never> {
  return failed("invalid", [diagnostic(code, "input", "domain", "/plan")]);
}
