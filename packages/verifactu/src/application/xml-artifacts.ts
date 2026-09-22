import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "../domain/diagnostics.js";
import type { ArtifactId, EditionId, TenantId } from "../domain/identities.js";
import type { FiscalInstant } from "../domain/date-time.js";
import type { DigestComputer } from "./fingerprint.js";

export type ByteArtifactState =
  | "prepared"
  | "validated"
  | "stored"
  | "submitted"
  | "acknowledged"
  | "rejected"
  | "quarantined";

export interface ByteArtifactInput {
  readonly id: ArtifactId;
  readonly kind: string;
  readonly tenantId: TenantId;
  readonly editionId: EditionId;
  readonly profileId: string;
  readonly producer: string;
  readonly createdAt: FiscalInstant;
  readonly creationTimeSource: string;
  readonly mediaType: string;
  readonly bytes: Uint8Array;
  readonly parentIds: readonly ArtifactId[];
  readonly transformation: string;
  readonly validationClaims: readonly string[];
  readonly custodian: string;
  readonly retentionClass: string;
}

export interface ByteArtifact
  extends Omit<ByteArtifactInput, "bytes" | "parentIds" | "validationClaims"> {
  readonly bytes: readonly number[];
  readonly byteLength: number;
  readonly sha256: string;
  readonly sha512: string;
  readonly parentIds: readonly ArtifactId[];
  readonly validationClaims: readonly string[];
  readonly state: ByteArtifactState;
}

const TRANSITIONS = Object.freeze({
  prepared: Object.freeze<ByteArtifactState[]>(["validated", "quarantined"]),
  validated: Object.freeze<ByteArtifactState[]>(["stored", "quarantined"]),
  stored: Object.freeze<ByteArtifactState[]>(["submitted", "quarantined"]),
  submitted: Object.freeze<ByteArtifactState[]>([
    "acknowledged",
    "rejected",
    "quarantined",
  ]),
  acknowledged: Object.freeze<ByteArtifactState[]>([]),
  rejected: Object.freeze<ByteArtifactState[]>([]),
  quarantined: Object.freeze<ByteArtifactState[]>([]),
}) satisfies Readonly<Record<ByteArtifactState, readonly ByteArtifactState[]>>;

export function createByteArtifact(
  input: ByteArtifactInput,
  digest: DigestComputer,
): OperationResult<ByteArtifact> {
  if (
    input.id.length === 0 ||
    input.kind.length === 0 ||
    input.profileId.length === 0 ||
    input.producer.length === 0 ||
    input.creationTimeSource.length === 0 ||
    input.mediaType.length === 0 ||
    input.transformation.length === 0 ||
    input.custodian.length === 0 ||
    input.retentionClass.length === 0 ||
    input.parentIds.includes(input.id) ||
    new Set(input.parentIds).size !== input.parentIds.length
  )
    return artifactFailure("DIAG-ARTIFACT-DESCRIPTOR");
  const bytes = Uint8Array.from(input.bytes);
  let sha256: Uint8Array;
  let sha512: Uint8Array;
  try {
    sha256 = digest("SHA-256", Uint8Array.from(bytes));
    sha512 = digest("SHA-512", Uint8Array.from(bytes));
  } catch {
    return artifactFailure("DIAG-ARTIFACT-DIGEST");
  }
  if (sha256.length !== 32 || sha512.length !== 64)
    return artifactFailure("DIAG-ARTIFACT-DIGEST");
  return succeeded(
    freezeArtifact({
      ...input,
      bytes: [...bytes],
      byteLength: bytes.length,
      sha256: hex(sha256),
      sha512: hex(sha512),
      state: "prepared",
    }),
  );
}

export function transitionByteArtifact(
  artifact: ByteArtifact,
  next: ByteArtifactState,
): OperationResult<ByteArtifact> {
  const allowed: readonly ByteArtifactState[] = TRANSITIONS[artifact.state];
  if (!allowed.includes(next))
    return artifactFailure("DIAG-ARTIFACT-TRANSITION");
  return succeeded(freezeArtifact({ ...artifact, state: next }));
}

export function byteArtifactBytes(artifact: ByteArtifact): Uint8Array {
  return Uint8Array.from(artifact.bytes);
}

function freezeArtifact(artifact: ByteArtifact): ByteArtifact {
  return Object.freeze({
    ...artifact,
    bytes: Object.freeze([...artifact.bytes]),
    parentIds: Object.freeze([...artifact.parentIds]),
    validationClaims: Object.freeze([...artifact.validationClaims]),
  });
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function artifactFailure(code: `DIAG-${string}`): OperationResult<never> {
  return failed("invalid", [
    diagnostic(code, "integrity", "state", "/artifact"),
  ]);
}
