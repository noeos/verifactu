// SPDX-License-Identifier: Apache-2.0

import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly jitter: (attempt: number) => number;
}

export interface RetryDecision {
  readonly retry: boolean;
  readonly nextAttemptAt: string | undefined;
  readonly attempt: number;
  readonly reason: string;
}

export function decideRetry(input: {
  readonly now: string;
  readonly attempt: number;
  readonly reason: string;
  readonly policy: RetryPolicy;
}): Result<RetryDecision> {
  if (
    !Number.isInteger(input.attempt) ||
    input.attempt < 0 ||
    input.policy.maxAttempts < 1 ||
    input.policy.baseDelayMs < 0 ||
    input.policy.maxDelayMs < input.policy.baseDelayMs
  )
    return failure("INVALID_INPUT", [
      createDiagnostic({ code: "VF_INPUT_VALUE_INVALID", severity: "error", phase: "state" }),
    ]);
  if (input.attempt >= input.policy.maxAttempts)
    return success(
      Object.freeze({
        retry: false,
        nextAttemptAt: undefined,
        attempt: input.attempt,
        reason: input.reason,
      }),
    );
  const jitter = input.policy.jitter(input.attempt);
  if (!Number.isFinite(jitter) || jitter < 0 || jitter > 1)
    return failure("INVALID_INPUT", [
      createDiagnostic({
        code: "VF_INPUT_VALUE_INVALID",
        severity: "error",
        phase: "state",
        path: "/jitter",
      }),
    ]);
  const delay =
    Math.min(input.policy.maxDelayMs, input.policy.baseDelayMs * 2 ** input.attempt) * (1 + jitter);
  return success(
    Object.freeze({
      retry: true,
      nextAttemptAt: new Date(Date.parse(input.now) + delay).toISOString(),
      attempt: input.attempt + 1,
      reason: input.reason,
    }),
  );
}
