import { invalid, ok, type Result } from "../contracts/results.js";
import type { FiscalContext } from "./context.js";
import { sameContext } from "./context.js";
import type { FiscalInstant } from "./date-time.js";
import type { Identity } from "./identities.js";
import { sameIdentity } from "./identities.js";
import { isIdentity } from "./identities.js";
import { createFiscalInstant } from "./date-time.js";
import { createFiscalContext } from "./context.js";

export interface EventRecord {
  readonly id: Identity<"event">;
  readonly context: FiscalContext;
  readonly code: string;
  readonly occurredAt: FiscalInstant;
  readonly observedAt: FiscalInstant;
  readonly previousEventId: Identity<"event"> | null;
}
export interface EventSequence {
  readonly context: FiscalContext;
  readonly events: readonly EventRecord[];
}
export function appendEvent(
  sequence: EventSequence,
  event: EventRecord,
): Result<EventSequence> {
  const previous = sequence.events.at(-1);
  if (
    createFiscalContext(sequence.context).status !== "ok" ||
    createFiscalContext(event.context).status !== "ok" ||
    !isIdentity(event.id, "event") ||
    (event.previousEventId !== null &&
      !isIdentity(event.previousEventId, "event")) ||
    !sameContext(sequence.context, event.context) ||
    !/^[A-Z][A-Z0-9_-]{0,63}$/u.test(event.code) ||
    createFiscalInstant(event.occurredAt).status !== "ok" ||
    createFiscalInstant(event.observedAt).status !== "ok" ||
    (!previous && event.previousEventId !== null) ||
    (previous &&
      (!event.previousEventId ||
        !sameIdentity(event.previousEventId, previous.id) ||
        Date.parse(event.occurredAt) < Date.parse(previous.occurredAt))) ||
    sequence.events.some((item) => sameIdentity(item.id, event.id))
  )
    return invalid("DIAG-EVENT-SEQUENCE", "domain");
  return ok(
    Object.freeze({
      context: sequence.context,
      events: Object.freeze([
        ...sequence.events,
        Object.freeze({
          ...event,
          context: Object.freeze({ ...event.context }),
        }),
      ]),
    }),
  );
}
