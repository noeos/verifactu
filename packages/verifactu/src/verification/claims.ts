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
  claims: unknown,
): OperationResult<VerificationClaims> {
  const copied = copyClaims(claims);
  if (copied === null)
    return failed("invalid", [
      diagnostic("DIAG-CLAIMS-INVALID", "input", "structure", "/claims"),
    ]);
  return succeeded(copied);
}

export function aggregateVerificationClaims(claims: unknown): ClaimStatus {
  const copied = copyClaims(claims);
  if (copied === null) return "indeterminate";
  const statuses = [
    copied.official,
    copied.cryptographic,
    copied.aeat,
    copied.noeosEvidence,
  ];
  if (statuses.includes("invalid")) return "invalid";
  if (statuses.includes("indeterminate")) return "indeterminate";
  if (statuses.includes("unavailable")) return "unavailable";
  return "valid";
}

function copyClaims(value: unknown): VerificationClaims | null {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return null;
  try {
    if (Object.getPrototypeOf(value) !== Object.prototype) return null;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(descriptors).sort();
    const expected = ["aeat", "cryptographic", "noeosEvidence", "official"];
    if (
      keys.length !== expected.length ||
      keys.some((key, index) => key !== expected[index])
    )
      return null;
    const statuses = keys.map((key) => {
      const descriptor = descriptors[key as keyof typeof descriptors];
      return descriptor && "value" in descriptor && descriptor.enumerable
        ? descriptor.value
        : undefined;
    });
    if (!statuses.every(valid)) return null;
    return Object.freeze({
      official: descriptors.official?.value as ClaimStatus,
      cryptographic: descriptors.cryptographic?.value as ClaimStatus,
      aeat: descriptors.aeat?.value as ClaimStatus,
      noeosEvidence: descriptors.noeosEvidence?.value as ClaimStatus,
    });
  } catch {
    return null;
  }
}

function valid(status: unknown): status is ClaimStatus {
  return (
    status === "valid" ||
    status === "invalid" ||
    status === "indeterminate" ||
    status === "unavailable"
  );
}
