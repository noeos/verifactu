import { createHash, X509Certificate } from "node:crypto";
import { lookup as nodeLookup } from "node:dns";
import { request as httpsRequest } from "node:https";
import { isIP, type LookupFunction } from "node:net";
import { clearTimeout } from "node:timers";
import type { TLSSocket } from "node:tls";
import type { CertificateAuthorization } from "./certificate-authorization.js";
import type {
  DeliveryKnowledge,
  TlsObservation,
  TransportObservation,
  TransportRequest,
  AeatTransportPort,
} from "./transport.js";

export interface TlsMaterial {
  /** Process-local bytes returned by a protected provider; never serialize or log. */
  readonly certificatePem: Uint8Array;
  readonly privateKeyPem: Uint8Array;
  readonly caPem?: Uint8Array;
}

export interface TlsMaterialProvider {
  acquire(authorization: CertificateAuthorization): Promise<TlsMaterial>;
  release?(
    authorization: CertificateAuthorization,
    material: TlsMaterial,
  ): Promise<void>;
}

export interface ResolvedAddress {
  readonly address: string;
  readonly family: 4 | 6;
}

export interface EndpointResolver {
  resolve(
    hostname: string,
    signal: AbortSignal | undefined,
    timeoutMs: number,
  ): Promise<readonly ResolvedAddress[]>;
}

const defaultResolver: EndpointResolver = {
  resolve(hostname, signal, timeoutMs) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(
        () => finish(new Error("DNS_TIMEOUT")),
        timeoutMs,
      );
      const onAbort = () => finish(new Error("DNS_CANCELLED"));
      const finish = (
        error: Error | null,
        addresses?: readonly ResolvedAddress[],
      ) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        if (error) reject(error);
        else resolve(addresses ?? []);
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      if (signal?.aborted) return finish(new Error("DNS_CANCELLED"));
      nodeLookup(hostname, { all: true, verbatim: true }, (error, entries) => {
        if (error) return finish(new Error("DNS_FAILURE"));
        finish(
          null,
          entries.map((entry) => ({
            address: entry.address,
            family: entry.family as 4 | 6,
          })),
        );
      });
    });
  },
};

function isLoopback(address: string): boolean {
  return (
    address.toLowerCase() === "localhost" ||
    address === "127.0.0.1" ||
    address === "::1" ||
    address === "::ffff:127.0.0.1"
  );
}

function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const octets = address.split(".").map(Number);
    const [a, b] = octets;
    if (a === undefined || b === undefined) return false;
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 2) ||
      (a === 198 && b === 51) ||
      (a === 203 && b === 0)
    );
  }
  if (family === 6) {
    const normalized = address.toLowerCase();
    if (normalized.startsWith("::ffff:"))
      return isPublicAddress(normalized.slice(7));
    const firstGroup = Number.parseInt(normalized.split(":", 1)[0] || "0", 16);
    // Only admit global unicast (2000::/3); this also rejects unspecified,
    // loopback, link-local, unique-local, multicast and transition ranges.
    if (
      !Number.isFinite(firstGroup) ||
      firstGroup < 0x2000 ||
      firstGroup > 0x3fff
    )
      return false;
    return !(
      normalized.startsWith("2001:db8:") ||
      normalized.startsWith("2001:0:") ||
      normalized.startsWith("2002:") ||
      normalized.startsWith("3fff:")
    );
  }
  return false;
}

