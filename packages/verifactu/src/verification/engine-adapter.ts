import {
  CHAIN_SUMMARY_EVIDENCE_SCHEMA,
  LINK_EVIDENCE_SCHEMA,
  RECORD_EVIDENCE_SCHEMA,
  type ChainSummaryEvidence,
  type LinkEvidence,
  type RecordEvidence,
} from "@noeos/verification-engine";
import { invalid, ok, type Result } from "../contracts/results.js";
import {
  createVerificationClaim,
  createVerificationClaimSet,
  replaceVerificationClaim,
  type VerificationClaim,
  type VerificationClaimSet,
} from "./claims.js";
import {
  createEngineNormalizationProfile,
  createEngineProfileProjection,
  ENGINE_PROFILE_ID,
  ENGINE_PROFILE_VERSION,
  isEngineProfileProjection,
  type EngineProfileProjection,
  type EngineProfileProjectionInput,
} from "./engine-profile.js";
import {
  verificationEnginePort,
  type VerificationEnginePort,
} from "../ports/verification-engine.js";

const digestPattern = /^[0-9a-f]{64}$/u;
const PROFILE = Object.freeze({
  id: ENGINE_PROFILE_ID,
  version: ENGINE_PROFILE_VERSION,
});

export interface EngineEvidenceInput extends EngineProfileProjectionInput {
  readonly position: number;
}

export interface EngineEvidenceOutput {
  readonly claims: VerificationClaimSet;
  readonly recordEvidence?: RecordEvidence;
  readonly linkEvidence?: LinkEvidence;
  readonly chainSummary?: ChainSummaryEvidence;
}

function validRecordEvidence(
  value: unknown,
  projection: EngineProfileProjection,
): value is RecordEvidence {
  try {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return false;
    const evidence = value as Record<string, unknown>;
    const expectedKeys = [
      "$schema",
      "algorithm",
      "contentDigest",
      "contextId",
      "normalizedByteLength",
      "profile",
      "protocolVersion",
      "recordDigest",
      "recordId",
    ];
    const keys = Object.keys(evidence).sort();
    const profile = evidence.profile;
    if (!profile || typeof profile !== "object" || Array.isArray(profile))
      return false;
    const profileRecord = profile as Record<string, unknown>;
    return (
      keys.length === expectedKeys.length &&
      keys.every((key, index) => key === expectedKeys[index]) &&
      evidence.$schema === RECORD_EVIDENCE_SCHEMA &&
      evidence.protocolVersion === 1 &&
      evidence.contextId === projection.contextId &&
      evidence.recordId === projection.recordId &&
      profileRecord.id === PROFILE.id &&
      profileRecord.version === PROFILE.version &&
      evidence.algorithm === "sha-256" &&
      Number.isSafeInteger(evidence.normalizedByteLength) &&
      (evidence.normalizedByteLength as number) > 0 &&
      (evidence.normalizedByteLength as number) <= 65_536 &&
      typeof evidence.contentDigest === "string" &&
      digestPattern.test(evidence.contentDigest) &&
      typeof evidence.recordDigest === "string" &&
      digestPattern.test(evidence.recordDigest)
    );
  } catch {
    return false;
  }
}

function diagnosticCode(value: unknown, fallback: string): string {
  try {
    if (
      value &&
      typeof value === "object" &&
      "code" in value &&
      typeof value.code === "string" &&
      new Set([
        "PROFILE_UNKNOWN",
        "PROFILE_VERSION_CONFLICT",
        "INPUT_LIMIT_EXCEEDED",
        "EVIDENCE_SCHEMA_INVALID",
        "EVIDENCE_DIGEST_MISMATCH",
        "CHAIN_PREDECESSOR_MISMATCH",
      ]).has(value.code)
    )
      return `DIAG-ENGINE-${value.code}`;
  } catch {
    return fallback;
  }
  return fallback;
}

