import type { FiscalInstant } from "./date-time.js";
import type {
  ArtifactId,
  EditionId,
  EvidenceId,
  EventId,
  InstallationId,
  PrincipalId,
  TaxpayerId,
  TenantId,
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
    const previous = events[index - 1]!;
    const current = events[index]!;
    if (compareFiscalInstants(previous.occurredAt, current.occurredAt) >= 0) {
      return failed("conflict", [
        diagnostic("DIAG-EVENT-CHRONOLOGY", "integrity", "state", "/events", {
          index,
        }),
      ]);
    }
  }
  return succeeded(Object.freeze([...events]));
}

export type EventOrigin =
  | { readonly kind: "system"; readonly authenticatedAdapterId: string }
  | { readonly kind: "principal"; readonly principalId: PrincipalId }
  | { readonly kind: "caller" };

export interface RegulatedEvent {
  readonly id: EventId;
  readonly tenantId: TenantId;
  readonly taxpayerId: TaxpayerId;
  readonly installationId: InstallationId;
  readonly editionId: EditionId;
  readonly catalogueCode: string;
  readonly occurredAt: FiscalInstant;
  readonly observedAt: FiscalInstant;
  readonly origin: EventOrigin;
  readonly affectedIdentityIds: readonly string[];
  readonly outcome: "succeeded" | "failed" | "indeterminate";
  readonly reasonCode: `DIAG-${string}` | null;
  readonly evidenceIds: readonly EvidenceId[];
  readonly priorEventId: EventId | null;
  readonly integrityArtifactId: ArtifactId | null;
}

export interface EventCatalogueRules {
  readonly editionId: EditionId;
  readonly codes: readonly string[];
  readonly codesRequiringPriorEvent: readonly string[];
  readonly codesRequiringIntegrity: readonly string[];
}

export function defineRegulatedEvent(
  event: RegulatedEvent,
  rules: EventCatalogueRules,
): OperationResult<RegulatedEvent> {
  if (
    event.editionId !== rules.editionId ||
    !rules.codes.includes(event.catalogueCode)
  )
    return regulatedEventFailure("DIAG-EVENT-CATALOGUE", "/catalogueCode");
  if (compareFiscalInstants(event.occurredAt, event.observedAt) > 0)
    return regulatedEventFailure("DIAG-EVENT-OBSERVATION-TIME", "/observedAt");
  if (
    event.origin.kind === "system" &&
    event.origin.authenticatedAdapterId.length === 0
  )
    return regulatedEventFailure("DIAG-EVENT-ORIGIN", "/origin");
  if (
    (event.outcome !== "succeeded" && event.reasonCode === null) ||
    event.evidenceIds.length === 0 ||
    (rules.codesRequiringPriorEvent.includes(event.catalogueCode) &&
      event.priorEventId === null) ||
    (rules.codesRequiringIntegrity.includes(event.catalogueCode) &&
      event.integrityArtifactId === null)
  )
    return regulatedEventFailure("DIAG-EVENT-EVIDENCE", "/event");
  return succeeded(
    Object.freeze({
      ...event,
      origin: Object.freeze({ ...event.origin }),
      affectedIdentityIds: Object.freeze([...event.affectedIdentityIds]),
      evidenceIds: Object.freeze([...event.evidenceIds]),
    }),
  );
}

function regulatedEventFailure(
  code: `DIAG-EVENT-${string}`,
  path: string,
): OperationResult<RegulatedEvent> {
  return failed("invalid", [diagnostic(code, "input", "domain", path)]);
}
