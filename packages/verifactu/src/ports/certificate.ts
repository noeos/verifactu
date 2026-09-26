export type RevocationStatus =
  | "valid"
  | "revoked"
  | "unknown"
  | "stale"
  | "absent";

export interface RevocationEvidenceInput {
  readonly crls: readonly Uint8Array[];
  readonly ocsps: readonly Uint8Array[];
  readonly validationTime: string;
  readonly maximumAgeSeconds: number;
}

export interface CertificatePolicyInput {
  readonly leafDer: Uint8Array;
  readonly chainDer: readonly Uint8Array[];
  readonly trustAnchorsDer: readonly Uint8Array[];
  readonly expectedFingerprintSha256?: string;
  readonly validationTime: string;
  readonly minimumRsaBits: 1024;
  readonly requiredKeyUsage: "digitalSignature";
  readonly revocation: RevocationEvidenceInput;
}

export interface CertificatePolicyResult {
  readonly status: "valid" | "invalid" | "indeterminate";
  readonly chain: CertificateOutcome;
  readonly trust: CertificateOutcome;
  readonly time: CertificateOutcome;
  readonly usage: CertificateOutcome;
  readonly extendedKeyUsage: CertificateOutcome;
  readonly identity: CertificateOutcome;
  readonly authorization: CertificateOutcome;
  readonly algorithm: CertificateOutcome;
  readonly revocation: RevocationStatus;
  readonly fingerprintSha256: string | null;
  readonly diagnostics: readonly string[];
}

export type CertificateOutcome =
  | "valid"
  | "invalid"
  | "indeterminate"
  | "not-evaluated";
