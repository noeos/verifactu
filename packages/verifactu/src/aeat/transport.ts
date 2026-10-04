import { createFiscalInstant } from "../domain/date-time.js";
import type { FiscalContext } from "../domain/context.js";
import { sameContext } from "../domain/context.js";
import { isSafeStoreToken } from "../persistence/model.js";
import type { CertificateAuthorization } from "./certificate-authorization.js";
import type {
  AeatEditionProfile,
  AeatOperationId,
  ResolvedAeatEndpoint,
} from "./edition-profile.js";
import {
  operationProfile,
  resolveAeatEndpoint,
  verifyAeatEditionProfile,
} from "./edition-profile.js";
import type { SoapRequestArtifact } from "./soap-wire.js";

export type DeliveryKnowledge = "not-started" | "possibly-sent" | "fully-sent";
export type TransportPhase =
  | "preflight"
  | "dns"
  | "connect"
  | "tls"
  | "request-write"
  | "response-headers"
  | "response-body"
  | "complete";

export interface TransportLimits {
  readonly maxResponseBytes: number;
  readonly connectTimeoutMs: number;
  readonly tlsTimeoutMs: number;
  readonly writeTimeoutMs: number;
  readonly firstByteTimeoutMs: number;
  readonly bodyIdleTimeoutMs: number;
  readonly totalTimeoutMs: number;
}

export interface TransportRequest {
  readonly profile: AeatEditionProfile;
  readonly operationId: AeatOperationId;
  readonly context: FiscalContext;
  readonly endpoint: ResolvedAeatEndpoint;
  readonly request: SoapRequestArtifact;
  readonly certificateAuthorization: CertificateAuthorization;
  readonly limits: TransportLimits;
  readonly clock: {
    readonly wallNow: () => string;
    readonly monotonicNow: () => number;
  };
  readonly signal?: AbortSignal;
}

export interface TlsObservation {
  readonly authorized: boolean;
  readonly protocol: string;
  readonly cipher: string;
  readonly servername: string;
  readonly peerCertificateSha256: string;
}

export interface TransportObservation {
  readonly statusCode: number | null;
  readonly headers: Readonly<Record<string, string>>;
  readonly responseBytes: Uint8Array | null;
  readonly phase: TransportPhase;
  readonly delivery: DeliveryKnowledge;
  readonly failureCode: string | null;
  readonly tls: TlsObservation | null;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly elapsedMs: number;
}

export interface AeatTransportPort {
  readonly contractVersion: 1;
  readonly adapterId: string;
  observeOnce(request: TransportRequest): Promise<TransportObservation>;
}

const MAX_TIMEOUT_MS = 120_000;
const timeout = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 1 && value <= MAX_TIMEOUT_MS;
const responseHeaders = new Set([
  "content-type",
  "content-length",
  "date",
  "retry-after",
  "soapaction",
]);

function validateRequest(input: TransportRequest): string | null {
  const operation = input?.profile
    ? operationProfile(input.profile, input.operationId)
    : null;
  if (
    !input ||
    !operation ||
    !verifyAeatEditionProfile(input.profile) ||
    input.profile.lifecycle !== "active" ||
    !input.profile.creationAllowed
  )
    return "DIAG-AEAT-EDITION-INACTIVE";
  if (
    !input.endpoint ||
    !(input.endpoint.url instanceof URL) ||
    !input.request ||
    input.request.editionId !== input.profile.editionId ||
    input.request.editionDigest !== input.profile.digest ||
    input.request.operationId !== input.operationId ||
    input.request.endpointId !== input.endpoint.endpointId ||
    input.endpoint.editionId !== input.profile.editionId ||
    input.endpoint.editionDigest !== input.profile.digest ||
    !input.certificateAuthorization ||
    input.certificateAuthorization.purpose !== "tls-client-authentication" ||
    input.certificateAuthorization.environment !== input.endpoint.environment ||
    !sameContext(input.certificateAuthorization.context, input.context) ||
    !isSafeStoreToken(input.certificateAuthorization.credentialHandle) ||
    !/^sha256:[0-9a-f]{64}$/u.test(
      input.certificateAuthorization.certificateFingerprint,
    )
  )
    return "DIAG-AEAT-TRANSPORT-BINDING";
  const selected = resolveAeatEndpoint(
    input.profile,
    input.operationId,
    input.endpoint.environment,
    input.context,
    input.context,
  );
  if (
    selected.status !== "ok" ||
    selected.value.endpointId !== input.endpoint.endpointId ||
    selected.value.url.href !== input.endpoint.url.href
  )
    return "DIAG-AEAT-TRANSPORT-ENDPOINT";
  const limits = input.limits;
  if (
    !limits ||
    !Number.isSafeInteger(limits.maxResponseBytes) ||
    limits.maxResponseBytes < 1 ||
    limits.maxResponseBytes > operation.binding.maxResponseBytes ||
    ![
      limits.connectTimeoutMs,
      limits.tlsTimeoutMs,
      limits.writeTimeoutMs,
      limits.firstByteTimeoutMs,
      limits.bodyIdleTimeoutMs,
      limits.totalTimeoutMs,
    ].every(timeout) ||
    limits.connectTimeoutMs > limits.totalTimeoutMs ||
    limits.tlsTimeoutMs > limits.totalTimeoutMs ||
    limits.writeTimeoutMs > limits.totalTimeoutMs ||
    limits.firstByteTimeoutMs > limits.totalTimeoutMs ||
    limits.bodyIdleTimeoutMs > limits.totalTimeoutMs
  )
    return "DIAG-AEAT-TRANSPORT-LIMITS";
  if (
    !(input.request.bytes instanceof Uint8Array) ||
    input.request.bytes.byteLength !== input.request.byteLength ||
    input.request.byteLength > operation.binding.maxRequestBytes ||
    input.signal?.aborted ||
    !input.clock ||
    typeof input.clock.wallNow !== "function" ||
    typeof input.clock.monotonicNow !== "function"
  )
    return "DIAG-AEAT-TRANSPORT-REQUEST";
  return null;
}

