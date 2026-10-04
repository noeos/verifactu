import { createFiscalInstant } from "../domain/date-time.js";
import type { AeatOperationId } from "./edition-profile.js";
import type { DeliveryKnowledge } from "./transport.js";
import { isSafeStoreToken } from "../persistence/model.js";
import type { OutboxState } from "../persistence/model.js";

export type RetryAction =
  | {
      readonly action: "retry-at";
      readonly retryAt: string;
      readonly attempt: number;
      readonly evidenceId: string | null;
    }
  | { readonly action: "reconcile-first"; readonly reason: string }
  | { readonly action: "terminal"; readonly state: OutboxState }
  | { readonly action: "operator-required"; readonly reason: string }
  | { readonly action: "blocked"; readonly reason: string };

export interface RetryPolicy {
  readonly policyId: string;
  readonly digest: string;
  readonly maximumAttempts: number;
  readonly baseDelayMs: number;
  readonly maximumDelayMs: number;
  readonly retryableFaults: readonly string[];
  readonly replayEvidenceRequired: boolean;
}

export function decideRetry(input: {
  readonly operationId: AeatOperationId;
  readonly state: OutboxState;
  readonly attemptCount: number;
  readonly delivery: DeliveryKnowledge;
  readonly faultCode: string;
  readonly provedNotAppliedEvidenceId: string | null;
  readonly replayAuthorizationEvidenceId: string | null;
  readonly aeatWaitUntil: string | null;
  readonly now: string;
  readonly jitterPermille: number;
  readonly policy: RetryPolicy;
}): RetryAction {
  const policy = input?.policy;
  if (
    !input ||
    !policy ||
    !isSafeStoreToken(policy.policyId) ||
    !/^sha256:[0-9a-f]{64}$/u.test(policy.digest) ||
    !Number.isSafeInteger(policy.maximumAttempts) ||
    policy.maximumAttempts < 1 ||
    policy.maximumAttempts > 100 ||
    !Number.isSafeInteger(policy.baseDelayMs) ||
    policy.baseDelayMs < 0 ||
    !Number.isSafeInteger(policy.maximumDelayMs) ||
    policy.maximumDelayMs < policy.baseDelayMs ||
    policy.maximumDelayMs > 86_400_000 ||
    !Array.isArray(policy.retryableFaults) ||
    policy.retryableFaults.some(
      (code) => !/^DIAG-[A-Z0-9_-]{1,100}$/u.test(code),
    ) ||
    !Number.isSafeInteger(input.attemptCount) ||
    input.attemptCount < 0 ||
    !Number.isSafeInteger(input.jitterPermille) ||
    input.jitterPermille < 0 ||
    input.jitterPermille > 1000 ||
    createFiscalInstant(input.now).status !== "ok" ||
    (input.aeatWaitUntil !== null &&
      createFiscalInstant(input.aeatWaitUntil).status !== "ok")
  )
    return { action: "blocked", reason: "DIAG-RETRY-INPUT" };
  if (
    input.state === "accepted" ||
    input.state === "accepted-with-errors" ||
    input.state === "rejected" ||
    input.state === "permanently-failed"
  )
    return { action: "terminal", state: input.state };
  if (
    input.state === "attempt-started" ||
    input.state === "indeterminate" ||
    input.state === "reconciliation-required"
  )
    return {
      action: "reconcile-first",
      reason: "DIAG-RECONCILIATION-REQUIRED",
    };
  if (
    input.delivery !== "not-started" &&
    !isSafeStoreToken(input.provedNotAppliedEvidenceId)
  )
    return { action: "reconcile-first", reason: "DIAG-DELIVERY-AMBIGUOUS" };
  if (
    input.delivery === "not-started" &&
    !policy.retryableFaults.includes(input.faultCode)
  )
    return { action: "operator-required", reason: "DIAG-RETRY-FAULT-UNKNOWN" };
  if (
    input.delivery !== "not-started" &&
    input.delivery !== "fully-sent" &&
    !isSafeStoreToken(input.provedNotAppliedEvidenceId)
  )
    return { action: "reconcile-first", reason: "DIAG-DELIVERY-AMBIGUOUS" };
  if (input.attemptCount >= policy.maximumAttempts)
    return { action: "operator-required", reason: "DIAG-RETRY-EXHAUSTED" };
  if (
    input.delivery !== "not-started" &&
    policy.replayEvidenceRequired &&
    !isSafeStoreToken(input.replayAuthorizationEvidenceId)
  )
    return { action: "reconcile-first", reason: "DIAG-REPLAY-NOT-AUTHORIZED" };
  const exponent = Math.min(input.attemptCount, 30);
  const base = Math.min(
    policy.maximumDelayMs,
    policy.baseDelayMs * 2 ** exponent,
  );
  const jitter = Math.floor((base * input.jitterPermille) / 1000);
  const calculated = new Date(
    Date.parse(input.now) + base + jitter,
  ).toISOString();
  const retryAt =
    input.aeatWaitUntil &&
    Date.parse(input.aeatWaitUntil) > Date.parse(calculated)
      ? input.aeatWaitUntil
      : calculated;
  return {
    action: "retry-at",
    retryAt,
    attempt: input.attemptCount + 1,
    evidenceId:
      input.delivery === "not-started"
        ? null
        : input.provedNotAppliedEvidenceId,
  };
}
