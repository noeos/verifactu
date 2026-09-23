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
  readonly canonicalization: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
  readonly policyIdentifier: string;
  readonly expectedTargetType: string;
  readonly documentTransforms: readonly string[];
  readonly signedPropertiesTransforms: readonly string[];
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
const XADES_SIGNED_PROPERTIES = "http://uri.etsi.org/01903#SignedProperties";

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
    input.canonicalization !==
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315" ||
    input.policyIdentifier.length === 0 ||
    input.expectedTargetType.length === 0 ||
    input.minimumRsaBits < 2048 ||
    input.documentTransforms.length !== 1 ||
    input.documentTransforms[0] !== XMLDSIG_ENVELOPED ||
    input.signedPropertiesTransforms.length !== 1 ||
    input.signedPropertiesTransforms[0] !== input.canonicalization
  )
    return xadesFailure("DIAG-XADES-PROFILE");
  return succeeded(
    Object.freeze({
      ...input,
      documentTransforms: Object.freeze([...input.documentTransforms]),
      signedPropertiesTransforms: Object.freeze([
        ...input.signedPropertiesTransforms,
      ]),
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
  if (response.references.length !== 2)
    return xadesFailure("DIAG-XADES-REFERENCE");
  const document = response.references[0]!;
  const signedProperties = response.references[1]!;
  if (
    document.uri !== "" ||
    document.type !== "" ||
    document.targetId !== "" ||
    document.targetType !== profile.expectedTargetType ||
    document.digestAlgorithm !== profile.digestAlgorithm ||
    !sameTransforms(document.transforms, profile.documentTransforms) ||
    !signedProperties.uri.startsWith("#") ||
    signedProperties.targetId.length === 0 ||
    signedProperties.uri !== `#${signedProperties.targetId}` ||
    signedProperties.type !== XADES_SIGNED_PROPERTIES ||
    signedProperties.targetType !== "SignedProperties" ||
    signedProperties.digestAlgorithm !== profile.digestAlgorithm ||
    !sameTransforms(
      signedProperties.transforms,
      profile.signedPropertiesTransforms,
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

function sameTransforms(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((transform, index) => transform === expected[index])
  );
}

function xadesFailure(code: `DIAG-${string}`): OperationResult<never> {
  return failed("invalid", [diagnostic(code, "integrity", "state", "/xades")]);
}