export function sanitizeTransportObservation(
  observation: TransportObservation,
  maximumResponseBytes: number,
): TransportObservation | null {
  if (
    !observation ||
    ![
      "preflight",
      "dns",
      "connect",
      "tls",
      "request-write",
      "response-headers",
      "response-body",
      "complete",
    ].includes(observation.phase) ||
    !["not-started", "possibly-sent", "fully-sent"].includes(
      observation.delivery,
    ) ||
    (observation.statusCode !== null &&
      (!Number.isInteger(observation.statusCode) ||
        observation.statusCode < 100 ||
        observation.statusCode > 599)) ||
    !Number.isFinite(observation.elapsedMs) ||
    observation.elapsedMs < 0 ||
    observation.elapsedMs > 3_600_000 ||
    createFiscalInstant(observation.startedAt).status !== "ok" ||
    createFiscalInstant(observation.completedAt).status !== "ok" ||
    Date.parse(observation.completedAt) < Date.parse(observation.startedAt) ||
    !observation.headers ||
    typeof observation.headers !== "object" ||
    Object.keys(observation.headers).length > 32 ||
    (observation.responseBytes !== null &&
      (!(observation.responseBytes instanceof Uint8Array) ||
        observation.responseBytes.byteLength > maximumResponseBytes)) ||
    (observation.failureCode !== null &&
      !/^DIAG-[A-Z0-9_-]{1,100}$/u.test(observation.failureCode))
  )
    return null;
  const headers: Record<string, string> = Object.create(null) as Record<
    string,
    string
  >;
  for (const [name, value] of Object.entries(observation.headers)) {
    const normalized = name.toLowerCase();
    if (
      !responseHeaders.has(normalized) ||
      typeof value !== "string" ||
      value.length > 512 ||
      /[\r\n\u0000]/u.test(value)
    )
      continue;
    headers[normalized] = value;
  }
  const tls = observation.tls;
  if (
    tls &&
    (typeof tls.authorized !== "boolean" ||
      !isSafeStoreToken(tls.protocol, 64) ||
      !isSafeStoreToken(tls.cipher, 128) ||
      !isSafeStoreToken(tls.servername, 253) ||
      !/^sha256:[0-9a-f]{64}$/u.test(tls.peerCertificateSha256))
  )
    return null;
  return Object.freeze({
    ...observation,
    headers: Object.freeze(headers),
    responseBytes: observation.responseBytes?.slice() ?? null,
    tls: tls ? Object.freeze({ ...tls }) : null,
  });
}

/** Calls an adapter once; retry and business classification belong to durable coordinators. */
export async function observeAeatOnce(
  adapter: AeatTransportPort,
  input: TransportRequest,
): Promise<TransportObservation> {
  const invalid = validateRequest(input);
  let now = "1970-01-01T00:00:00Z";
  try {
    now = input?.clock?.wallNow?.() ?? now;
  } catch {
    /* fail-closed clock diagnostic below */
  }
  if (createFiscalInstant(now).status !== "ok") now = "1970-01-01T00:00:00Z";
  if (invalid)
    return Object.freeze({
      statusCode: null,
      headers: Object.freeze({}),
      responseBytes: null,
      phase: "preflight",
      delivery: "not-started",
      failureCode: invalid,
      tls: null,
      startedAt: now,
      completedAt: now,
      elapsedMs: 0,
    });
  if (
    !adapter ||
    adapter.contractVersion !== 1 ||
    !isSafeStoreToken(adapter.adapterId) ||
    typeof adapter.observeOnce !== "function"
  )
    return Object.freeze({
      statusCode: null,
      headers: Object.freeze({}),
      responseBytes: null,
      phase: "preflight",
      delivery: "not-started",
      failureCode: "DIAG-AEAT-TRANSPORT-UNAVAILABLE",
      tls: null,
      startedAt: now,
      completedAt: now,
      elapsedMs: 0,
    });
  try {
    const started = input.clock.monotonicNow();
    const raw = await adapter.observeOnce(
      Object.freeze({
        ...input,
        request: Object.freeze({
          ...input.request,
          bytes: input.request.bytes.slice(),
        }),
      }),
    );
    const clean = sanitizeTransportObservation(
      raw,
      input.limits.maxResponseBytes,
    );
    if (clean)
      return Object.freeze({
        ...clean,
        elapsedMs: Math.max(
          clean.elapsedMs,
          input.clock.monotonicNow() - started,
        ),
      });
    return Object.freeze({
      statusCode: null,
      headers: Object.freeze({}),
      responseBytes: null,
      phase: "response-body",
      delivery: "possibly-sent",
      failureCode: "DIAG-AEAT-TRANSPORT-OBSERVATION",
      tls: null,
      startedAt: raw.startedAt,
      completedAt: raw.completedAt,
      elapsedMs: raw.elapsedMs,
    });
  } catch {
    let completedAt = now;
    try {
      completedAt = input.clock.wallNow();
    } catch {
      /* retain the safe initial instant */
    }
    return Object.freeze({
      statusCode: null,
      headers: Object.freeze({}),
      responseBytes: null,
      phase: "request-write",
      delivery: "possibly-sent",
      failureCode: "DIAG-AEAT-TRANSPORT-THREW",
      tls: null,
      startedAt: now,
      completedAt:
        createFiscalInstant(completedAt).status === "ok" ? completedAt : now,
      elapsedMs: 0,
    });
  }
}
