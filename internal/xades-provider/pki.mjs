export const MAXIMUM_REVOCATION_AGE_SECONDS = 172_800;
const CERTIFICATE_STATES = new Set([
  "valid",
  "invalid",
  "indeterminate",
  "not-evaluated",
]);

export function normalizeCertificateAssessment(observation) {
  const fields = [
    "chain",
    "trust",
    "time",
    "usage",
    "extendedKeyUsage",
    "identity",
    "authorization",
    "algorithm",
  ];
  if (!observation || typeof observation !== "object")
    return Object.freeze({
      status: "indeterminate",
      outcomes: Object.freeze(
        Object.fromEntries(fields.map((field) => [field, "not-evaluated"])),
      ),
    });
  const outcomes = Object.freeze(
    Object.fromEntries(
      fields.map((field) => [
        field,
        CERTIFICATE_STATES.has(observation[field])
          ? observation[field]
          : "not-evaluated",
      ]),
    ),
  );
  const required = [
    outcomes.chain,
    outcomes.trust,
    outcomes.time,
    outcomes.usage,
    outcomes.extendedKeyUsage,
    outcomes.identity,
    outcomes.algorithm,
  ];
  const status = required.includes("invalid")
    ? "invalid"
    : required.every((value) => value === "valid")
      ? "valid"
      : "indeterminate";
  return Object.freeze({ status, outcomes });
}

export function normalizePkiObservation(observation, policy) {
  if (
    !policy ||
    !Number.isSafeInteger(policy.validationTimeMs) ||
    !Number.isSafeInteger(policy.maximumRevocationAgeSeconds) ||
    policy.maximumRevocationAgeSeconds <= 0 ||
    policy.maximumRevocationAgeSeconds > MAXIMUM_REVOCATION_AGE_SECONDS ||
    !Array.isArray(policy.crlEvidence) ||
    !Array.isArray(policy.ocspEvidence)
  )
    return Object.freeze({
      status: "unknown",
      thisUpdateMs: null,
      nextUpdateMs: null,
    });
  const evidenceCount = policy.crlEvidence.length + policy.ocspEvidence.length;
  if (evidenceCount === 0)
    return Object.freeze({
      status: "absent",
      thisUpdateMs: null,
      nextUpdateMs: null,
    });
  if (!observation || typeof observation !== "object")
    return Object.freeze({
      status: "unknown",
      thisUpdateMs: null,
      nextUpdateMs: null,
    });
  if (observation.status === "revoked")
    return Object.freeze({
      status: "revoked",
      thisUpdateMs: observation.thisUpdateMs,
      nextUpdateMs: observation.nextUpdateMs,
    });
  if (observation.status === "unknown")
    return Object.freeze({
      status: "unknown",
      thisUpdateMs: null,
      nextUpdateMs: null,
    });
  if (observation.status === "stale")
    return Object.freeze({
      status: "stale",
      thisUpdateMs: observation.thisUpdateMs,
      nextUpdateMs: observation.nextUpdateMs,
    });
  if (observation.status === "absent")
    return Object.freeze({
      status: "absent",
      thisUpdateMs: null,
      nextUpdateMs: null,
    });
  if (observation.status !== "valid")
    return Object.freeze({
      status: "unknown",
      thisUpdateMs: null,
      nextUpdateMs: null,
    });

  const instant = policy.validationTimeMs;
  const thisUpdate = observation.thisUpdateMs;
  const nextUpdate = observation.nextUpdateMs;
  const maximumAgeMs = policy.maximumRevocationAgeSeconds * 1_000;
  if (
    !Number.isSafeInteger(instant) ||
    !Number.isSafeInteger(thisUpdate) ||
    !Number.isSafeInteger(nextUpdate) ||
    thisUpdate > instant ||
    nextUpdate < instant ||
    instant - thisUpdate > maximumAgeMs
  )
    return Object.freeze({
      status: "stale",
      thisUpdateMs: thisUpdate,
      nextUpdateMs: nextUpdate,
    });
  return Object.freeze({
    status: "valid",
    thisUpdateMs: thisUpdate,
    nextUpdateMs: nextUpdate,
  });
}
