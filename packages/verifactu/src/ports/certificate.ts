import type { FiscalInstant } from "../domain/date-time.js";
import type { EditionId } from "../domain/identities.js";

export type CertificateValidationStatus =
  | "valid"
  | "invalid"
  | "indeterminate"
  | "unavailable"
  | "cancelled"
  | "defect";

export interface CertificateValidationRequest {
  readonly editionId: EditionId;
  readonly certificateChainDer: readonly Uint8Array[];
  readonly certificateFingerprintSha256: string;
  readonly validationInstant: FiscalInstant;
  readonly requireRevocationEvidence: boolean;
  readonly requiredSubject: string;
  readonly minimumRsaBits: number;
}

export interface CertificateValidationResult {
  readonly status: CertificateValidationStatus;
  readonly certificateFingerprintSha256: string;
  readonly chain: "valid" | "invalid" | "not-evaluated";
  readonly time: "valid" | "invalid" | "not-evaluated";
  readonly revocation: "valid" | "invalid" | "indeterminate" | "not-evaluated";
  readonly authorization: "valid" | "invalid" | "not-evaluated";
  readonly diagnostics: readonly string[];
}

export interface CertificateValidator {
  validate(
    request: CertificateValidationRequest,
    options?: { readonly signal?: AbortSignal; readonly deadlineMs?: number },
  ): Promise<CertificateValidationResult>;
}