function wallNow(request: TransportRequest): string {
  return request.clock.wallNow();
}
function elapsed(request: TransportRequest, started: number): number {
  const value = request.clock.monotonicNow() - started;
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function safeTls(socket: TLSSocket, hostname: string): TlsObservation | null {
  const certificate = socket.getPeerCertificate(true);
  const protocol = socket.getProtocol();
  if (
    !certificate?.raw ||
    !socket.authorized ||
    !protocol ||
    !socket.getCipher().name
  )
    return null;
  return Object.freeze({
    authorized: true,
    protocol,
    cipher: socket.getCipher().name,
    servername: hostname,
    peerCertificateSha256: `sha256:${createHash("sha256").update(certificate.raw).digest("hex")}`,
  });
}

export function createNodeHttpsTransport(input: {
  readonly tlsMaterials: TlsMaterialProvider;
  readonly resolver?: EndpointResolver;
}): AeatTransportPort {
  const resolver = input.resolver ?? defaultResolver;
  return Object.freeze({
    contractVersion: 1 as const,
    adapterId: "noeos:node-https-once:v1",
    observeOnce: async (
      request: TransportRequest,
    ): Promise<TransportObservation> => {
      const startInstant = wallNow(request);
      const started = request.clock.monotonicNow();
      const fail = (
        phase: TransportObservation["phase"],
        code: string,
        delivery: DeliveryKnowledge,
        tls: TlsObservation | null = null,
      ): TransportObservation => {
        const completedAt = wallNow(request);
        return Object.freeze({
          statusCode: null,
          headers: Object.freeze({}),
          responseBytes: null,
          phase,
          delivery,
          failureCode: code,
          tls,
          startedAt: startInstant,
          completedAt,
          elapsedMs: elapsed(request, started),
        });
      };
      const url = request.endpoint.url;
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.hash ||
        url.search ||
        !request.profile.operations.find(
          (operation) => operation.id === request.operationId,
        )?.binding.requiresMtls ||
        request.certificateAuthorization.environment !==
          request.endpoint.environment ||
        request.signal?.aborted
      )
        return fail(
          "preflight",
          "DIAG-AEAT-TRANSPORT-PREFLIGHT",
          "not-started",
        );

      let material: TlsMaterial | null = null;
      try {
        let addresses: readonly ResolvedAddress[];
        try {
          const literalFamily = isIP(url.hostname);
          addresses = literalFamily
            ? [{ address: url.hostname, family: literalFamily as 4 | 6 }]
            : await resolver.resolve(
                url.hostname,
                request.signal,
                request.limits.connectTimeoutMs,
              );
        } catch {
          return fail(
            "dns",
            request.signal?.aborted ? "DIAG-AEAT-CANCELLED" : "DIAG-AEAT-DNS",
            "not-started",
          );
        }
        if (
          addresses.length === 0 ||
          addresses.length > 16 ||
          addresses.some((entry) => isIP(entry.address) !== entry.family)
        )
          return fail("dns", "DIAG-AEAT-DNS-ADDRESS", "not-started");
        const testLoopback =
          request.endpoint.environment === "test" &&
          isLoopback(url.hostname) &&
          addresses.every((entry) => isLoopback(entry.address));
        if (
          !testLoopback &&
          addresses.some((entry) => !isPublicAddress(entry.address))
        )
          return fail("dns", "DIAG-AEAT-DNS-PRIVATE", "not-started");
        const pinned = addresses[0]!;

        try {
          material = await input.tlsMaterials.acquire(
            request.certificateAuthorization,
          );
          if (
            !(material.certificatePem instanceof Uint8Array) ||
            material.certificatePem.byteLength === 0 ||
            material.certificatePem.byteLength > 1_048_576 ||
            !(material.privateKeyPem instanceof Uint8Array) ||
            material.privateKeyPem.byteLength === 0 ||
            material.privateKeyPem.byteLength > 1_048_576 ||
            (material.caPem !== undefined &&
              (!(material.caPem instanceof Uint8Array) ||
                material.caPem.byteLength > 1_048_576))
          )
            return fail(
              "preflight",
              "DIAG-AEAT-CREDENTIAL-UNAVAILABLE",
              "not-started",
            );
          const clientCertificate = new X509Certificate(
            Buffer.from(material.certificatePem),
          );
          const certificateFingerprint = `sha256:${createHash("sha256").update(clientCertificate.raw).digest("hex")}`;
          if (
            certificateFingerprint !==
            request.certificateAuthorization.certificateFingerprint
          )
            return fail(
              "preflight",
              "DIAG-AEAT-CREDENTIAL-BINDING",
              "not-started",
            );
        } catch {
          return fail(
            "preflight",
            "DIAG-AEAT-CREDENTIAL-UNAVAILABLE",
            "not-started",
          );
        }

        return await new Promise<TransportObservation>((resolve) => {
          let done = false;
          let phase: TransportObservation["phase"] = "connect";
          let delivery: DeliveryKnowledge = "not-started";
          let tls: TlsObservation | null = null;
          let failureCode: string | null = null;
          let statusCode: number | null = null;
          let headers: Record<string, string> = Object.create(null) as Record<
            string,
            string
          >;
          const chunks: Buffer[] = [];
          let responseBytes = 0;
          const timers = new Set<NodeJS.Timeout>();
          const clearTimers = () => {
            for (const timer of timers) clearTimeout(timer);
            timers.clear();
          };
          const lookup: LookupFunction = (_hostname, options, callback) => {
            if (options?.all)
              callback(null, [
                { address: pinned.address, family: pinned.family },
              ]);
            else callback(null, pinned.address, pinned.family);
          };
          const requestObject: ReturnType<typeof httpsRequest> = httpsRequest(
            {
              protocol: "https:",
              hostname: url.hostname,
              port: url.port || 443,
              path: `${url.pathname}${url.search}`,
              method: "POST",
              agent: false,
              lookup,
              servername: isIP(url.hostname) ? undefined : url.hostname,
              rejectUnauthorized: true,
              cert: Buffer.from(material!.certificatePem),
              key: Buffer.from(material!.privateKeyPem),
              minVersion: "TLSv1.2",
              maxVersion: "TLSv1.3",
              maxHeaderSize: 16_384,
              ...(material!.caPem ? { ca: Buffer.from(material!.caPem) } : {}),
              headers: {
                "content-type": request.request.contentType,
                "content-length": String(request.request.byteLength),
                soapaction: request.request.soapAction,
                accept: "text/xml, application/soap+xml",
                connection: "close",
              },
            },
            (response) => {
              clear(firstByteTimer);
              phase = "response-headers";
              statusCode = response.statusCode ?? null;
              headers = Object.create(null) as Record<string, string>;
              for (const [key, value] of Object.entries(response.headers)) {
                if (typeof value === "string")
                  headers[key.toLowerCase()] = value;
              }
              if (Object.keys(response.headers).length > 32) {
                phase = "response-headers";
                finishFailure("DIAG-AEAT-RESPONSE-HEADERS-LIMIT");
                requestObject.destroy();
                return;
              }
              if (
                response.headers["content-length"] &&
                Number(response.headers["content-length"]) >
                  request.limits.maxResponseBytes
              ) {
                phase = "response-body";
                finishFailure("DIAG-AEAT-RESPONSE-LIMIT");
                requestObject.destroy();
                return;
              }
              const idleTimer = {
                current: arm(
                  request.limits.bodyIdleTimeoutMs,
                  "DIAG-AEAT-BODY-IDLE",
                  "response-body",
                ),
              };
              response.on("data", (chunk: Buffer) => {
                clear(idleTimer.current);
                const remaining =
                  request.limits.maxResponseBytes - responseBytes;
                if (chunk.length > remaining) {
                  if (remaining > 0)
                    chunks.push(Buffer.from(chunk.subarray(0, remaining)));
                  responseBytes = request.limits.maxResponseBytes;
                  phase = "response-body";
                  finishFailure("DIAG-AEAT-RESPONSE-LIMIT");
                  requestObject.destroy();
                  return;
                }
                responseBytes += chunk.length;
                chunks.push(Buffer.from(chunk));
                idleTimer.current = arm(
                  request.limits.bodyIdleTimeoutMs,
                  "DIAG-AEAT-BODY-IDLE",
                  "response-body",
                );
              });
              response.on("end", () => {
                clear(idleTimer.current);
                phase = "complete";
                finish(
                  Object.freeze({
                    statusCode,
                    headers: Object.freeze(headers),
                    responseBytes: Buffer.concat(chunks, responseBytes),
                    phase,
                    delivery,
                    failureCode: null,
                    tls,
                    startedAt: startInstant,
                    completedAt: wallNow(request),
                    elapsedMs: elapsed(request, started),
                  }),
                );
              });
              response.on("aborted", () => {
                phase = "response-body";
                finishFailure("DIAG-AEAT-RESPONSE-TRUNCATED");
                requestObject.destroy();
              });
              response.on("error", () => {
                phase = "response-body";
                finishFailure("DIAG-AEAT-RESPONSE-ERROR");
                requestObject.destroy();
              });
            },
          );
          let tlsTimer: NodeJS.Timeout | undefined;
          let writeTimer: NodeJS.Timeout | undefined;
          let firstByteTimer: NodeJS.Timeout | undefined;
          const finish = (value: TransportObservation) => {
            if (done) return;
            done = true;
            clearTimers();
            request.signal?.removeEventListener("abort", onAbort);
            resolve(value);
          };
          const finishFailure = (code: string) => {
            failureCode = code;
            finish(
              Object.freeze({
                statusCode,
                headers: Object.freeze(headers),
                responseBytes:
                  responseBytes > 0
                    ? Buffer.concat(chunks, responseBytes)
                    : null,
                phase,
                delivery,
                failureCode: code,
                tls,
                startedAt: startInstant,
                completedAt: wallNow(request),
                elapsedMs: elapsed(request, started),
              }),
            );
          };
          const arm = (
            milliseconds: number,
            code: string,
            currentPhase: TransportObservation["phase"],
          ) => {
            const timer = setTimeout(() => {
              phase = currentPhase;
              finishFailure(code);
              requestObject.destroy();
            }, milliseconds);
            timers.add(timer);
            return timer;
          };
          const clear = (timer: NodeJS.Timeout | undefined) => {
            if (timer) {
              clearTimeout(timer);
              timers.delete(timer);
            }
          };
          const connectTimer = arm(
            request.limits.connectTimeoutMs,
            "DIAG-AEAT-CONNECT-TIMEOUT",
            "connect",
          );
          arm(
            request.limits.totalTimeoutMs,
            "DIAG-AEAT-TOTAL-TIMEOUT",
            "response-body",
          );
          requestObject.on("socket", (socket) => {
            const tlsSocket = socket as TLSSocket;
            socket.once("connect", () => {
              clear(connectTimer);
              phase = "tls";
              tlsTimer = arm(
                request.limits.tlsTimeoutMs,
                "DIAG-AEAT-TLS-TIMEOUT",
                "tls",
              );
            });
            tlsSocket.once("secureConnect", () => {
              clear(tlsTimer);
              phase = "request-write";
              tls = safeTls(tlsSocket, url.hostname);
              if (tls === null || tls.authorized !== true) {
                finishFailure("DIAG-AEAT-TLS-AUTH");
                requestObject.destroy();
                return;
              }
              delivery = "possibly-sent";
              writeTimer = arm(
                request.limits.writeTimeoutMs,
                "DIAG-AEAT-WRITE-TIMEOUT",
                "request-write",
              );
            });
          });
          requestObject.on("finish", () => {
            clear(writeTimer);
            delivery = "fully-sent";
            phase = "response-headers";
            firstByteTimer = arm(
              request.limits.firstByteTimeoutMs,
              "DIAG-AEAT-FIRST-BYTE-TIMEOUT",
              "response-headers",
            );
          });
          requestObject.on("error", (error: Error) => {
            const errorCode = (error as NodeJS.ErrnoException).code ?? "";
            const tlsFailureCodes = new Set([
              "ERR_TLS_CERT_ALTNAME_INVALID",
              "CERT_HAS_EXPIRED",
              "CERT_NOT_YET_VALID",
              "CERT_REVOKED",
              "CERT_SIGNATURE_FAILURE",
              "DEPTH_ZERO_SELF_SIGNED_CERT",
              "UNABLE_TO_GET_ISSUER_CERT",
              "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
              "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
            ]);
            const code =
              failureCode ??
              (phase === "tls" ||
              tlsFailureCodes.has(errorCode) ||
              errorCode.startsWith("ERR_TLS_") ||
              errorCode.startsWith("ERR_SSL_")
                ? "DIAG-AEAT-TLS-AUTH"
                : /^DIAG-[A-Z0-9_-]{1,100}$/u.test(error.message)
                  ? error.message
                  : "DIAG-AEAT-NETWORK");
            finishFailure(code);
          });
          const onAbort = () => {
            finishFailure("DIAG-AEAT-CANCELLED");
            requestObject.destroy();
          };
          request.signal?.addEventListener("abort", onAbort, { once: true });
          if (request.signal?.aborted) onAbort();
          requestObject.end(Buffer.from(request.request.bytes));
          requestObject.on("response", () => {
            /* response listener above owns the bytes */
          });
        });
      } finally {
        if (material && input.tlsMaterials.release) {
          try {
            await input.tlsMaterials.release(
              request.certificateAuthorization,
              material,
            );
          } catch {
            /* cleanup failure is not credential data */
          }
        }
      }
    },
  });
}
