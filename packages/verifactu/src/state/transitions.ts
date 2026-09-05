// SPDX-License-Identifier: Apache-2.0

import { createDiagnostic, type Diagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";
import type { RecordState, StateActor, StateTransition } from "./model.js";

const ALLOWED: Readonly<Record<RecordState, readonly RecordState[]>> = Object.freeze({
  prepared: ["secured"],
  secured: ["persisted"],
  persisted: ["queued"],
  queued: ["submitting"],
  submitting: ["accepted", "accepted-with-errors", "rejected", "retryable", "indeterminate"],
  "accepted-with-errors": ["correction-required"],
  "correction-required": ["queued"],
  accepted: ["cancelled"],
  rejected: ["queued"],
  retryable: ["queued"],
  indeterminate: ["accepted", "accepted-with-errors", "rejected", "retryable"],
  cancelled: [],
});

export function canTransition(from: RecordState, to: RecordState): boolean {
  const allowed = (ALLOWED as Readonly<Record<string, readonly RecordState[]>>)[from];
  return allowed?.includes(to) ?? false;
}

export function transitionRecord(input: {
  readonly recordId: string;
  readonly from: RecordState;
  readonly to: RecordState;
  readonly reason: string;
  readonly attempt: number;
  readonly actor: StateActor;
  readonly at: string;
}): Result<StateTransition> {
  if (!canTransition(input.from, input.to)) {
    return failure("INVALID_INPUT", [
      stateDiagnostic("VF_STATE_TRANSITION_INVALID", input.from, input.to),
    ]);
  }
  return success(Object.freeze({ ...input }));
}

function stateDiagnostic(
  code: "VF_STATE_TRANSITION_INVALID",
  from: RecordState,
  to: RecordState,
): Diagnostic {
  return createDiagnostic({
    code,
    severity: "error",
    phase: "state",
    details: { from, to },
  });
}
