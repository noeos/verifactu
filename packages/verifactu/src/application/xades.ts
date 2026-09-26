import type { XmlArtifact } from "./xml-artifacts.js";
import type {
  XadesProvider,
  XadesVerificationResult,
} from "../ports/signature.js";
import type { OpaqueSigningKey } from "../ports/signature.js";
import { digestBytes, type DigestPort } from "../ports/digest.js";

export interface SignArtifactRequest {
  readonly artifact: XmlArtifact;
  readonly targetName: "RegistroAlta" | "RegistroAnulacion" | "RegistroEvento";
  readonly profileId: string;
  readonly signingTime: string;
  readonly validationTime: string;
  readonly signer: OpaqueSigningKey;
  readonly trustAnchorsDer: readonly Uint8Array[];
  readonly crlEvidence: readonly Uint8Array[];
  readonly ocspEvidence: readonly Uint8Array[];
  readonly maximumRevocationAgeSeconds: number;
  readonly digest: DigestPort;
}

export type SignArtifactResult =
  | {
      readonly status: "signed";
      readonly bytes: Uint8Array;
      readonly sha256: string;
      readonly verification: XadesVerificationResult;
    }
  | {
      readonly status:
        | "invalid"
        | "indeterminate"
        | "unavailable"
        | "limit"
        | "cancelled"
        | "defect";
      readonly diagnostics: readonly string[];
    };

/** Signs an eligible immutable artifact and releases bytes only after local verification. */
export async function signEligibleArtifact(
  request: SignArtifactRequest,
  provider: XadesProvider,
  options: { readonly signal?: AbortSignal; readonly deadlineMs?: number } = {},
): Promise<SignArtifactResult> {
  const artifact = request?.artifact;
  if (
    !artifact ||
    artifact.state !== "eligible" ||
    !(artifact.bytes instanceof Uint8Array) ||
    artifact.bytes.byteLength !== artifact.length ||
    !/^sha256:[0-9a-f]{64}$/u.test(artifact.sha256) ||
    request.profileId !== "AEAT-XADES-EPES-v0.1.5" ||
    !provider ||
    typeof provider.sign !== "function"
  )
    return failed("invalid", "DIAG-XADES-ARTIFACT");

  const result = await provider.sign(
    {
      editionId: artifact.editionId.value,
      profileId: request.profileId,
      targetName: request.targetName,
      artifactBytes: artifact.bytes,
      artifactDigestSha256: artifact.sha256.slice("sha256:".length),
      signingTime: request.signingTime,
      signer: request.signer,
      trustAnchorsDer: request.trustAnchorsDer,
      crlEvidence: request.crlEvidence,
      ocspEvidence: request.ocspEvidence,
      validationTime: request.validationTime,
      maximumRevocationAgeSeconds: request.maximumRevocationAgeSeconds,
    },
    options,
  );
  if (result.status !== "signed")
    return failed(result.status, result.diagnostics);
  if (result.verification.status !== "valid")
    return failed("indeterminate", result.verification.diagnostics);
  const digest = digestBytes(request.digest, "sha256", result.bytes);
  if (digest.status !== "ok")
    return failed(
      "defect",
      digest.diagnostics.map((item) => item.code),
    );
  return Object.freeze({
    status: "signed",
    bytes: result.bytes.slice(),
    sha256: digest.value,
    verification: result.verification,
  });
}

function failed(
  status:
    | "invalid"
    | "indeterminate"
    | "unavailable"
    | "limit"
    | "cancelled"
    | "defect",
  diagnostics: string | readonly string[],
): SignArtifactResult {
  return Object.freeze({
    status,
    diagnostics: Object.freeze(
      typeof diagnostics === "string" ? [diagnostics] : [...diagnostics],
    ),
  });
}
