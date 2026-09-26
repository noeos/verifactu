import { createHash, timingSafeEqual } from "node:crypto";
import {
  normalizeCertificateAssessment,
  normalizePkiObservation,
} from "./pki.mjs";
import { spawnDssBridge } from "./worker.mjs";

export const XADES_EDITION_ID = "rrsif-2026-09-21-authoritative-candidate";
export const XADES_PROFILE_ID = "AEAT-XADES-EPES-v0.1.5";
export const XADES_LIMITS = Object.freeze({
  maximumArtifactBytes: 8_388_608,
  maximumCertificateBytes: 1_048_576,
  maximumCertificates: 16,
  maximumEvidenceBytes: 8_388_608,
  maximumEvidenceItems: 16,
  maximumOutputBytes: 8_388_608,
  maximumOperationMs: 15_000,
  maximumRevocationAgeSeconds: 172_800,
});

const TARGETS = new Set([
  "RegistroAlta",
  "RegistroAnulacion",
  "RegistroEvento",
]);
const DIAGNOSTICS = Object.freeze({
  request: "DIAG-XADES-REQUEST",
  edition: "DIAG-XADES-EDITION",
  digest: "DIAG-XADES-DIGEST",
  evidence: "DIAG-XADES-EVIDENCE",
  signer: "DIAG-XADES-SIGNER",
  callback: "DIAG-XADES-SIGNER-FAILED",
  certificate: "DIAG-XADES-CERTIFICATE",
  provider: "DIAG-XADES-PROVIDER",
});

export function createXadesProvider(options = {}) {
  const execute = options.execute ?? spawnDssBridge;
  return Object.freeze({
    sign: (request, callOptions = {}) =>
      signXades(request, { ...options, ...callOptions, execute }),
    verify: (request, callOptions = {}) =>
      verifyXades(request, { ...options, ...callOptions, execute }),
  });
}

