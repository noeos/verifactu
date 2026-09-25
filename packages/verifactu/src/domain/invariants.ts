import type { BillingRecord } from "./records.js";
import type { FiscalContext } from "./context.js";
import { sameContext } from "./context.js";
import { sameIdentity } from "./identities.js";

export type ConstructionOutcome<T> =
  | { readonly status: "accepted"; readonly value: T }
  | { readonly status: "rejected"; readonly diagnostics: readonly string[] }
  | {
      readonly status: "indeterminate";
      readonly diagnostics: readonly string[];
      readonly requiredEvidence: readonly string[];
    };

export function chainEligible<T extends BillingRecord>(
  outcome: ConstructionOutcome<T>,
  expectedContext: FiscalContext,
): boolean {
  return (
    outcome.status === "accepted" &&
    sameContext(outcome.value.context, expectedContext)
  );
}
export function assertRecordIdentityDistinct(record: BillingRecord): boolean {
  return (
    record.predecessorId === null ||
    !sameIdentity(record.predecessorId, record.id)
  );
}
