import type { FiscalInstant } from "../domain/date-time.js";
import type { EditionId } from "../domain/identities.js";

/** An opaque provider reference. It is deliberately not key material. */
export interface SigningKeyHandle {
  readonly providerId: string;
  readonly keyId: string;
  readonly certificateFingerprintSha256: string;
}

export interface SignatureReference {
  readonly uri: string;
  readonly targetId: string;
  readonly targetType: string;
  readonly transforms: readonly string[];
  readonly digestAlgorithm: "SHA-256";
}

export interface XadesSigningRequest {
  readonly editionId: EditionId;
  readonly profileId: string;
  readonly artifactSha256: string;
  readonly unsignedXml: Uint8Array;
  readonly expectedTargetId: string;
  readonly key: SigningKeyHandle;
  readonly signingInstant: FiscalInstant;
  readonly deadlineMs: number;
}

export interface ProviderDiagnosticReport {
  readonly providerId: string;
  readonly capabilityVersion: string;
  readonly diagnostics: readonly string[];
}

export interface XadesSigningResponse {
  readonly signedXml: Uint8Array;
  readonly certificateChainDer: readonly Uint8Array[];
  readonly references: readonly SignatureReference[];
  readonly report: ProviderDiagnosticReport;
}

export type SignatureProviderResult =
  | { readonly kind: "signed"; readonly response: XadesSigningResponse }
  | { readonly kind: "cancelled"; readonly diagnostics: readonly string[] }
  | { readonly kind: "unavailable"; readonly diagnostics: readonly string[] }
  | { readonly kind: "limit"; readonly diagnostics: readonly string[] }
  | { readonly kind: "defect"; readonly diagnostics: readonly string[] };

/** Effect boundary: implementations own all key and process interaction. */
export interface XadesSignatureProvider {
  sign(
    request: XadesSigningRequest,
    options?: { readonly signal?: AbortSignal },
  ): Promise<SignatureProviderResult>;
}