function validLinkEvidence(
  value: unknown,
  projection: EngineProfileProjection,
  position: number,
): value is LinkEvidence {
  try {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return false;
    const evidence = value as Record<string, unknown>;
    const keys = Object.keys(evidence).sort();
    const expectedKeys = [
      "$schema",
      "algorithm",
      "contentDigest",
      "contextId",
      "linkDigest",
      "normalizedByteLength",
      "position",
      "previous",
      "profile",
      "protocolVersion",
      "recordDigest",
      "recordId",
      "sequenceId",
    ];
    const profile = evidence.profile;
    if (!profile || typeof profile !== "object" || Array.isArray(profile))
      return false;
    const profileRecord = profile as Record<string, unknown>;
    const previous = evidence.previous as Record<string, unknown> | undefined;
    return (
      keys.length === expectedKeys.length &&
      keys.every((key, index) => key === expectedKeys[index]) &&
      evidence.$schema === LINK_EVIDENCE_SCHEMA &&
      evidence.protocolVersion === 1 &&
      evidence.contextId === projection.contextId &&
      evidence.sequenceId === projection.sequenceId &&
      evidence.recordId === projection.recordId &&
      profileRecord.id === PROFILE.id &&
      profileRecord.version === PROFILE.version &&
      evidence.algorithm === "sha-256" &&
      Number.isSafeInteger(evidence.normalizedByteLength) &&
      (evidence.normalizedByteLength as number) > 0 &&
      (evidence.normalizedByteLength as number) <= 65_536 &&
      typeof evidence.contentDigest === "string" &&
      digestPattern.test(evidence.contentDigest) &&
      typeof evidence.recordDigest === "string" &&
      digestPattern.test(evidence.recordDigest) &&
      evidence.position === position &&
      Number.isSafeInteger(evidence.position) &&
      previous !== undefined &&
      (projection.predecessorEvidenceDigest === null
        ? previous.kind === "none" && Object.keys(previous).length === 1
        : previous.kind === "digest" &&
          previous.value === projection.predecessorEvidenceDigest.slice(7) &&
          Object.keys(previous).length === 2) &&
      typeof evidence.linkDigest === "string" &&
      digestPattern.test(evidence.linkDigest)
    );
  } catch {
    return false;
  }
}

function validChainSummary(
  value: unknown,
  projection: EngineProfileProjection,
  position: number,
  linkDigest: string,
): value is ChainSummaryEvidence {
  try {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return false;
    const summary = value as Record<string, unknown>;
    const profile = summary.profile;
    if (!profile || typeof profile !== "object" || Array.isArray(profile))
      return false;
    const profileRecord = profile as Record<string, unknown>;
    return (
      summary.$schema === CHAIN_SUMMARY_EVIDENCE_SCHEMA &&
      summary.protocolVersion === 1 &&
      summary.contextId === projection.contextId &&
      summary.sequenceId === projection.sequenceId &&
      profileRecord.id === PROFILE.id &&
      profileRecord.version === PROFILE.version &&
      summary.algorithm === "sha-256" &&
      summary.count === 1 &&
      summary.firstPosition === position &&
      summary.lastPosition === position &&
      summary.finalLinkDigest === linkDigest &&
      summary.status === "valid"
    );
  } catch {
    return false;
  }
}

function makeClaim(
  status: VerificationClaim["status"],
  diagnostics: readonly string[],
  evidenceDigest?: string,
): Result<VerificationClaim> {
  return createVerificationClaim({
    kind: "noeos-evidence",
    status,
    diagnostics,
    ...(evidenceDigest === undefined ? {} : { evidenceDigest }),
  });
}

function withNoeosClaim(
  claims: VerificationClaimSet,
  claim: VerificationClaim,
): Result<VerificationClaimSet> {
  return replaceVerificationClaim(claims, claim);
}

function asClaimSet(input: unknown): Result<VerificationClaimSet> {
  try {
    if (!input || typeof input !== "object" || !("claims" in input))
      return invalid("DIAG-ENGINE-CLAIMS", "domain");
    const raw = (input as { claims: unknown }).claims;
    if (Array.isArray(raw)) return createVerificationClaimSet(raw);
    if (!raw || typeof raw !== "object" || !("claims" in raw))
      return invalid("DIAG-ENGINE-CLAIMS", "domain");
    const nested = (raw as { claims: unknown }).claims;
    return Array.isArray(nested)
      ? createVerificationClaimSet(nested)
      : invalid("DIAG-ENGINE-CLAIMS", "domain");
  } catch {
    return invalid("DIAG-ENGINE-CLAIMS", "domain");
  }
}

