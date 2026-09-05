// SPDX-License-Identifier: Apache-2.0

import { X509Certificate } from "node:crypto";
import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";

export interface CertificateDescriptor {
  readonly id: string;
  readonly subject: string;
  readonly issuer: string;
  readonly serialNumber: string;
  readonly notBefore: string;
  readonly notAfter: string;
  readonly qualified: boolean;
  readonly derSha256: string;
}

export interface CertificateHandle {
  readonly descriptor: CertificateDescriptor;
  /** Private material is intentionally not representable or serializable here. */
  readonly sign: (
    algorithm: "RSA-SHA256" | "RSA-SHA384" | "RSA-SHA512",
    data: Uint8Array,
    signal?: AbortSignal,
  ) => Promise<Uint8Array>;
}

export interface CertificateProvider {
  select(subjectNif: string, at: Date, signal?: AbortSignal): Promise<Result<CertificateHandle>>;
}

export function describeCertificate(
  id: string,
  der: Uint8Array,
  qualified = false,
): Result<CertificateDescriptor> {
  if (der.byteLength === 0 || id.length === 0 || id.length > 128) return certificateFailure("id");
  try {
    const certificate = new X509Certificate(Buffer.from(der));
    const descriptor = Object.freeze({
      id,
      subject: certificate.subject,
      issuer: certificate.issuer,
      serialNumber: certificate.serialNumber,
      notBefore: certificate.validFrom,
      notAfter: certificate.validTo,
      qualified,
      derSha256: certificate.fingerprint256.replaceAll(":", "").toUpperCase(),
    });
    return success(descriptor);
  } catch {
    return certificateFailure("der");
  }
}

export function assertCertificateUsable(
  descriptor: CertificateDescriptor,
  at: Date,
): Result<CertificateDescriptor> {
  const time = at.getTime();
  const from = Date.parse(descriptor.notBefore);
  const to = Date.parse(descriptor.notAfter);
  if (
    !Number.isFinite(time) ||
    !Number.isFinite(from) ||
    !Number.isFinite(to) ||
    time < from ||
    time > to
  )
    return failure("INVALID_INPUT", [
      createDiagnostic({ code: "VF_CERTIFICATE_INVALID", severity: "error", phase: "security" }),
    ]);
  if (!descriptor.qualified)
    return failure("INVALID_INPUT", [
      createDiagnostic({ code: "VF_CERTIFICATE_UNTRUSTED", severity: "error", phase: "security" }),
    ]);
  return success(descriptor);
}

function certificateFailure(path: string): Result<never> {
  return failure("INVALID_INPUT", [
    createDiagnostic({
      code: "VF_CERTIFICATE_INVALID",
      severity: "error",
      phase: "security",
      path,
    }),
  ]);
}