export async function signXades(request, options = {}) {
  const input = normalizeSignRequest(request, options);
  if (!input.ok) return failed("invalid", input.diagnostic);
  if (options.signal?.aborted)
    return failed("cancelled", "DIAG-XADES-CANCELLED");

  const common = bridgeFields(input.value);
  const deadlineMs = Math.min(
    options.deadlineMs ?? XADES_LIMITS.maximumOperationMs,
    XADES_LIMITS.maximumOperationMs,
  );
  if (!Number.isSafeInteger(deadlineMs) || deadlineMs <= 0)
    return failed("limit", "DIAG-XADES-DEADLINE");
  const deadlineAt = performance.now() + deadlineMs;
  const execute = options.execute ?? spawnDssBridge;
  const prepare = normalizeWorkerResult(
    await executeSafely(
      execute,
      { ...common, command: "SIGN_PREPARE", signatureBytes: new Uint8Array() },
      {
        signal: options.signal,
        timeoutMs: remainingMs(deadlineAt),
        maximumOutputBytes: XADES_LIMITS.maximumOutputBytes,
        javaExecutable: options.javaExecutable,
        jarPath: options.jarPath,
        cwd: options.cwd,
      },
    ),
  );
  if (prepare.kind !== "TBS" || prepare.payload.byteLength === 0)
    return failed(
      mapWorkerStatus(prepare.kind),
      prepare.diagnostic || DIAGNOSTICS.provider,
    );

  const toBeSigned = prepare.payload.slice();
  let signatureBytes;
  try {
    signatureBytes = await untilDeadline(
      input.value.signer.sign(toBeSigned.slice(), {
        algorithm: "RSA-SHA256",
        deadlineMs: remainingMs(deadlineAt),
        signal: options.signal,
      }),
      deadlineAt,
      options.signal,
    );
  } catch (error) {
    return failed(
      options.signal?.aborted || error?.code === "CANCELLED"
        ? "cancelled"
        : error?.code === "DEADLINE" || performance.now() >= deadlineAt
          ? "limit"
          : "unavailable",
      options.signal?.aborted || error?.code === "CANCELLED"
        ? "DIAG-XADES-CANCELLED"
        : error?.code === "DEADLINE" || performance.now() >= deadlineAt
          ? "DIAG-XADES-DEADLINE"
          : DIAGNOSTICS.callback,
    );
  }
  if (performance.now() >= deadlineAt)
    return failed(
      options.signal?.aborted ? "cancelled" : "limit",
      "DIAG-XADES-DEADLINE",
    );
  if (
    !(signatureBytes instanceof Uint8Array) ||
    signatureBytes.byteLength < 128 ||
    signatureBytes.byteLength > 1_024 ||
    !bytesEqual(toBeSigned, prepare.payload)
  )
    return failed("invalid", DIAGNOSTICS.signer);

  const completed = normalizeWorkerResult(
    await executeSafely(
      execute,
      {
        ...common,
        command: "SIGN_COMPLETE",
        signatureBytes: signatureBytes.slice(),
      },
      {
        signal: options.signal,
        timeoutMs: remainingMs(deadlineAt),
        maximumOutputBytes: XADES_LIMITS.maximumOutputBytes,
        javaExecutable: options.javaExecutable,
        jarPath: options.jarPath,
        cwd: options.cwd,
      },
    ),
  );
  if (completed.kind !== "SIGNED" || completed.payload.byteLength === 0)
    return failed(
      mapWorkerStatus(completed.kind),
      completed.diagnostic || DIAGNOSTICS.provider,
    );
  if (completed.payload.byteLength > XADES_LIMITS.maximumOutputBytes)
    return failed("limit", "DIAG-XADES-OUTPUT");

  const verification = await verifyXades(
    {
      editionId: input.value.editionId,
      profileId: input.value.profileId,
      targetName: input.value.targetName,
      artifactBytes: completed.payload,
      artifactDigestSha256: hexSha256(completed.payload),
      expectedSignerFingerprintSha256:
        input.value.expectedSignerFingerprintSha256,
      trustAnchorsDer: input.value.trustAnchorsDer,
      crlEvidence: input.value.crlEvidence,
      ocspEvidence: input.value.ocspEvidence,
      validationTime: input.value.validationTime,
      maximumRevocationAgeSeconds: input.value.maximumRevocationAgeSeconds,
    },
    { ...options, deadlineMs: remainingMs(deadlineAt) },
  );
  if (
    verification.profile !== "valid" ||
    verification.cryptographic !== "valid"
  )
    return failed(
      "invalid",
      verification.diagnostics[0] ?? DIAGNOSTICS.provider,
    );
  return Object.freeze({
    status: "signed",
    bytes: completed.payload.slice(),
    verification,
  });
}

export async function verifyXades(request, options = {}) {
  const input = normalizeVerifyRequest(request);
  if (!input.ok) return notEvaluated(input.diagnostic);
  if (options.signal?.aborted)
    return notEvaluated("DIAG-XADES-CANCELLED", "cancelled");

  const deadlineMs = Math.min(
    options.deadlineMs ?? XADES_LIMITS.maximumOperationMs,
    XADES_LIMITS.maximumOperationMs,
  );
  if (!Number.isSafeInteger(deadlineMs) || deadlineMs <= 0)
    return notEvaluated("DIAG-XADES-DEADLINE", "limit");
  const response = normalizeWorkerResult(
    await executeSafely(
      options.execute ?? spawnDssBridge,
      { ...input.value, command: "VERIFY" },
      {
        signal: options.signal,
        timeoutMs: deadlineMs,
        maximumOutputBytes: 65_536,
        javaExecutable: options.javaExecutable,
        jarPath: options.jarPath,
        cwd: options.cwd,
      },
    ),
  );
  return mapVerificationResponse(response, input.value);
}

