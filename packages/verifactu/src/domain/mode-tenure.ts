import { invalid, ok, type Result } from "../contracts/results.js";
import type { FiscalContext } from "./context.js";
import { sameContext } from "./context.js";
import { createFiscalContext } from "./context.js";
import type { FiscalInstant } from "./date-time.js";

export type ComplianceMode =
  | "unconfigured"
  | "nonVerifactu"
  | "transitionPending"
  | "verifactu"
  | "suspendedByFault"
  | "retired";
const modes: readonly ComplianceMode[] = Object.freeze([
  "unconfigured",
  "nonVerifactu",
  "transitionPending",
  "verifactu",
  "suspendedByFault",
  "retired",
]);
export interface ModeTenure {
  readonly context: FiscalContext;
  readonly mode: ComplianceMode;
  readonly effectiveFrom: FiscalInstant;
  readonly effectiveUntil: FiscalInstant | null;
  readonly authorizationId: string;
  readonly evidenceId: string;
}
const transitions: Readonly<Record<ComplianceMode, readonly ComplianceMode[]>> =
  Object.freeze({
    unconfigured: ["nonVerifactu", "verifactu"],
    nonVerifactu: ["transitionPending", "suspendedByFault", "retired"],
    transitionPending: ["verifactu", "suspendedByFault"],
    verifactu: ["nonVerifactu", "suspendedByFault", "retired"],
    suspendedByFault: ["nonVerifactu", "verifactu", "retired"],
    retired: [],
  });
export function transitionMode(
  previous: ModeTenure | null,
  next: ModeTenure,
  allowRollback = false,
): Result<ModeTenure> {
  if (
    !next.authorizationId ||
    !next.evidenceId ||
    !Number.isFinite(Date.parse(next.effectiveFrom)) ||
    createFiscalContext(next.context).status !== "ok" ||
    (previous && !sameContext(previous.context, next.context))
  )
    return invalid("DIAG-MODE-TENURE", "domain");
  if (
    !modes.includes(next.mode) ||
    (previous && !modes.includes(previous.mode))
  )
    return invalid("DIAG-MODE-TRANSITION", "domain");
  if (!previous && !["nonVerifactu", "verifactu"].includes(next.mode))
    return invalid("DIAG-MODE-TRANSITION", "domain");
  if (previous && !transitions[previous.mode].includes(next.mode))
    return invalid("DIAG-MODE-TRANSITION", "domain");
  if (
    previous?.mode === "verifactu" &&
    next.mode === "nonVerifactu" &&
    !allowRollback
  )
    return invalid("DIAG-MODE-ROLLBACK", "domain");
  if (
    previous &&
    (previous.effectiveUntil === null ||
      !Number.isFinite(Date.parse(next.effectiveFrom)) ||
      !Number.isFinite(Date.parse(previous.effectiveFrom)) ||
      Date.parse(next.effectiveFrom) <= Date.parse(previous.effectiveFrom) ||
      Date.parse(previous.effectiveUntil) !== Date.parse(next.effectiveFrom))
  )
    return invalid("DIAG-MODE-CHRONOLOGY", "domain");
  if (
    next.effectiveUntil !== null &&
    (!Number.isFinite(Date.parse(next.effectiveUntil)) ||
      Date.parse(next.effectiveUntil) <= Date.parse(next.effectiveFrom))
  )
    return invalid("DIAG-MODE-CHRONOLOGY", "domain");
  return ok(Object.freeze({ ...next }));
}
export function resolveMode(
  tenures: readonly ModeTenure[],
  at: FiscalInstant,
  context: FiscalContext,
): Result<ModeTenure> {
  const matches = tenures.filter(
    (t) =>
      sameContext(t.context, context) &&
      Date.parse(t.effectiveFrom) <= Date.parse(at) &&
      (t.effectiveUntil === null ||
        Date.parse(at) < Date.parse(t.effectiveUntil)),
  );
  if (matches.length !== 1)
    return {
      status: "indeterminate",
      diagnostics: [
        {
          code: "DIAG-MODE-UNRESOLVED",
          stage: "domain",
          path: "",
          severity: "error",
          retryable: false,
        },
      ],
    };
  return ok(matches[0]!);
}
