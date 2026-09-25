import { invalid, ok, type Result } from "../contracts/results.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalContext } from "../domain/context.js";
import type { Identity } from "../domain/identities.js";
import { isIdentity } from "../domain/identities.js";
import { digestBytes, type DigestPort } from "../ports/digest.js";
export type ArtifactState =
  | "produced"
  | "bounded-and-digested"
  | "validated"
  | "eligible"
  | "signed"
  | "signature-verified"
  | "committed"
  | "transmitted"
  | "retained";
export interface XmlArtifactInput {
  readonly artifactId: string;
  readonly context: FiscalContext;
  readonly editionId: Identity<"edition">;
  readonly kind: string;
  readonly mediaType: string;
  readonly bytes: Uint8Array;
  readonly parentIds: readonly string[];
  readonly transform: string;
  readonly state: ArtifactState;
}
export interface XmlArtifact extends Omit<XmlArtifactInput, "bytes"> {
  readonly bytes: Uint8Array;
  readonly length: number;
  readonly sha256: string;
  readonly sha512: string;
}
const sequence: readonly ArtifactState[] = [
  "produced",
  "bounded-and-digested",
  "validated",
  "eligible",
  "signed",
  "signature-verified",
  "committed",
  "transmitted",
  "retained",
];
const custody = new WeakMap<object, Uint8Array>();
function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index += 1)
    if (left[index] !== right[index]) return false;
  return true;
}
export function createXmlArtifact(
  input: XmlArtifactInput,
  digest: DigestPort,
): Result<XmlArtifact> {
  const context = input?.context ? createFiscalContext(input.context) : null;
  if (
    !input ||
    typeof input.artifactId !== "string" ||
    !input.artifactId ||
    input.artifactId.length > 256 ||
    context?.status !== "ok" ||
    !isIdentity(input.editionId, "edition") ||
    context.value.editionId.value !== input.editionId.value ||
    typeof input.kind !== "string" ||
    !input.kind ||
    typeof input.mediaType !== "string" ||
    !input.mediaType.includes("/") ||
    !(input.bytes instanceof Uint8Array) ||
    input.bytes.byteLength > 8 * 1024 * 1024 ||
    !Array.isArray(input.parentIds) ||
    input.parentIds.some(
      (id) => typeof id !== "string" || !id || id === input.artifactId,
    ) ||
    new Set(input.parentIds).size !== input.parentIds.length ||
    typeof input.transform !== "string" ||
    !input.transform ||
    input.state !== "produced"
  )
    return invalid("DIAG-ARTIFACT-INPUT", "domain");
  const bytes = input.bytes.slice();
  const sha256 = digestBytes(digest, "sha256", bytes);
  const sha512 = digestBytes(digest, "sha512", bytes);
  if (sha256.status !== "ok" || sha512.status !== "ok")
    return invalid("DIAG-ARTIFACT-DIGEST", "domain");
  const artifact = Object.freeze({
    ...input,
    context: context.value,
    editionId: Object.freeze({ ...input.editionId }),
    get bytes() {
      return bytes.slice();
    },
    parentIds: Object.freeze([...input.parentIds]),
    length: bytes.byteLength,
    sha256: sha256.value,
    sha512: sha512.value,
  });
  custody.set(artifact, bytes);
  return ok(artifact);
}
export function transitionXmlArtifact(
  artifact: XmlArtifact,
  next: ArtifactState,
  expectedBytes: Uint8Array,
  digest: DigestPort,
): Result<XmlArtifact> {
  const originalBytes =
    artifact && typeof artifact === "object"
      ? custody.get(artifact)
      : undefined;
  const custodyMatches =
    expectedBytes instanceof Uint8Array &&
    Boolean(originalBytes) &&
    originalBytes !== undefined &&
    bytesEqual(expectedBytes, originalBytes);
  const sha256 =
    expectedBytes instanceof Uint8Array
      ? digestBytes(digest, "sha256", expectedBytes)
      : null;
  const sha512 =
    expectedBytes instanceof Uint8Array
      ? digestBytes(digest, "sha512", expectedBytes)
      : null;
  if (
    !artifact ||
    !custodyMatches ||
    !(expectedBytes instanceof Uint8Array) ||
    !sequence.includes(artifact.state) ||
    sequence.indexOf(next) !== sequence.indexOf(artifact.state) + 1 ||
    expectedBytes.byteLength !== artifact.length ||
    !bytesEqual(expectedBytes, artifact.bytes) ||
    sha256?.status !== "ok" ||
    sha512?.status !== "ok" ||
    sha256.value !== artifact.sha256 ||
    sha512.value !== artifact.sha512
  )
    return invalid("DIAG-ARTIFACT-TRANSITION", "domain");
  const bytes = artifact.bytes;
  const transitioned = Object.freeze({
    ...artifact,
    get bytes() {
      return bytes.slice();
    },
    parentIds: Object.freeze([...artifact.parentIds]),
    state: next,
  });
  custody.set(transitioned, bytes.slice());
  return ok(transitioned);
}