function normalizeSignRequest(request, options) {
  if (
    !validBaseRequest(request) ||
    !request.signer ||
    typeof request.signer !== "object"
  )
    return { ok: false, diagnostic: DIAGNOSTICS.request };
  if (parseExplicitInstant(request.signingTime) === null)
    return { ok: false, diagnostic: DIAGNOSTICS.request };
  const signer = request.signer;
  if (
    !validOpaqueHandle(signer.keyHandle) ||
    typeof signer.sign !== "function" ||
    !(signer.certificateDer instanceof Uint8Array) ||
    !Array.isArray(signer.certificateChainDer) ||
    !signer.certificateChainDer.every((item) => item instanceof Uint8Array)
  )
    return { ok: false, diagnostic: DIAGNOSTICS.signer };
  const certificate = signer.certificateDer.slice();
  const chain = signer.certificateChainDer.map((item) => item.slice());
  if (
    certificate.byteLength === 0 ||
    certificate.byteLength > XADES_LIMITS.maximumCertificateBytes ||
    chain.length + 1 > XADES_LIMITS.maximumCertificates ||
    chain.some(
      (item) =>
        item.byteLength === 0 ||
        item.byteLength > XADES_LIMITS.maximumCertificateBytes,
    )
  )
    return { ok: false, diagnostic: DIAGNOSTICS.certificate };
  const digest = validateDigest(
    request.artifactBytes,
    request.artifactDigestSha256,
  );
  if (!digest) return { ok: false, diagnostic: DIAGNOSTICS.digest };
  const policy = normalizeValidationPolicy(request);
  if (!policy.ok) return policy;
  if (
    !withinCombinedByteLimit(request.artifactBytes, [
      certificate,
      ...chain,
      ...policy.value.trustAnchorsDer,
      ...policy.value.crlEvidence,
      ...policy.value.ocspEvidence,
    ])
  )
    return { ok: false, diagnostic: DIAGNOSTICS.evidence };
  const base = {
    ...policy.value,
    artifactBytes: request.artifactBytes.slice(),
    artifactDigestSha256: request.artifactDigestSha256,
    signerCertificateDer: certificate,
    certificateChainDer: chain,
    expectedSignerFingerprintSha256: hexSha256(certificate),
    signer: Object.freeze({
      keyHandle: signer.keyHandle,
      sign: signer.sign,
    }),
  };
  return { ok: true, value: Object.freeze(base) };
}

function normalizeVerifyRequest(request) {
  if (!validBaseRequest(request))
    return { ok: false, diagnostic: DIAGNOSTICS.request };
  if (!validateDigest(request.artifactBytes, request.artifactDigestSha256))
    return { ok: false, diagnostic: DIAGNOSTICS.digest };
  const policy = normalizeValidationPolicy(request);
  if (!policy.ok) return policy;
  const certificateChainDer = cloneEvidence(request.certificateChainDer ?? []);
  if (
    !certificateChainDer ||
    certificateChainDer.length + policy.value.trustAnchorsDer.length >
      XADES_LIMITS.maximumCertificates ||
    certificateChainDer.some(
      (item) =>
        item.byteLength === 0 ||
        item.byteLength > XADES_LIMITS.maximumCertificateBytes,
    )
  )
    return { ok: false, diagnostic: DIAGNOSTICS.certificate };
  if (
    !withinCombinedByteLimit(request.artifactBytes, [
      ...certificateChainDer,
      ...policy.value.trustAnchorsDer,
      ...policy.value.crlEvidence,
      ...policy.value.ocspEvidence,
    ])
  )
    return { ok: false, diagnostic: DIAGNOSTICS.evidence };
  if (
    request.expectedSignerFingerprintSha256 !== undefined &&
    !/^[0-9a-f]{64}$/u.test(request.expectedSignerFingerprintSha256)
  )
    return { ok: false, diagnostic: DIAGNOSTICS.certificate };
  return {
    ok: true,
    value: Object.freeze({
      ...policy.value,
      artifactBytes: request.artifactBytes.slice(),
      artifactDigestSha256: request.artifactDigestSha256,
      signerCertificateDer: new Uint8Array(),
      certificateChainDer,
      signatureBytes: new Uint8Array(),
      expectedSignerFingerprintSha256:
        request.expectedSignerFingerprintSha256 ?? "",
    }),
  };
}

