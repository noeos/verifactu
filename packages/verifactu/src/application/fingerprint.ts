import { invalid, ok, type Result } from "../contracts/results.js";
import type { Identity } from "../domain/identities.js";
import { isIdentity } from "../domain/identities.js";
import { digestBytes, type DigestPort } from "../ports/digest.js";
import type { ProjectedField } from "./official-projection.js";
import {
  serializeOfficialProjection,
  type SerializationRule,
} from "./official-serialization.js";
export interface FingerprintInput {
  readonly editionId: Identity<"edition">;
  readonly expectedEditionId: Identity<"edition">;
  readonly algorithm: "sha256" | "sha512" | string;
  readonly fields: readonly ProjectedField[];
  readonly rule: SerializationRule;
  readonly digest: DigestPort;
  readonly suppliedDigest?: string;
}
export interface Fingerprint {
  readonly editionId: Identity<"edition">;
  readonly algorithm: "sha256" | "sha512";
  readonly preimage: Uint8Array;
  readonly preimageLength: number;
  readonly digest: string;
}
export function createFingerprint(
  input: FingerprintInput,
): Result<Fingerprint> {
  if (
    !input ||
    !isIdentity(input.editionId, "edition") ||
    !isIdentity(input.expectedEditionId, "edition") ||
    input.editionId.value !== input.expectedEditionId.value ||
    !isIdentity(input.rule?.editionId, "edition") ||
    input.rule.editionId.value !== input.editionId.value ||
    (input.algorithm !== "sha256" && input.algorithm !== "sha512")
  )
    return invalid("DIAG-FINGERPRINT-EDITION-ALGORITHM", "edition");
  const serialized = serializeOfficialProjection(input.fields, input.rule);
  if (serialized.status !== "ok") return serialized;
  const computed = digestBytes(
    input.digest,
    input.algorithm,
    serialized.value.bytes,
  );
  if (computed.status !== "ok") return computed;
  const digest = computed.value;
  if (input.suppliedDigest !== undefined && input.suppliedDigest !== digest)
    return invalid("DIAG-FINGERPRINT-DIGEST-MISMATCH", "domain");
  const preimage = serialized.value.bytes;
  return ok(
    Object.freeze({
      editionId: Object.freeze({ ...input.editionId }),
      algorithm: input.algorithm,
      get preimage() {
        return preimage.slice();
      },
      preimageLength: serialized.value.length,
      digest,
    }),
  );
}
