import { isSafeStoreToken } from "../persistence/model.js";

export type OperationalCondition =
  | "aeat-outage"
  | "certificate-expiring"
  | "certificate-revoked"
  | "endpoint-drift"
  | "schema-drift"
  | "lease-stuck"
  | "unknown-attempt"
  | "restore-request"
  | "rollback-request"
  | "clock-anomaly"
  | "provider-unavailable";

export type OperatorAction =
  | "pause-new-submissions"
  | "preserve-evidence-and-reconcile"
  | "renew-through-authorized-provider"
  | "activate-approved-edition"
  | "inspect-fenced-lease"
  | "verify-backup-before-restore"
  | "require-two-party-rollback-review"
  | "restore-trusted-clock"
  | "check-provider-health"
  | "escalate-to-owner";

export interface RunbookDecision {
  readonly condition: OperationalCondition;
  readonly actions: readonly OperatorAction[];
  readonly stopProductionDispatch: boolean;
  readonly automaticMutationAllowed: false;
  readonly diagnostic: string;
  readonly evidenceReference: string | null;
}

const runbook: Readonly<
  Record<
    OperationalCondition,
    {
      readonly actions: readonly OperatorAction[];
      readonly stop: boolean;
      readonly diagnostic: string;
    }
  >
> = Object.freeze({
  "aeat-outage": {
    actions: [
      "pause-new-submissions",
      "preserve-evidence-and-reconcile",
      "escalate-to-owner",
    ],
    stop: true,
    diagnostic: "DIAG-RUNBOOK-AEAT-OUTAGE",
  },
  "certificate-expiring": {
    actions: ["renew-through-authorized-provider", "activate-approved-edition"],
    stop: false,
    diagnostic: "DIAG-RUNBOOK-CERTIFICATE-EXPIRY",
  },
  "certificate-revoked": {
    actions: [
      "pause-new-submissions",
      "renew-through-authorized-provider",
      "activate-approved-edition",
      "escalate-to-owner",
    ],
    stop: true,
    diagnostic: "DIAG-RUNBOOK-CERTIFICATE-REVOKED",
  },
  "endpoint-drift": {
    actions: [
      "pause-new-submissions",
      "preserve-evidence-and-reconcile",
      "activate-approved-edition",
      "escalate-to-owner",
    ],
    stop: true,
    diagnostic: "DIAG-RUNBOOK-ENDPOINT-DRIFT",
  },
  "schema-drift": {
    actions: [
      "pause-new-submissions",
      "preserve-evidence-and-reconcile",
      "activate-approved-edition",
      "escalate-to-owner",
    ],
    stop: true,
    diagnostic: "DIAG-RUNBOOK-SCHEMA-DRIFT",
  },
  "lease-stuck": {
    actions: [
      "preserve-evidence-and-reconcile",
      "inspect-fenced-lease",
      "escalate-to-owner",
    ],
    stop: false,
    diagnostic: "DIAG-RUNBOOK-LEASE-STUCK",
  },
  "unknown-attempt": {
    actions: [
      "pause-new-submissions",
      "preserve-evidence-and-reconcile",
      "escalate-to-owner",
    ],
    stop: true,
    diagnostic: "DIAG-RUNBOOK-UNKNOWN-ATTEMPT",
  },
  "restore-request": {
    actions: [
      "pause-new-submissions",
      "verify-backup-before-restore",
      "preserve-evidence-and-reconcile",
      "escalate-to-owner",
    ],
    stop: true,
    diagnostic: "DIAG-RUNBOOK-RESTORE",
  },
  "rollback-request": {
    actions: [
      "pause-new-submissions",
      "require-two-party-rollback-review",
      "preserve-evidence-and-reconcile",
      "escalate-to-owner",
    ],
    stop: true,
    diagnostic: "DIAG-RUNBOOK-ROLLBACK",
  },
  "clock-anomaly": {
    actions: [
      "pause-new-submissions",
      "preserve-evidence-and-reconcile",
      "restore-trusted-clock",
      "escalate-to-owner",
    ],
    stop: true,
    diagnostic: "DIAG-RUNBOOK-CLOCK",
  },
  "provider-unavailable": {
    actions: [
      "preserve-evidence-and-reconcile",
      "check-provider-health",
      "escalate-to-owner",
    ],
    stop: false,
    diagnostic: "DIAG-RUNBOOK-PROVIDER",
  },
});

/** Recommendations are operator-owned. This module has no delete, resend or credential mutation capability. */
export function decideRunbook(input: {
  readonly condition: OperationalCondition;
  readonly evidenceReference: string | null;
}): RunbookDecision | null {
  if (
    !input ||
    !Object.hasOwn(runbook, input.condition) ||
    (input.evidenceReference !== null &&
      !isSafeStoreToken(input.evidenceReference))
  )
    return null;
  const selected = runbook[input.condition];
  return Object.freeze({
    condition: input.condition,
    actions: Object.freeze([...selected.actions]),
    stopProductionDispatch: selected.stop,
    automaticMutationAllowed: false,
    diagnostic: selected.diagnostic,
    evidenceReference: input.evidenceReference,
  });
}