function normalizeValidationPolicy(request) {
  if (
    request.editionId !== XADES_EDITION_ID ||
    request.profileId !== XADES_PROFILE_ID
  )
    return { ok: false, diagnostic: DIAGNOSTICS.edition };
  if (!TARGETS.has(request.targetName))
    return { ok: false, diagnostic: DIAGNOSTICS.request };
  const signingTimeMs =
    request.signingTime === undefined
      ? 0
      : parseExplicitInstant(request.signingTime);
  const validationTimeMs = parseExplicitInstant(request.validationTime);
  if (signingTimeMs === null || validationTimeMs === null)
    return { ok: false, diagnostic: DIAGNOSTICS.request };
  if (request.signingTime !== undefined && signingTimeMs > validationTimeMs)
    return { ok: false, diagnostic: DIAGNOSTICS.request };
  if (
    !Number.isSafeInteger(request.maximumRevocationAgeSeconds) ||
    request.maximumRevocationAgeSeconds <= 0 ||
    request.maximumRevocationAgeSeconds >
      XADES_LIMITS.maximumRevocationAgeSeconds
  )
    return { ok: false, diagnostic: DIAGNOSTICS.evidence };
  const trustAnchorsDer = cloneEvidence(request.trustAnchorsDer);
  const crlEvidence = cloneEvidence(request.crlEvidence);
  const ocspEvidence = cloneEvidence(request.ocspEvidence);
  if (!trustAnchorsDer || !crlEvidence || !ocspEvidence)
    return { ok: false, diagnostic: DIAGNOSTICS.evidence };
  const allEvidence = [...trustAnchorsDer, ...crlEvidence, ...ocspEvidence];
  if (
    allEvidence.length > XADES_LIMITS.maximumEvidenceItems ||
    allEvidence.some(
      (item) =>
        item.byteLength === 0 ||
        item.byteLength > XADES_LIMITS.maximumEvidenceBytes,
    ) ||
    allEvidence.reduce((sum, item) => sum + item.byteLength, 0) >
      XADES_LIMITS.maximumEvidenceBytes
  )
    return { ok: false, diagnostic: DIAGNOSTICS.evidence };
  return {
    ok: true,
    value: Object.freeze({
      editionId: XADES_EDITION_ID,
      profileId: XADES_PROFILE_ID,
      targetName: request.targetName,
      signingTimeMs,
      validationTime: new Date(validationTimeMs).toISOString(),
      validationTimeMs,
      maximumRevocationAgeSeconds: request.maximumRevocationAgeSeconds,
      trustAnchorsDer,
      crlEvidence,
      ocspEvidence,
    }),
  };
}

function withinCombinedByteLimit(artifactBytes, evidence) {
  return (
    evidence.length <=
      XADES_LIMITS.maximumEvidenceItems + XADES_LIMITS.maximumCertificates &&
    artifactBytes.byteLength +
      evidence.reduce((sum, item) => sum + item.byteLength, 0) <=
      XADES_LIMITS.maximumEvidenceBytes
  );
}

function bridgeFields(request) {
  return {
    editionId: request.editionId,
    profileId: request.profileId,
    targetName: request.targetName,
    artifactBytes: request.artifactBytes,
    artifactDigestSha256: request.artifactDigestSha256,
    signingTimeMs: request.signingTimeMs,
    validationTimeMs: request.validationTimeMs,
    maximumRevocationAgeSeconds: request.maximumRevocationAgeSeconds,
    signerCertificateDer: request.signerCertificateDer,
    certificateChainDer: request.certificateChainDer,
    expectedSignerFingerprintSha256: request.expectedSignerFingerprintSha256,
    trustAnchorsDer: request.trustAnchorsDer,
    crlEvidence: request.crlEvidence,
    ocspEvidence: request.ocspEvidence,
  };
}

