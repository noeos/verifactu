import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "./diagnostics.js";
import type { FiscalEvent } from "./events.js";
import type {
  ArtifactId,
  AttemptId,
  EvidenceId,
  InstallationId,
  TaxpayerId,
} from "./identities.js";
import type { OperatingMode } from "./mode-tenure.js";

export type InstallationState =
  | { readonly kind: "unconfigured" }
  | {
      readonly kind: "active";
      readonly mode: OperatingMode;
      readonly taxpayerId: TaxpayerId;
      readonly installationId: InstallationId;
    }
  | {
      readonly kind: "transition-pending";
      readonly from: "non-verifactu";
      readonly to: "verifactu";
      readonly taxpayerId: TaxpayerId;
      readonly installationId: InstallationId;
    }
  | {
      readonly kind: "suspended-by-fault";
      readonly priorMode: OperatingMode;
      readonly taxpayerId: TaxpayerId;
      readonly installationId: InstallationId;
    }
  | { readonly kind: "retired" };

export const INITIAL_INSTALLATION_STATE: InstallationState = Object.freeze({
  kind: "unconfigured",
});

export function transitionInstallation(
  state: InstallationState,
  event: FiscalEvent,
): OperationResult<InstallationState> {
  if (state.kind === "unconfigured" && event.kind === "configured") {
    return succeeded(
      Object.freeze({
        kind: "active",
        mode: event.mode,
        taxpayerId: event.taxpayerId,
        installationId: event.installationId,
      }),
    );
  }
  if (
    state.kind === "active" &&
    state.mode === "non-verifactu" &&
    event.kind === "transition-requested"
  ) {
    return succeeded(
      Object.freeze({
        kind: "transition-pending",
        from: "non-verifactu",
        to: "verifactu",
        taxpayerId: state.taxpayerId,
        installationId: state.installationId,
      }),
    );
  }
  if (
    state.kind === "transition-pending" &&
    event.kind === "transition-completed"
  ) {
    return succeeded(
      Object.freeze({
        kind: "active",
        mode: "verifactu",
        taxpayerId: state.taxpayerId,
        installationId: state.installationId,
      }),
    );
  }
  if (state.kind === "active" && event.kind === "fault-suspended") {
    return succeeded(
      Object.freeze({
        kind: "suspended-by-fault",
        priorMode: state.mode,
        taxpayerId: state.taxpayerId,
        installationId: state.installationId,
      }),
    );
  }
  if (state.kind === "suspended-by-fault" && event.kind === "resumed") {
    return succeeded(
      Object.freeze({
        kind: "active",
        mode: state.priorMode,
        taxpayerId: state.taxpayerId,
        installationId: state.installationId,
      }),
    );
  }
  if (
    state.kind !== "unconfigured" &&
    state.kind !== "retired" &&
    event.kind === "retired"
  ) {
    return succeeded(Object.freeze({ kind: "retired" }));
  }
  return failed("conflict", [
    diagnostic("DIAG-STATE-TRANSITION", "conflict", "state", "/state", {
      state: state.kind,
      event: event.kind,
    }),
  ]);
}

export type ConstructionState = "accepted" | "rejected" | "indeterminate";
export type DurabilityState = "not-committed" | "committed";
export type ChainVerificationState =
  | "not-verified"
  | "verified"
  | "broken"
  | "indeterminate";
export type SubmissionState =
  | "not-eligible"
  | "queued"
  | "attempting"
  | "accepted"
  | "accepted-with-qualification"
  | "rejected"
  | "retryable-failure"
  | "indeterminate-outcome";
export type AuthorityResponseState =
  | "not-observed"
  | "accepted"
  | "accepted-with-qualification"
  | "rejected"
  | "indeterminate";
export type CorrectionState =
  | "original"
  | "corrected"
  | "substituted"
  | "cancelled";
export type ConservationState = "not-retained" | "retained" | "exported";

export interface RecordLifecycleState {
  readonly construction: ConstructionState;
  readonly durability: DurabilityState;
  readonly chainVerification: ChainVerificationState;
  readonly submission: SubmissionState;
  readonly authorityResponse: AuthorityResponseState;
  readonly correction: CorrectionState;
  readonly conservation: ConservationState;
  readonly quarantine: "clear" | "quarantined";
  readonly artifactId?: ArtifactId;
  readonly attemptId?: AttemptId;
  readonly evidenceIds: readonly EvidenceId[];
}

export function defineRecordLifecycle(
  state: RecordLifecycleState,
): OperationResult<RecordLifecycleState> {
  const hasAttempt = state.attemptId !== undefined;
  const hasResponse = state.authorityResponse !== "not-observed";
  const eligibleSubmission = state.submission !== "not-eligible";
  if (
    (eligibleSubmission &&
      (state.construction !== "accepted" ||
        state.durability !== "committed" ||
        state.artifactId === undefined)) ||
    (state.chainVerification === "verified" &&
      state.artifactId === undefined) ||
    (hasResponse && !hasAttempt) ||
    (state.submission === "attempting" && !hasAttempt) ||
    (["accepted", "accepted-with-qualification", "rejected"].includes(
      state.submission,
    ) &&
      state.authorityResponse === "not-observed") ||
    (state.quarantine === "quarantined" && eligibleSubmission)
  ) {
    return failed("conflict", [
      diagnostic(
        "DIAG-RECORD-STATE-IMPOSSIBLE",
        "integrity",
        "state",
        "/recordState",
      ),
    ]);
  }
  return succeeded(
    Object.freeze({
      ...state,
      evidenceIds: Object.freeze([...state.evidenceIds]),
    }),
  );
}

const SUBMISSION_EDGES = Object.freeze({
  "not-eligible": Object.freeze(["queued"] as const),
  queued: Object.freeze(["attempting"] as const),
  attempting: Object.freeze([
    "accepted",
    "accepted-with-qualification",
    "rejected",
    "retryable-failure",
    "indeterminate-outcome",
  ] as const),
  accepted: Object.freeze([] as const),
  "accepted-with-qualification": Object.freeze([] as const),
  rejected: Object.freeze([] as const),
  "retryable-failure": Object.freeze(["attempting"] as const),
  "indeterminate-outcome": Object.freeze(["attempting"] as const),
}) satisfies Readonly<Record<SubmissionState, readonly SubmissionState[]>>;

export function transitionSubmissionState(
  current: SubmissionState,
  next: SubmissionState,
): OperationResult<SubmissionState> {
  const allowed: readonly SubmissionState[] = SUBMISSION_EDGES[current];
  return allowed.includes(next)
    ? succeeded(next)
    : failed("conflict", [
        diagnostic(
          "DIAG-SUBMISSION-TRANSITION",
          "conflict",
          "state",
          "/submission",
          {
            current,
            next,
          },
        ),
      ]);
}
