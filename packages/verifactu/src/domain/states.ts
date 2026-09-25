export type SubmissionState =
  | "notEligible"
  | "queued"
  | "attempting"
  | "accepted"
  | "acceptedWithQualification"
  | "rejected"
  | "retryableFailure"
  | "indeterminateOutcome";
export type Outcome =
  | "accepted"
  | "rejected"
  | "conflict"
  | "unavailable"
  | "indeterminate";
export const TERMINAL_OUTCOMES: readonly Outcome[] = Object.freeze([
  "accepted",
  "rejected",
  "conflict",
  "unavailable",
  "indeterminate",
]);
export function isTerminalOutcome(value: string): value is Outcome {
  return TERMINAL_OUTCOMES.includes(value as Outcome);
}
export function canTransitionSubmission(
  from: SubmissionState,
  to: SubmissionState,
): boolean {
  const states: readonly SubmissionState[] = [
    "notEligible",
    "queued",
    "attempting",
    "accepted",
    "acceptedWithQualification",
    "rejected",
    "retryableFailure",
    "indeterminateOutcome",
  ];
  if (!states.includes(from) || !states.includes(to)) return false;
  const allowed: Readonly<Record<SubmissionState, readonly SubmissionState[]>> =
    {
      notEligible: ["queued"],
      queued: ["attempting"],
      attempting: [
        "accepted",
        "acceptedWithQualification",
        "rejected",
        "retryableFailure",
        "indeterminateOutcome",
      ],
      accepted: [],
      acceptedWithQualification: [],
      rejected: [],
      retryableFailure: ["queued"],
      indeterminateOutcome: ["queued", "accepted", "rejected"],
    };
  return allowed[from].includes(to);
}
