import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "../domain/diagnostics.js";
import type { EditionId } from "../domain/identities.js";
import type { CertificateValidationResult } from "../ports/certificate.js";
import type {
  SignatureReference,
  XadesSigningRequest,
  XadesSigningResponse,
} from "../ports/signature.js";

export interface XadesProfile {
  readonly id: string;
  readonly editionId: EditionId;
  readonly form: "XAdES-EPES";
  readonly signaturePlacement: "enveloped";
  readonly digestAlgorithm: "SHA-256";
  readonly signatureAlgorithm: "RSA-SHA256";
  readonly canonicalization: "http://www.w3.org/2001/10/xml-exc-c14n#";
  readonly policyIdentifier: string;
  readonly expectedTargetType: string;
  readonly requiredTransforms: readonly string[];
  readonly minimumRsaBits: number;
}

export interface VerifiedXadesSignature {
  readonly profileId: string;
  readonly artifactSha256: string;
  readonly certificateFingerprintSha256: string;
  readonly references: readonly SignatureReference[];
}

const SHA256 = /^[a-f0-9]{64}$/u;
const XMLDSIG_ENVELOPED =
  "http://www.w3.org/2000/09/xmldsig#enveloped-signature";

export function defineXadesProfile(
  input: XadesProfile,
): OperationResult<XadesProfile> {
  if (
    input.id.length === 0 ||
    input.editionId.length === 0 ||
    input.form !== "XAdES-EPES" ||
    input.signaturePlacement !== "enveloped" ||
    input.digestAlgorithm !== "SHA-256" ||
    input.signatureAlgorithm !== "RSA-SHA256" ||
    input.canonicalization !== "http://www.w3.org/2001/10/xml-exc-c14n#" ||
    input.policyIdentifier.length === 0 ||
    input.expectedTargetType.length === 0 ||
    input.minimumRsaBits < 2048 ||
    input.requiredTransforms.length === 0 ||
    input.requiredTransforms[0] !== XMLDSIG_ENVELOPED ||
    new Set(input.requiredTransforms).size !== input.requiredTransforms.length
  )
    return xadesFailure("DIAG-XADES-PROFILE");
  return succeeded(
    Object.freeze({
      ...input,
      requiredTransforms: Object.freeze([...input.requiredTransforms]),
    }),
  );
}

export function verifyXadesProviderResponse(
  profile: XadesProfile,
  request: XadesSigningRequest,
  response: XadesSigningResponse,
  certificate: CertificateValidationResult,
): OperationResult<VerifiedXadesSignature> {
  if (
    request.editionId !== profile.editionId ||
    request.profileId !== profile.id ||
    !SHA256.test(request.artifactSha256) ||
    request.expectedTargetId.length === 0 ||
    request.key.providerId.length === 0 ||
    request.key.keyId.length === 0 ||
    !SHA256.test(request.key.certificateFingerprintSha256)
  )
    return xadesFailure("DIAG-XADES-REQUEST");
  if (
    response.signedXml.length === 0 ||
    response.report.providerId !== request.key.providerId
  )
    return xadesFailure("DIAG-XADES-PROVIDER");
  if (
    certificate.status !== "valid" ||
    certificate.chain !== "valid" ||
    certificate.time !== "valid" ||
    certificate.authorization !== "valid" ||
    certificate.revocation === "invalid" ||
    certificate.certificateFingerprintSha256 !==
      request.key.certificateFingerprintSha256
  )
    return xadesFailure("DIAG-XADES-CERTIFICATE");
  if (response.references.length !== 1)
    return xadesFailure("DIAG-XADES-REFERENCE");
  const reference = response.references[0]!;
  if (
    reference.uri !== `#${request.expectedTargetId}` ||
    reference.targetId !== request.expectedTargetId ||
    reference.targetType !== profile.expectedTargetType ||
    reference.digestAlgorithm !== profile.digestAlgorithm ||
    reference.transforms.length !== profile.requiredTransforms.length ||
    reference.transforms.some(
      (transform, index) => transform !== profile.requiredTransforms[index],
    )
  )
    return xadesFailure("DIAG-XADES-REFERENCE");
  return succeeded(
    Object.freeze({
      profileId: profile.id,
      artifactSha256: request.artifactSha256,
      certificateFingerprintSha256: request.key.certificateFingerprintSha256,
      references: Object.freeze(
        response.references.map((item) =>
          Object.freeze({
            ...item,
            transforms: Object.freeze([...item.transforms]),
          }),
        ),
      ),
    }),
  );
}

function xadesFailure(code: `DIAG-${string}`): OperationResult<never> {
  return failed("invalid", [diagnostic(code, "integrity", "state", "/xades")]);
}