function engineContext(
  projection: EngineProfileProjection,
  position: number,
): {
  readonly contextId: string;
  readonly sequenceId: string;
  readonly profile: typeof PROFILE;
  readonly algorithm: "sha-256";
  readonly mode: "complete" | "fragment";
  readonly position: number;
  readonly previous:
    | { readonly kind: "none" }
    | { readonly kind: "digest"; readonly value: string };
  readonly expectedPrevious:
    | { readonly kind: "none" }
    | { readonly kind: "digest"; readonly value: string };
} {
  const previous =
    projection.predecessorEvidenceDigest === null
      ? Object.freeze({ kind: "none" as const })
      : Object.freeze({
          kind: "digest" as const,
          value: projection.predecessorEvidenceDigest.slice(7),
        });
  return Object.freeze({
    contextId: projection.contextId,
    sequenceId: projection.sequenceId,
    profile: PROFILE,
    algorithm: "sha-256",
    mode:
      projection.predecessorEvidenceDigest === null ? "complete" : "fragment",
    position,
    previous,
    expectedPrevious: previous,
  });
}

export function verifyNoeosEngineEvidence(
  input: EngineEvidenceInput,
  evidence: unknown,
  enginePort: VerificationEnginePort = verificationEnginePort,
): Result<VerificationClaim> {
  const claims = asClaimSet(input);
  if (claims.status !== "ok") return invalid("DIAG-ENGINE-CLAIMS", "domain");
  const projected = createEngineProfileProjection(input);
  if (projected.status !== "ok") return projected;
  try {
    const engine = enginePort.createEngine({
      profiles: [createEngineNormalizationProfile()],
    });
    const isRecordEvidence =
      evidence !== null &&
      typeof evidence === "object" &&
      !Array.isArray(evidence) &&
      (evidence as Record<string, unknown>).$schema === RECORD_EVIDENCE_SCHEMA;
    if (
      projected.value.predecessorEvidenceDigest !== null &&
      isRecordEvidence
    ) {
      if (!validRecordEvidence(evidence, projected.value)) {
        const claim = makeClaim("invalid", ["DIAG-ENGINE-EVIDENCE-MALFORMED"]);
        return claim.status === "ok"
          ? claim
          : invalid("DIAG-ENGINE-EVIDENCE-MALFORMED", "domain");
      }
      const verification = engine.verifyRecord({
        payload: projected.value,
        evidence,
      });
      const digestResult = engine.digestEvidence(evidence);
      if (
        verification.status !== "valid" ||
        !validRecordEvidence(verification.evidence, projected.value) ||
        !digestResult.ok ||
        !digestResult.value ||
        digestResult.value.algorithm !== "sha-256" ||
        typeof digestResult.value.toHex !== "function" ||
        !digestPattern.test(digestResult.value.toHex())
      ) {
        const status =
          verification.status === "aborted" ||
          verification.status === "indeterminate"
            ? "indeterminate"
            : verification.status === "invalid"
              ? "invalid"
              : "unsupported";
        return makeClaim(status, [
          diagnosticCode(
            verification.diagnostics[0],
            "DIAG-ENGINE-VERIFY-FAILED",
          ),
        ]);
      }
      return makeClaim("valid", [], `sha256:${digestResult.value.toHex()}`);
    }
    if (!validLinkEvidence(evidence, projected.value, input.position)) {
      const claim = makeClaim("invalid", ["DIAG-ENGINE-EVIDENCE-MALFORMED"]);
      return claim.status === "ok"
        ? claim
        : invalid("DIAG-ENGINE-EVIDENCE-MALFORMED", "domain");
    }
    const context = engineContext(projected.value, input.position);
    const verification = engine.verifyChain({
      contextId: context.contextId,
      sequenceId: context.sequenceId,
      profile: context.profile,
      algorithm: context.algorithm,
      mode: context.mode,
      expectedCount: 1,
      expectedFinalLinkDigest: (evidence as LinkEvidence).linkDigest,
      expectedPrevious: context.expectedPrevious,
      startPosition: context.position,
      records: [{ payload: projected.value, evidence }],
    });
    const digestResult = engine.digestEvidence(evidence as LinkEvidence);
    if (
      verification.status !== "valid" ||
      !validChainSummary(
        verification.evidence,
        projected.value,
        input.position,
        (evidence as LinkEvidence).linkDigest,
      ) ||
      !digestResult.ok ||
      !digestResult.value ||
      digestResult.value.algorithm !== "sha-256" ||
      typeof digestResult.value.toHex !== "function" ||
      !digestPattern.test(digestResult.value.toHex())
    ) {
      const status =
        verification.status === "aborted" ||
        verification.status === "indeterminate"
          ? "indeterminate"
          : verification.status === "invalid"
            ? "invalid"
            : "unsupported";
      const code = diagnosticCode(
        verification.diagnostics[0],
        status === "unsupported"
          ? "DIAG-ENGINE-UNSUPPORTED"
          : "DIAG-ENGINE-VERIFY-FAILED",
      );
      return makeClaim(status, [code]);
    }
    return makeClaim("valid", [], `sha256:${digestResult.value.toHex()}`);
  } catch {
    return makeClaim("indeterminate", ["DIAG-ENGINE-UNAVAILABLE"]);
  }
}

