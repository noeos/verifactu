export type SignatureAlgorithm = "RSA-SHA256" | "RSA-SHA512";

export interface OpaqueSigningKey {
  readonly keyHandle: string;
  readonly certificateDer: Uint8Array;
  readonly certificateChainDer: readonly Uint8Array[];
  sign(
    dataToSign: Uint8Array,
    request: {
      readonly algorithm: SignatureAlgorithm;
      readonly deadlineMs: number;
      readonly signal?: AbortSignal;
    },
  ): Promise<Uint8Array>;
}

export interface XadesSignRequest {
  readonly editionId: string;
  readonly profileId: string;
  readonly targetName: "RegistroAlta" | "RegistroAnulacion" | "RegistroEvento";
  readonly artifactBytes: Uint8Array;
  readonly artifactDigestSha256: string;
  readonly signingTime: string;
  readonly signer: OpaqueSigningKey;
  readonly trustAnchorsDer: readonly Uint8Array[];
  readonly crlEvidence: readonly Uint8Array[];
  readonly ocspEvidence: readonly Uint8Array[];
  readonly validationTime: string;
  readonly maximumRevocationAgeSeconds: number;
}

export interface XadesVerificationRequest {
  readonly editionId: string;
  readonly profileId: string;
  readonly targetName: "RegistroAlta" | "RegistroAnulacion" | "RegistroEvento";
  readonly artifactBytes: Uint8Array;
  readonly artifactDigestSha256: string;
  readonly expectedSignerFingerprintSha256?: string;
  readonly certificateChainDer?: readonly Uint8Array[];
  readonly trustAnchorsDer: readonly Uint8Array[];
  readonly crlEvidence: readonly Uint8Array[];
  readonly ocspEvidence: readonly Uint8Array[];
  readonly validationTime: string;
  readonly maximumRevocationAgeSeconds: number;
}

export type XadesResultStatus =
  | "valid"
  | "invalid"
  | "indeterminate"
  | "unavailable"
  | "limit"
  | "cancelled"
  | "defect";

export interface XadesVerificationResult {
  readonly status: XadesResultStatus;
  readonly profile: "valid" | "invalid" | "not-evaluated";
  readonly cryptographic: "valid" | "invalid" | "not-evaluated";
  readonly certificate: "valid" | "invalid" | "indeterminate" | "not-evaluated";
  readonly certificatePolicy: {
    readonly chain: "valid" | "invalid" | "indeterminate" | "not-evaluated";
    readonly trust: "valid" | "invalid" | "indeterminate" | "not-evaluated";
    readonly time: "valid" | "invalid" | "indeterminate" | "not-evaluated";
    readonly usage: "valid" | "invalid" | "indeterminate" | "not-evaluated";
    readonly extendedKeyUsage:
      | "valid"
      | "invalid"
      | "indeterminate"
      | "not-evaluated";
    readonly identity: "valid" | "invalid" | "indeterminate" | "not-evaluated";
    readonly authorization:
      | "valid"
      | "invalid"
      | "indeterminate"
      | "not-evaluated";
    readonly algorithm: "valid" | "invalid" | "indeterminate" | "not-evaluated";
  };
  readonly revocation:
    | "valid"
    | "revoked"
    | "unknown"
    | "stale"
    | "absent"
    | "not-evaluated";
  readonly validationTime: string | null;
  readonly diagnostics: readonly string[];
}

export interface XadesProvider {
  sign(
    request: XadesSignRequest,
    options?: { readonly signal?: AbortSignal; readonly deadlineMs?: number },
  ): Promise<
    | {
        readonly status: "signed";
        readonly bytes: Uint8Array;
        readonly verification: XadesVerificationResult;
      }
    | {
        readonly status: Exclude<XadesResultStatus, "valid">;
        readonly diagnostics: readonly string[];
      }
  >;
  verify(
    request: XadesVerificationRequest,
    options?: { readonly signal?: AbortSignal; readonly deadlineMs?: number },
  ): Promise<XadesVerificationResult>;
}
