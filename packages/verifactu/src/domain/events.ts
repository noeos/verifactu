import type { FiscalInstant } from "./date-time.js";
import type {
  EventId,
  InstallationId,
  PrincipalId,
  TaxpayerId,
} from "./identities.js";
import type { OperatingMode } from "./mode-tenure.js";
import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { compareFiscalInstants } from "./date-time.js";
import { diagnostic } from "./diagnostics.js";

export type FiscalEvent =
  | {
      readonly kind: "configured";
      readonly id: EventId;
      readonly occurredAt: FiscalInstant;
      readonly taxpayerId: TaxpayerId;
      readonly installationId: InstallationId;
      readonly principalId: PrincipalId;
      readonly mode: OperatingMode;
    }
  | {
      readonly kind: "transition-requested";
      readonly id: EventId;
      readonly occurredAt: FiscalInstant;
      readonly principalId: PrincipalId;
      readonly target: "verifactu";
    }
  | {
      readonly kind: "transition-completed";
      readonly id: EventId;
      readonly occurredAt: FiscalInstant;
      readonly principalId: PrincipalId;
    }
  | {
      readonly kind: "fault-suspended";
      readonly id: EventId;
      readonly occurredAt: FiscalInstant;
      readonly principalId: PrincipalId;
      readonly faultCode: `DIAG-${string}`;
    }
  | {
      readonly kind: "resumed";
      readonly id: EventId;
      readonly occurredAt: FiscalInstant;
      readonly principalId: PrincipalId;
    }
  | {
      readonly kind: "retired";
      readonly id: EventId;
      readonly occurredAt: FiscalInstant;
      readonly principalId: PrincipalId;
    };

export function defineEvent<T extends FiscalEvent>(event: T): Readonly<T> {
  return Object.freeze({ ...event });
}

export function validateEventChronology(
  events: readonly FiscalEvent[],
): OperationResult<readonly FiscalEvent[]> {
  for (let index = 1; index < events.length; index += 1) {
    const previous = events[index - 1];
    const current = events[index];
    if (
      previous === undefined ||
      current === undefined ||
      compareFiscalInstants(previous.occurredAt, current.occurredAt) >= 0
    ) {
      return failed("conflict", [
        diagnostic("DIAG-EVENT-CHRONOLOGY", "integrity", "state", "/events", {
          index,
        }),
      ]);
    }
  }
  return succeeded(Object.freeze([...events]));
}
