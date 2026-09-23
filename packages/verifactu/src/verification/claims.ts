import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "../domain/diagnostics.js";

export type ClaimStatus = "valid" | "invalid" | "indeterminate" | "unavailable";

export interface VerificationClaims {
  readonly official: ClaimStatus;
  readonly cryptographic: ClaimStatus;
  readonly aeat: ClaimStatus;
  readonly noeosEvidence: ClaimStatus;
}

export function defineVerificationClaims(
  claims: VerificationClaims,
): OperationResult<VerificationClaims> {
  if (!Object.values(claims).every((status) => valid(status)))
    return failed("invalid", [
      diagnostic("DIAG-CLAIMS-INVALID", "input", "structure", "/claims"),
    ]);
  return succeeded(Object.freeze({ ...claims }));
}

export function aggregateVerificationClaims(
  claims: VerificationClaims,
): ClaimStatus {
  if (Object.values(claims).includes("invalid")) return "invalid";
  if (Object.values(claims).includes("indeterminate")) return "indeterminate";
  if (Object.values(claims).includes("unavailable")) return "unavailable";
  return "valid";
}

function valid(status: unknown): status is ClaimStatus {
  return ["valid", "invalid", "indeterminate", "unavailable"].includes(
    status as string,
  );
}
