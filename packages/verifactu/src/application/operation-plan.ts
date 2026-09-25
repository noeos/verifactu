import { invalid, ok, type Result } from "../contracts/results.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalContext } from "../domain/context.js";
import { createFiscalInstant } from "../domain/date-time.js";
import type { Identity } from "../domain/identities.js";
import { isIdentity } from "../domain/identities.js";

export type PlannedAction =
  | "validate"
  | "project"
  | "fingerprint"
  | "serialize";
export interface OperationPlanInput {
  readonly operationId: Identity<"operation">;
  readonly context: FiscalContext;
  readonly editionId: Identity<"edition">;
  readonly expectedHead: string | null;
  readonly expiresAt: string;
  readonly actions: readonly PlannedAction[];
  readonly effects?: readonly unknown[];
}
export interface OperationPlan {
  readonly operationId: Identity<"operation">;
  readonly context: FiscalContext;
  readonly editionId: Identity<"edition">;
  readonly expectedHead: string | null;
  readonly expiresAt: string;
  readonly actions: readonly PlannedAction[];
  readonly effects: readonly [];
}
const actions = new Set<PlannedAction>([
  "validate",
  "project",
  "fingerprint",
  "serialize",
]);
const token = (value: string): boolean =>
  value.length > 0 &&
  value.length <= 256 &&
  !/[\u0000-\u001f\u007f]/u.test(value);

export function createOperationPlan(
  input: OperationPlanInput,
): Result<OperationPlan> {
  const context = input?.context ? createFiscalContext(input.context) : null;
  if (
    !input ||
    !isIdentity(input.operationId, "operation") ||
    !isIdentity(input.editionId, "edition") ||
    context?.status !== "ok" ||
    context.value.editionId.value !== input.editionId.value ||
    (input.expectedHead !== null &&
      (typeof input.expectedHead !== "string" || !token(input.expectedHead))) ||
    typeof input.expiresAt !== "string" ||
    createFiscalInstant(input.expiresAt).status !== "ok" ||
    !Array.isArray(input.actions) ||
    input.actions.length === 0 ||
    input.actions.some((action) => !actions.has(action)) ||
    new Set(input.actions).size !== input.actions.length ||
    (input.effects !== undefined &&
      (!Array.isArray(input.effects) || input.effects.length !== 0))
  )
    return invalid("DIAG-PLAN-INVALID", "domain");
  return ok(
    Object.freeze({
      operationId: Object.freeze({ ...input.operationId }),
      context: context.value,
      editionId: Object.freeze({ ...input.editionId }),
      expectedHead: input.expectedHead,
      expiresAt: input.expiresAt,
      actions: Object.freeze([...input.actions]),
      effects: Object.freeze([]) as readonly [],
    }),
  );
}
