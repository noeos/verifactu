import { invalid, ok, type Result } from "../contracts/results.js";
import type { FiscalContext } from "./context.js";
import { sameContext } from "./context.js";
import type { FiscalInstant } from "./date-time.js";
import type { Identity } from "./identities.js";
import { sameIdentity } from "./identities.js";
import { isIdentity } from "./identities.js";
import { createFiscalInstant } from "./date-time.js";
import { createFiscalContext } from "./context.js";

export interface SequenceItem {
  readonly id: Identity<"record">;
  readonly context: FiscalContext;
  readonly occurredAt: FiscalInstant;
  readonly predecessorId: Identity<"record"> | null;
}
export interface BillingSequence {
  readonly context: FiscalContext;
  readonly records: readonly SequenceItem[];
}
export function appendSequence(
  sequence: BillingSequence,
  item: SequenceItem,
): Result<BillingSequence> {
  const previous = sequence.records.at(-1);
  if (
    createFiscalContext(sequence.context).status !== "ok" ||
    createFiscalContext(item.context).status !== "ok" ||
    !isIdentity(item.id, "record") ||
    (item.predecessorId !== null &&
      !isIdentity(item.predecessorId, "record")) ||
    createFiscalInstant(item.occurredAt).status !== "ok" ||
    !sameContext(sequence.context, item.context) ||
    sequence.records.some((record) => sameIdentity(record.id, item.id)) ||
    (previous
      ? !item.predecessorId ||
        !sameIdentity(item.predecessorId, previous.id) ||
        Date.parse(item.occurredAt) < Date.parse(previous.occurredAt)
      : item.predecessorId !== null)
  )
    return invalid("DIAG-SEQUENCE-CONFLICT", "domain");
  return ok(
    Object.freeze({
      context: sequence.context,
      records: Object.freeze([
        ...sequence.records,
        Object.freeze({ ...item, context: Object.freeze({ ...item.context }) }),
      ]),
    }),
  );
}
