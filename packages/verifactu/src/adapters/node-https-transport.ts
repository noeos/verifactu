// SPDX-License-Identifier: Apache-2.0

import { request, type Agent } from "node:https";
import { createHash } from "node:crypto";
import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";
import type { AeatRequest, AeatObservation, AeatTransport } from "../ports/index.js";
import { resolveAeatEndpoint } from "../transport/endpoints.js";

export interface AeatTlsProvider {
  readonly certificateId: string;
  agent(environment: "test" | "production", signal?: AbortSignal): Promise<Agent>;
}

export interface NodeTransportOptions {
  readonly timeoutMs?: number;
  readonly maxResponseBytes?: number;
  readonly tls: AeatTlsProvider;
  readonly now?: () => string;
}

export class NodeHttpsAeatTransport implements AeatTransport {
  private readonly timeoutMs: number;
  private readonly maxResponseBytes: number;
  private readonly now: () => string;
  private readonly tls: AeatTlsProvider;

  constructor(options: NodeTransportOptions) {
    if (
      !Number.isInteger(options.timeoutMs ?? 30_000) ||
      (options.timeoutMs ?? 30_000) < 1 ||
      (options.timeoutMs ?? 30_000) > 300_000 ||
      !Number.isInteger(options.maxResponseBytes ?? 16 * 1024 * 1024) ||
      (options.maxResponseBytes ?? 16 * 1024 * 1024) < 1
    )
      throw new RangeError("Invalid AEAT transport limits");
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxResponseBytes = options.maxResponseBytes ?? 16 * 1024 * 1024;
    this.now = options.now ?? (() => new Date().toISOString());
    this.tls = options.tls;
  }

  async send(input: AeatRequest, signal?: AbortSignal): Promise<Result<AeatObservation>> {
    const endpoint = resolveAeatEndpoint(input.environment, input.endpointId);
    if (!endpoint.ok) return endpoint;
    const digest = createHash("sha256").update(input.body).digest("hex");
    if (
      input.requestDigest !== digest ||
      input.body.byteLength === 0 ||
      input.certificateId !== this.tls.certificateId
    )
      return failure("INVALID_INPUT", [
        createDiagnostic({ code: "VF_INPUT_VALUE_INVALID", severity: "error", phase: "transport" }),
      ]);
    if (signal?.aborted === true)
      return failure("ABORTED", [
        createDiagnostic({ code: "VF_INPUT_ABORTED", severity: "error", phase: "transport" }),
      ]);
    let agent: Agent;
    try {
      agent = await this.tls.agent(input.environment, signal);
    } catch {
      return failure("INVALID_INPUT", [
        createDiagnostic({
          code: "VF_TRANSPORT_TLS_INVALID",
          severity: "error",
          phase: "transport",
        }),
      ]);
    }
    return new Promise((resolve) => {
      const url = new URL(endpoint.value.url);
      let settled = false;
      let bytesWritten = 0;
      const finish = (result: Result<AeatObservation>): void => {
        if (!settled) {
          settled = true;
          resolve(result);
        }
      };
      const timer = setTimeout(() => {
        client.destroy(new Error("timeout"));
        if (bytesWritten > 0)
          finish(
            success(
              Object.freeze({
                requestDigest: input.requestDigest,
                responseBytes: undefined,
                httpStatus: undefined,
                bytesWritten,
                bytesRead: 0,
                completed: false,
                receivedAt: this.now(),
              }),
            ),
          );
        else
          finish(
            failure("INVALID_INPUT", [
              createDiagnostic({
                code: "VF_TRANSPORT_TIMEOUT",
                severity: "error",
                phase: "transport",
              }),
            ]),
          );
      }, this.timeoutMs);
      const client = request(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || undefined,
          path: `${url.pathname}${url.search}`,
          method: "POST",
          agent,
          servername: url.hostname,
          headers: {
            "content-type": "text/xml; charset=utf-8",
            "content-length": input.body.byteLength.toString(),
            SOAPAction: endpoint.value.soapAction,
          },
        },
        (response) => {
          const chunks: Buffer[] = [];
          let bytesRead = 0;
          response.on("data", (chunk: Buffer) => {
            bytesRead += chunk.byteLength;
            if (bytesRead <= this.maxResponseBytes) chunks.push(chunk);
            else {
              clearTimeout(timer);
              client.destroy(new Error("response limit"));
              finish(
                failure("INVALID_INPUT", [
                  createDiagnostic({
                    code: "VF_INPUT_LIMIT_EXCEEDED",
                    severity: "error",
                    phase: "limits",
                  }),
                ]),
              );
            }
          });
          response.on("end", () => {
            clearTimeout(timer);
            const body = Buffer.concat(chunks);
            finish(
              success(
                Object.freeze({
                  requestDigest: input.requestDigest,
                  responseBytes: body,
                  httpStatus: response.statusCode,
                  bytesWritten,
                  bytesRead,
                  completed: true,
                  receivedAt: this.now(),
                }),
              ),
            );
          });
          response.on("error", () => {
            clearTimeout(timer);
            finish(
              failure("INVALID_INPUT", [
                createDiagnostic({
                  code: "VF_TRANSPORT_RESPONSE_INVALID",
                  severity: "error",
                  phase: "transport",
                }),
              ]),
            );
          });
        },
      );
      client.on("error", () => {
        clearTimeout(timer);
        if (bytesWritten > 0) {
          finish(
            success(
              Object.freeze({
                requestDigest: input.requestDigest,
                responseBytes: undefined,
                httpStatus: undefined,
                bytesWritten,
                bytesRead: 0,
                completed: false,
                receivedAt: this.now(),
              }),
            ),
          );
        } else {
          finish(
            failure("INVALID_INPUT", [
              createDiagnostic({
                code: "VF_TRANSPORT_TIMEOUT",
                severity: "error",
                phase: "transport",
              }),
            ]),
          );
        }
      });
      const abort = (): void => {
        client.destroy(new Error("aborted"));
        if (bytesWritten > 0)
          finish(
            success(
              Object.freeze({
                requestDigest: input.requestDigest,
                responseBytes: undefined,
                httpStatus: undefined,
                bytesWritten,
                bytesRead: 0,
                completed: false,
                receivedAt: this.now(),
              }),
            ),
          );
        else
          finish(
            failure("ABORTED", [
              createDiagnostic({ code: "VF_INPUT_ABORTED", severity: "error", phase: "transport" }),
            ]),
          );
      };
      signal?.addEventListener("abort", abort, { once: true });
      client.on("close", () => signal?.removeEventListener("abort", abort));
      client.write(Buffer.from(input.body), () => {
        bytesWritten = input.body.byteLength;
        client.end();
      });
    });
  }
}