function mapVerificationResponse(response, policy) {
  if (!response || typeof response !== "object")
    return notEvaluated(DIAGNOSTICS.provider, "defect");
  if (["CANCELLED", "LIMIT", "UNAVAILABLE", "DEFECT"].includes(response.kind))
    return notEvaluated(
      response.diagnostic || DIAGNOSTICS.provider,
      mapWorkerStatus(response.kind),
    );
  if (!["VERIFIED", "INVALID", "INDETERMINATE"].includes(response.kind))
    return notEvaluated("DIAG-XADES-REPORT", "defect");
  let data;
  try {
    data = new TextDecoder("utf-8", { fatal: true })
      .decode(response.payload)
      .split("\t");
  } catch {
    return notEvaluated("DIAG-XADES-REPORT", "defect");
  }
  if (
    data.length !== 15 ||
    data
      .slice(0, 12)
      .some(
        (item) =>
          !/^(?:VALID|INVALID|NOT_EVALUATED|INDETERMINATE|REVOKED|STALE|UNKNOWN|ABSENT)$/u.test(
            item,
          ),
      ) ||
    (data[12] !== "NONE" && !/^DIAG-[A-Z0-9-]{1,64}$/u.test(data[12])) ||
    !/^\d{1,16}$/u.test(data[13]) ||
    !/^\d{1,16}$/u.test(data[14])
  )
    return notEvaluated("DIAG-XADES-REPORT", "defect");
  const [
    profile,
    cryptographic,
    certificate,
    chain,
    trust,
    time,
    usage,
    extendedKeyUsage,
    identity,
    authorization,
    algorithm,
    revocation,
    diagnostic,
    thisUpdate,
    nextUpdate,
  ] = data;
  const profileValue =
    profile === "VALID"
      ? "valid"
      : profile === "INVALID"
        ? "invalid"
        : "not-evaluated";
  const cryptoValue =
    cryptographic === "VALID"
      ? "valid"
      : cryptographic === "INVALID"
        ? "invalid"
        : "not-evaluated";
  const certificateValue =
    certificate === "VALID"
      ? "valid"
      : certificate === "INVALID"
        ? "invalid"
        : "indeterminate";
  const certificateAssessment = normalizeCertificateAssessment({
    chain: pkiStatus(chain),
    trust: pkiStatus(trust),
    time: pkiStatus(time),
    usage: pkiStatus(usage),
    extendedKeyUsage: pkiStatus(extendedKeyUsage),
    identity: pkiStatus(identity),
    authorization: pkiStatus(authorization),
    algorithm: pkiStatus(algorithm),
  });
  if (certificateAssessment.status !== certificateValue)
    return notEvaluated("DIAG-XADES-REPORT", "defect");
  const certificatePolicy = certificateAssessment.outcomes;
  const observedRevocation = [
    "VALID",
    "REVOKED",
    "UNKNOWN",
    "STALE",
    "ABSENT",
  ].includes(revocation)
    ? revocation.toLowerCase()
    : "unknown";
  const normalizedRevocation = normalizePkiObservation(
    {
      status: observedRevocation,
      thisUpdateMs: Number(thisUpdate),
      nextUpdateMs: Number(nextUpdate),
    },
    policy,
  );
  const revocationValue = normalizedRevocation.status;
  const status =
    profileValue === "invalid" ||
    cryptoValue === "invalid" ||
    certificateValue === "invalid" ||
    revocationValue === "revoked"
      ? "invalid"
      : profileValue === "valid" &&
          cryptoValue === "valid" &&
          certificateValue === "valid" &&
          revocationValue === "valid"
        ? "valid"
        : "indeterminate";
  if (
    (response.kind === "VERIFIED" && status !== "valid") ||
    (response.kind === "INVALID" && status !== "invalid") ||
    (response.kind === "INDETERMINATE" && status !== "indeterminate")
  )
    return notEvaluated("DIAG-XADES-REPORT", "defect");
  return Object.freeze({
    status,
    profile: profileValue,
    cryptographic: cryptoValue,
    certificate: certificateValue,
    certificatePolicy,
    revocation: revocationValue,
    validationTime: policy.validationTime,
    diagnostics: Object.freeze(diagnostic === "NONE" ? [] : [diagnostic]),
  });
}

function pkiStatus(value) {
  return value === "VALID"
    ? "valid"
    : value === "INVALID"
      ? "invalid"
      : value === "INDETERMINATE"
        ? "indeterminate"
        : "not-evaluated";
}

function validBaseRequest(request) {
  return Boolean(
    request &&
      typeof request === "object" &&
      TARGETS.has(request.targetName) &&
      request.artifactBytes instanceof Uint8Array &&
      request.artifactBytes.byteLength > 0 &&
      request.artifactBytes.byteLength <= XADES_LIMITS.maximumArtifactBytes &&
      typeof request.artifactDigestSha256 === "string",
  );
}

function validateDigest(bytes, supplied) {
  if (
    !(bytes instanceof Uint8Array) ||
    typeof supplied !== "string" ||
    !/^[0-9a-f]{64}$/u.test(supplied)
  )
    return false;
  const actual = createHash("sha256").update(bytes).digest();
  const expected = Buffer.from(supplied, "hex");
  return (
    actual.byteLength === expected.byteLength &&
    timingSafeEqual(actual, expected)
  );
}

