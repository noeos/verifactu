import { invalid, ok, type Result } from "../contracts/results.js";

export type DigestAlgorithm = "sha256" | "sha512";
export interface DigestPort {
  readonly providerId: string;
  digest(algorithm: DigestAlgorithm, bytes: Uint8Array): string;
}

export function digestBytes(
  provider: DigestPort,
  algorithm: DigestAlgorithm,
  bytes: Uint8Array,
): Result<string> {
  if (
    !provider ||
    typeof provider.providerId !== "string" ||
    provider.providerId.length === 0 ||
    provider.providerId.length > 128 ||
    provider.providerId !== provider.providerId.trim() ||
    /[\u0000-\u001f\u007f]/u.test(provider.providerId) ||
    typeof provider.digest !== "function" ||
    (algorithm !== "sha256" && algorithm !== "sha512") ||
    !(bytes instanceof Uint8Array)
  )
    return invalid("DIAG-DIGEST-INPUT", "domain");
  let value: string;
  try {
    value = provider.digest(algorithm, bytes.slice());
  } catch {
    return invalid("DIAG-DIGEST-UNAVAILABLE", "domain");
  }
  const length = algorithm === "sha256" ? 64 : 128;
  if (
    typeof value !== "string" ||
    !new RegExp("^[0-9a-f]{" + length + "}$", "u").test(value)
  )
    return invalid("DIAG-DIGEST-OUTPUT", "domain");
  return ok(algorithm + ":" + value);
}
