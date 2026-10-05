import { createFiscalContext, sameContext } from "../domain/context.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalInstant } from "../domain/date-time.js";
import type { Identity } from "../domain/identities.js";
import { isIdentity, sameIdentity } from "../domain/identities.js";
import type { StoreResult } from "../persistence/model.js";
import { isSafeStoreToken, storeFailure } from "../persistence/model.js";
import type { AeatEnvironment } from "./edition-profile.js";

export type CredentialPurpose = "tls-client-authentication" | "xml-signing";

/** Only opaque provider references and non-secret authorization facts are stored. */
export interface CertificateBinding {
  readonly credentialId: string;
  readonly credentialHandle: string;
  readonly context: FiscalContext;
  readonly taxpayerId: Identity<"taxpayer">;
  readonly representativeId: Identity<"taxpayer"> | null;
  readonly environment: AeatEnvironment;
  readonly purposes: readonly CredentialPurpose[];
  readonly activeFrom: string;
  readonly activeUntil: string | null;
  readonly authorizationEvidenceId: string;
}

export interface CertificateFacts {
  readonly fingerprint: string;
  readonly subjectDigest: string;
  readonly issuerDigest: string;
  readonly serialDigest: string;
  readonly notBefore: string;
  readonly notAfter: string;
  readonly digitalSignatureUsage: boolean;
  readonly clientAuthenticationUsage: boolean;
  readonly revocation: "good" | "revoked" | "unknown";
}

export interface CertificateFactsPort {
  inspect(handle: string): Promise<StoreResult<CertificateFacts>>;
}

export interface RepresentativeAuthorizationPort {
  verify(input: {
    readonly evidenceId: string;
    readonly taxpayerId: Identity<"taxpayer">;
    readonly representativeId: Identity<"taxpayer">;
    readonly context: FiscalContext;
    readonly environment: AeatEnvironment;
    readonly purpose: CredentialPurpose;
    readonly observedAt: string;
  }): Promise<StoreResult<true>>;
}

export interface CertificateAuthorization {
  readonly credentialId: string;
  readonly credentialHandle: string;
  readonly context: FiscalContext;
  readonly environment: AeatEnvironment;
  readonly purpose: CredentialPurpose;
  readonly certificateFingerprint: string;
  readonly subjectDigest: string;
  readonly authorizationEvidenceId: string;
  readonly authorizedAt: string;
}

export async function authorizeCertificate(input: {
  readonly binding: CertificateBinding;
  readonly context: FiscalContext;
  readonly environment: AeatEnvironment;
  readonly purpose: CredentialPurpose;
  readonly actingParty: Identity<"taxpayer">;
  readonly now: string;
  readonly facts: CertificateFactsPort;
  readonly representativeAuthorization: RepresentativeAuthorizationPort;
}): Promise<StoreResult<CertificateAuthorization>> {
  const binding = input?.binding;
  if (
    !binding ||
    createFiscalContext(input.context).status !== "ok" ||
    createFiscalContext(binding.context).status !== "ok" ||
    !sameContext(binding.context, input.context) ||
    !isIdentity(binding.taxpayerId, "taxpayer") ||
    !sameIdentity(binding.taxpayerId, input.context.taxpayerId) ||
    !["test", "production"].includes(input.environment) ||
    binding.environment !== input.environment ||
    !["tls-client-authentication", "xml-signing"].includes(input.purpose) ||
    !Array.isArray(binding.purposes) ||
    !binding.purposes.some((purpose) => purpose === input.purpose) ||
    !isSafeStoreToken(binding.credentialId) ||
    !isSafeStoreToken(binding.credentialHandle) ||
    !isSafeStoreToken(binding.authorizationEvidenceId) ||
    createFiscalInstant(input.now).status !== "ok" ||
    createFiscalInstant(binding.activeFrom).status !== "ok" ||
    (binding.activeUntil !== null &&
      createFiscalInstant(binding.activeUntil).status !== "ok") ||
    Date.parse(binding.activeFrom) > Date.parse(input.now) ||
    (binding.activeUntil !== null &&
      Date.parse(binding.activeUntil) <= Date.parse(input.now)) ||
    !isIdentity(input.actingParty, "taxpayer")
  )
    return storeFailure("invalid", "invalid-input");
  const direct = sameIdentity(input.actingParty, binding.taxpayerId);
  if (
    !direct &&
    (!binding.representativeId ||
      !sameIdentity(binding.representativeId, input.actingParty))
  )
    return storeFailure("invalid", "context-mismatch");
  if (!direct) {
    if (!input.representativeAuthorization)
      return storeFailure("unavailable", "unsupported-capability");
    const authorization = await input.representativeAuthorization.verify({
      evidenceId: binding.authorizationEvidenceId,
      taxpayerId: binding.taxpayerId,
      representativeId: binding.representativeId!,
      context: input.context,
      environment: input.environment,
      purpose: input.purpose,
      observedAt: input.now,
    });
    if (authorization.status !== "ok") return authorization;
    if (authorization.value !== true)
      return storeFailure("invalid", "unsupported-capability");
  }

  if (!input.facts || typeof input.facts.inspect !== "function")
    return storeFailure("unavailable", "unsupported-capability");
  const inspected = await input.facts.inspect(binding.credentialHandle);
  if (inspected.status !== "ok") return inspected;
  const facts = inspected.value;
  if (
    !/^sha256:[0-9a-f]{64}$/u.test(facts.fingerprint) ||
    !/^sha256:[0-9a-f]{64}$/u.test(facts.subjectDigest) ||
    !/^sha256:[0-9a-f]{64}$/u.test(facts.issuerDigest) ||
    !/^sha256:[0-9a-f]{64}$/u.test(facts.serialDigest) ||
    createFiscalInstant(facts.notBefore).status !== "ok" ||
    createFiscalInstant(facts.notAfter).status !== "ok" ||
    Date.parse(facts.notBefore) > Date.parse(input.now) ||
    Date.parse(facts.notAfter) <= Date.parse(input.now) ||
    facts.revocation !== "good" ||
    !facts.digitalSignatureUsage ||
    (input.purpose === "tls-client-authentication" &&
      !facts.clientAuthenticationUsage)
  )
    return storeFailure(
      "invalid",
      facts.revocation === "unknown" ? "unavailable" : "unsupported-capability",
    );
  return {
    status: "ok",
    value: Object.freeze({
      credentialId: binding.credentialId,
      credentialHandle: binding.credentialHandle,
      context: Object.freeze({ ...binding.context }),
      environment: input.environment,
      purpose: input.purpose,
      certificateFingerprint: facts.fingerprint,
      subjectDigest: facts.subjectDigest,
      authorizationEvidenceId: binding.authorizationEvidenceId,
      authorizedAt: input.now,
    }),
  };
}