function cloneEvidence(value) {
  if (
    !Array.isArray(value) ||
    value.some((item) => !(item instanceof Uint8Array))
  )
    return null;
  return Object.freeze(value.map((item) => item.slice()));
}

function parseExplicitInstant(value) {
  if (typeof value !== "string") return null;
  const parts =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/u.exec(
      value,
    );
  if (!parts) return null;
  const time = Date.parse(value);
  if (!Number.isSafeInteger(time)) return null;
  const date = new Date(time);
  const milliseconds = Number((parts[7] ?? "").padEnd(3, "0") || "0");
  return date.getUTCFullYear() === Number(parts[1]) &&
    date.getUTCMonth() + 1 === Number(parts[2]) &&
    date.getUTCDate() === Number(parts[3]) &&
    date.getUTCHours() === Number(parts[4]) &&
    date.getUTCMinutes() === Number(parts[5]) &&
    date.getUTCSeconds() === Number(parts[6]) &&
    date.getUTCMilliseconds() === milliseconds
    ? time
    : null;
}

function validOpaqueHandle(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 256 &&
    value === value.trim() &&
    !/[\u0000-\u001f\u007f]/u.test(value)
  );
}

function hexSha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function bytesEqual(a, b) {
  if (a.byteLength !== b.byteLength) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function remainingMs(deadlineAt) {
  return Math.max(1, Math.ceil(deadlineAt - performance.now()));
}

function untilDeadline(operation, deadlineAt, signal) {
  const duration = Math.max(1, deadlineAt - performance.now());
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      error ? reject(error) : resolve(value);
    };
    const abort = () =>
      finish(Object.assign(new Error("aborted"), { code: "CANCELLED" }));
    const timer = setTimeout(
      () => finish(Object.assign(new Error("deadline"), { code: "DEADLINE" })),
      duration,
    );
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    Promise.resolve(operation).then(
      (value) => finish(null, value),
      (error) => finish(error),
    );
  });
}

function mapWorkerStatus(kind) {
  if (kind === "CANCELLED") return "cancelled";
  if (kind === "LIMIT") return "limit";
  if (kind === "UNAVAILABLE") return "unavailable";
  if (kind === "DEFECT") return "defect";
  return "invalid";
}

async function executeSafely(execute, request, options) {
  try {
    return await untilDeadline(
      Promise.resolve().then(() => execute(request, options)),
      performance.now() + options.timeoutMs,
      options.signal,
    );
  } catch (error) {
    if (error?.code === "CANCELLED")
      return {
        kind: "CANCELLED",
        diagnostic: "DIAG-XADES-CANCELLED",
        payload: new Uint8Array(),
      };
    if (error?.code === "DEADLINE")
      return {
        kind: "LIMIT",
        diagnostic: "DIAG-XADES-DEADLINE",
        payload: new Uint8Array(),
      };
    return {
      kind: "DEFECT",
      diagnostic: DIAGNOSTICS.provider,
      payload: new Uint8Array(),
    };
  }
}

function normalizeWorkerResult(response) {
  if (
    !response ||
    typeof response !== "object" ||
    typeof response.kind !== "string" ||
    !(response.payload instanceof Uint8Array) ||
    typeof response.diagnostic !== "string"
  )
    return {
      kind: "DEFECT",
      diagnostic: DIAGNOSTICS.provider,
      payload: new Uint8Array(),
    };
  return response;
}

function failed(status, diagnostic) {
  return Object.freeze({ status, diagnostics: Object.freeze([diagnostic]) });
}

function notEvaluated(diagnostic, status = "defect") {
  return Object.freeze({
    status,
    profile: "not-evaluated",
    cryptographic: "not-evaluated",
    certificate: "not-evaluated",
    certificatePolicy: Object.freeze({
      chain: "not-evaluated",
      trust: "not-evaluated",
      time: "not-evaluated",
      usage: "not-evaluated",
      identity: "not-evaluated",
      authorization: "not-evaluated",
      algorithm: "not-evaluated",
    }),
    revocation: "not-evaluated",
    validationTime: null,
    diagnostics: Object.freeze([diagnostic]),
  });
}