export function createNoeosEngineEvidence(
  input: EngineEvidenceInput,
  enginePort: VerificationEnginePort = verificationEnginePort,
): Result<EngineEvidenceOutput> {
  const claims = asClaimSet(input);
  if (claims.status !== "ok") return invalid("DIAG-ENGINE-CLAIMS", "domain");
  const projected = createEngineProfileProjection(input);
  if (projected.status !== "ok") return projected;
  try {
    const engine = enginePort.createEngine({
      profiles: [createEngineNormalizationProfile()],
    });
    if (projected.value.predecessorEvidenceDigest !== null) {
      const hashed = engine.hashRecord({
        contextId: projected.value.contextId,
        recordId: projected.value.recordId,
        payload: projected.value,
        profile: PROFILE,
        algorithm: "sha-256",
      });
      if (!hashed.ok || !validRecordEvidence(hashed.value, projected.value)) {
        const failure = makeClaim("invalid", [
          diagnosticCode(hashed.diagnostics[0], "DIAG-ENGINE-HASH-FAILED"),
        ]);
        if (failure.status !== "ok") return failure;
        const updated = withNoeosClaim(claims.value, failure.value);
        return updated.status === "ok"
          ? ok({ claims: updated.value })
          : updated;
      }
      const verified = verifyNoeosEngineEvidence(
        input,
        hashed.value,
        enginePort,
      );
      if (verified.status !== "ok") return verified;
      const updated = withNoeosClaim(claims.value, verified.value);
      return updated.status === "ok"
        ? ok(
            Object.freeze({
              claims: updated.value,
              recordEvidence: hashed.value,
            }),
          )
        : updated;
    }
    const context = engineContext(projected.value, input.position);
    const chain = engine.createChain({
      contextId: context.contextId,
      sequenceId: context.sequenceId,
      profile: context.profile,
      algorithm: context.algorithm,
      allowEmpty: false,
    });
    const appended = chain.append({
      recordId: projected.value.recordId,
      payload: projected.value,
      position: context.position,
      previous: context.previous,
    });
    if (
      !appended.ok ||
      !validLinkEvidence(appended.value, projected.value, input.position)
    ) {
      const failedClaim = makeClaim("invalid", [
        diagnosticCode(appended.diagnostics[0], "DIAG-ENGINE-APPEND-FAILED"),
      ]);
      if (failedClaim.status !== "ok") return failedClaim;
      const updated = withNoeosClaim(claims.value, failedClaim.value);
      return updated.status === "ok" ? ok({ claims: updated.value }) : updated;
    }
    const finalized = chain.finalize();
    if (
      !finalized.ok ||
      !validChainSummary(
        finalized.value,
        projected.value,
        input.position,
        appended.value.linkDigest,
      )
    ) {
      const failedClaim = makeClaim("invalid", [
        diagnosticCode(finalized.diagnostics[0], "DIAG-ENGINE-FINALIZE-FAILED"),
      ]);
      if (failedClaim.status !== "ok") return failedClaim;
      const updated = withNoeosClaim(claims.value, failedClaim.value);
      return updated.status === "ok" ? ok({ claims: updated.value }) : updated;
    }

    const verified = verifyNoeosEngineEvidence(
      input,
      appended.value,
      enginePort,
    );
    if (verified.status !== "ok") return verified;
    const updated = withNoeosClaim(claims.value, verified.value);
    if (updated.status !== "ok") return updated;
    return ok(
      Object.freeze({
        claims: updated.value,
        linkEvidence: appended.value,
        chainSummary: finalized.value,
      }),
    );
  } catch {
    const unavailable = makeClaim("indeterminate", ["DIAG-ENGINE-UNAVAILABLE"]);
    if (unavailable.status !== "ok") return unavailable;
    const updated = withNoeosClaim(claims.value, unavailable.value);
    return updated.status === "ok" ? ok({ claims: updated.value }) : updated;
  }
}
