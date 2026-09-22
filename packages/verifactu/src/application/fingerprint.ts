import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "../domain/diagnostics.js";
import type { EditionId } from "../domain/identities.js";

export type DigestAlgorithm = "SHA-256" | "SHA-512";
export type DigestComputer = (
  algorithm: DigestAlgorithm,
  bytes: Uint8Array,
) => Uint8Array;

export interface FingerprintDescriptor {
  readonly id: string;
  readonly editionId: EditionId;
  readonly algorithm: "SHA-256";
  readonly output: "uppercase-hex";
}

export interface Fingerprint {
  readonly descriptorId: string;
  readonly editionId: EditionId;
  readonly algorithm: "SHA-256";
  readonly value: string;
}

export function computeFingerprint(
  descriptor: FingerprintDescriptor,
  editionId: EditionId,
  bytes: Uint8Array,
  digest: DigestComputer,
): OperationResult<Fingerprint> {
  if (
    descriptor.editionId !== editionId ||
    descriptor.id.length === 0 ||
    descriptor.algorithm !== "SHA-256" ||
    descriptor.output !== "uppercase-hex"
  )
    return fingerprintFailure("DIAG-FINGERPRINT-DESCRIPTOR");
  let value: Uint8Array;
  try {
    value = digest(descriptor.algorithm, Uint8Array.from(bytes));
  } catch {
    return fingerprintFailure("DIAG-FINGERPRINT-COMPUTATION");
  }
  if (value.length !== 32)
    return fingerprintFailure("DIAG-FINGERPRINT-COMPUTATION");
  return succeeded(
    Object.freeze({
      descriptorId: descriptor.id,
      editionId,
      algorithm: descriptor.algorithm,
      value: hex(value).toUpperCase(),
    }),
  );
}

export function verifyFingerprint(
  descriptor: FingerprintDescriptor,
  editionId: EditionId,
  bytes: Uint8Array,
  supplied: string,
  digest: DigestComputer,
): OperationResult<boolean> {
  if (!/^[A-F0-9]{64}$/u.test(supplied))
    return fingerprintFailure("DIAG-FINGERPRINT-LEXICAL");
  const computed = computeFingerprint(descriptor, editionId, bytes, digest);
  if (computed.status !== "succeeded") return computed;
  return succeeded(equalText(computed.value.value, supplied));
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function equalText(left: string, right: string): boolean {
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1)
    difference |=
      (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  return difference === 0;
}

function fingerprintFailure(code: `DIAG-${string}`): OperationResult<never> {
  return failed("invalid", [
    diagnostic(code, "input", "domain", "/fingerprint"),
  ]);
}
