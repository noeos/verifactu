import {
  DIAGNOSTIC_SCHEMA,
  type Limits as EngineLimits,
  type NormalizationProfile,
  type OperationResult as EngineOperationResult,
} from "@noeos/verification-engine";
import {
  createVerificationClaimSet,
  getVerificationClaim,
  type VerificationClaimSet,
} from "./claims.js";
import { invalid, ok, type Result } from "../contracts/results.js";

export const ENGINE_PROFILE_ID = "es.noeos.verifactu.record";
export const ENGINE_PROFILE_VERSION = "1.0.0";
export const ENGINE_PROFILE_SCHEMA = "es.noeos.verifactu.record/1";
export const ENGINE_PROFILE_VECTOR_SHA256 =
  "28a309f7d986af078fbbb58a16f8744b877201d6816fcde5b5b5a84b5451d9a8";

export const ENGINE_PROFILE_LIMITS: EngineLimits = Object.freeze({
  maxPayloadBytes: 65_536,
  maxJsonDepth: 16,
  maxObjectProperties: 128,
  maxArrayElements: 64,
  maxStringBytes: 4_096,
  maxNdjsonLineBytes: 65_536,
  maxDiagnostics: 32,
  maxFullRecords: 128,
});

export const ENGINE_PROFILE_MANIFEST = Object.freeze({
  name: ENGINE_PROFILE_ID,
  version: ENGINE_PROFILE_VERSION,
  vectorSha256: ENGINE_PROFILE_VECTOR_SHA256,
  limits: ENGINE_PROFILE_LIMITS,
  license: "Apache-2.0",
});

const opaquePattern = /^opaque:[0-9a-f]{64}$/u;
const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const editionPattern = /^[A-Za-z0-9][A-Za-z0-9._+-]{0,127}$/u;
const algorithmPattern = /^[a-z][a-z0-9-]{0,63}$/u;
const operationKinds = new Set([
  "alta",
  "anulacion",
  "correction",
  "substitution",
]);
const artifactKinds = new Set(["xml", "xades", "qr", "record", "chain"]);

export interface EngineArtifactDigest {
  readonly order: number;
  readonly kind: string;
  readonly digest: string;
}

export interface EngineProfileProjection {
  readonly schema: typeof ENGINE_PROFILE_SCHEMA;
  readonly contextId: string;
  readonly sequenceId: string;
  readonly recordId: string;
  readonly editionId: string;
  readonly operationKind: "alta" | "anulacion" | "correction" | "substitution";
  readonly position: number;
  readonly artifacts: readonly EngineArtifactDigest[];
  readonly predecessorEvidenceDigest: string | null;
  readonly algorithmIds: readonly string[];
}

function vectorProjection(
  recordId: string,
  operationKind: "alta" | "anulacion",
  artifactDigests: readonly string[],
  predecessorEvidenceDigest: string | null,
  algorithmIds: readonly string[],
): EngineProfileProjection {
  return Object.freeze({
    schema: ENGINE_PROFILE_SCHEMA,
    contextId: `opaque:${"0".repeat(64)}`,
    sequenceId: `opaque:${"1".repeat(64)}`,
    recordId,
    editionId: "rrsif-2026-09-21-active",
    operationKind,
    position: predecessorEvidenceDigest === null ? 0 : 1,
    artifacts: Object.freeze(
      artifactDigests.map((digest, order) =>
        Object.freeze({ order, kind: order === 0 ? "xml" : "qr", digest }),
      ),
    ),
    predecessorEvidenceDigest,
    algorithmIds: Object.freeze([...algorithmIds]),
  });
}

export const ENGINE_PROFILE_TEST_VECTORS = Object.freeze([
  Object.freeze({
    name: "genesis",
    projection: vectorProjection(
      `opaque:${"2".repeat(64)}`,
      "alta",
      [`sha256:${"a".repeat(64)}`],
      null,
      ["sha-256"],
    ),
  }),
  Object.freeze({
    name: "linked",
    projection: vectorProjection(
      `opaque:${"3".repeat(64)}`,
      "anulacion",
      [`sha256:${"b".repeat(64)}`, `sha256:${"c".repeat(64)}`],
      `sha256:${"d".repeat(64)}`,
      ["sha-256", "sha-512"],
    ),
  }),
]);

export interface EngineProfileProjectionInput {
  readonly contextId: string;
  readonly sequenceId: string;
  readonly recordId: string;
  readonly editionId: string;
  readonly operationKind: string;
  readonly position?: number;
  readonly artifacts: readonly EngineArtifactDigest[];
  readonly predecessorEvidenceDigest: string | null;
  readonly algorithmIds: readonly string[];
  readonly claims: VerificationClaimSet;
}

const projectionKeys = Object.freeze([
  "algorithmIds",
  "artifacts",
  "contextId",
  "editionId",
  "operationKind",
  "position",
  "predecessorEvidenceDigest",
  "recordId",
  "schema",
  "sequenceId",
]);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

function validArtifact(
  value: unknown,
  index: number,
): value is EngineArtifactDigest {
  try {
    if (!isPlainRecord(value)) return false;
    const keys = Object.keys(value).sort();
    return (
      keys.length === 3 &&
      keys[0] === "digest" &&
      keys[1] === "kind" &&
      keys[2] === "order" &&
      value.order === index &&
      typeof value.kind === "string" &&
      artifactKinds.has(value.kind) &&
      typeof value.digest === "string" &&
      digestPattern.test(value.digest)
    );
  } catch {
    return false;
  }
}

export function isEngineProfileProjection(
  value: unknown,
): value is EngineProfileProjection {
  try {
    if (!isPlainRecord(value)) return false;
    const algorithmIds = value.algorithmIds;
    const keys = Object.keys(value).sort();
    if (
      keys.length !== projectionKeys.length ||
      keys.some((key, index) => key !== projectionKeys[index]) ||
      value.schema !== ENGINE_PROFILE_SCHEMA ||
      typeof value.contextId !== "string" ||
      !opaquePattern.test(value.contextId) ||
      typeof value.sequenceId !== "string" ||
      !opaquePattern.test(value.sequenceId) ||
      typeof value.recordId !== "string" ||
      !opaquePattern.test(value.recordId) ||
      typeof value.editionId !== "string" ||
      !editionPattern.test(value.editionId) ||
      typeof value.operationKind !== "string" ||
      !operationKinds.has(value.operationKind) ||
      !Number.isSafeInteger(value.position) ||
      (value.position as number) < 0 ||
      (value.position as number) > 1_000_000 ||
      !Array.isArray(value.artifacts) ||
      value.artifacts.length < 1 ||
      value.artifacts.length > 16 ||
      value.artifacts.some(
        (artifact, index) => !validArtifact(artifact, index),
      ) ||
      (value.predecessorEvidenceDigest !== null &&
        (typeof value.predecessorEvidenceDigest !== "string" ||
          !digestPattern.test(value.predecessorEvidenceDigest))) ||
      !Array.isArray(algorithmIds) ||
      algorithmIds.length < 1 ||
      algorithmIds.length > 8 ||
      algorithmIds.some(
        (algorithm, index) =>
          typeof algorithm !== "string" ||
          !algorithmPattern.test(algorithm) ||
          (index > 0 && algorithmIds[index - 1] >= algorithm),
      )
    )
      return false;
    const artifactKindsSeen = new Set(
      value.artifacts.map((artifact) => artifact.kind),
    );
    return artifactKindsSeen.size === value.artifacts.length;
  } catch {
    return false;
  }
}

export function createEngineProfileProjection(
  input: unknown,
): Result<EngineProfileProjection> {
  try {
    if (!isPlainRecord(input))
      return invalid("DIAG-ENGINE-PROJECTION", "domain");
    const inputKeys = Object.keys(input).sort();
    const allowedInputKeys = [
      "algorithmIds",
      "artifacts",
      "claims",
      "contextId",
      "editionId",
      "operationKind",
      "position",
      "predecessorEvidenceDigest",
      "recordId",
      "schema",
      "sequenceId",
    ];
    const requiredInputKeys = allowedInputKeys.filter(
      (key) => key !== "position" && key !== "schema",
    );
    if (
      inputKeys.some((key) => !allowedInputKeys.includes(key)) ||
      requiredInputKeys.some((key) => !inputKeys.includes(key)) ||
      (inputKeys.includes("schema") &&
        input.schema !== ENGINE_PROFILE_SCHEMA) ||
      (inputKeys.includes("position") &&
        (!Number.isSafeInteger(input.position) ||
          (input.position as number) < 0 ||
          (input.position as number) > 1_000_000))
    )
      return invalid("DIAG-ENGINE-PROJECTION", "domain");
    const rawClaims = input.claims as VerificationClaimSet | undefined;
    if (
      !isPlainRecord(rawClaims) ||
      Object.keys(rawClaims).length !== 1 ||
      !Object.hasOwn(rawClaims, "claims")
    )
      return invalid("DIAG-ENGINE-CLAIMS", "domain");
    const parsedClaims = createVerificationClaimSet(rawClaims.claims);
    const official =
      parsedClaims.status === "ok"
        ? getVerificationClaim(parsedClaims.value, "official-format")
        : undefined;
    if (!official || official.status !== "valid")
      return invalid("DIAG-ENGINE-OFFICIAL-CLAIM", "domain");

    const projection: EngineProfileProjection = {
      schema: ENGINE_PROFILE_SCHEMA,
      contextId: input.contextId as string,
      sequenceId: input.sequenceId as string,
      recordId: input.recordId as string,
      editionId: input.editionId as string,
      operationKind:
        input.operationKind as EngineProfileProjection["operationKind"],
      position: (input.position as number | undefined) ?? 0,
      artifacts: Array.isArray(input.artifacts)
        ? (input.artifacts.map((artifact) =>
            isPlainRecord(artifact)
              ? {
                  order: artifact.order,
                  kind: artifact.kind,
                  digest: artifact.digest,
                }
              : artifact,
          ) as EngineArtifactDigest[])
        : (input.artifacts as EngineArtifactDigest[]),
      predecessorEvidenceDigest: input.predecessorEvidenceDigest as
        | string
        | null,
      algorithmIds: Array.isArray(input.algorithmIds)
        ? ([...input.algorithmIds] as string[])
        : (input.algorithmIds as string[]),
    };
    if (!isEngineProfileProjection(projection))
      return invalid("DIAG-ENGINE-PROJECTION", "domain");
    const artifacts = Object.freeze(
      projection.artifacts.map((artifact) => Object.freeze({ ...artifact })),
    );
    return ok(
      Object.freeze({
        ...projection,
        artifacts,
        algorithmIds: Object.freeze([...projection.algorithmIds]),
      }),
    );
  } catch {
    return invalid("DIAG-ENGINE-PROJECTION", "domain");
  }
}

function canonicalJson(value: unknown, depth = 0): string {
  if (depth > 16) throw new TypeError("depth");
  if (value === null || typeof value === "boolean" || typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new TypeError("number");
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalJson(item, depth + 1)).join(",")}]`;
  if (!isPlainRecord(value)) throw new TypeError("object");
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key], depth + 1)}`).join(",")}}`;
}

export function canonicalEngineProfileJson(
  projection: unknown,
): Result<string> {
  if (!isEngineProfileProjection(projection))
    return invalid("DIAG-ENGINE-PROJECTION", "domain");
  try {
    return ok(canonicalJson(projection));
  } catch {
    return invalid("DIAG-ENGINE-PROJECTION", "domain");
  }
}

function engineFailure<T>(): EngineOperationResult<T> {
  return {
    ok: false,
    diagnostics: [
      {
        $schema: DIAGNOSTIC_SCHEMA,
        code: "INPUT_TYPE_INVALID",
        severity: "error",
        phase: "input",
        messageKey: "verifactu.profile.invalid",
      },
    ],
  };
}

export function createEngineNormalizationProfile(): NormalizationProfile<EngineProfileProjection> {
  return Object.freeze({
    id: ENGINE_PROFILE_ID,
    version: ENGINE_PROFILE_VERSION,
    inputKind: "json" as const,
    manifest: ENGINE_PROFILE_MANIFEST,
    validate(input: unknown): EngineOperationResult<EngineProfileProjection> {
      if (!isEngineProfileProjection(input)) return engineFailure();
      return { ok: true, value: input, diagnostics: [] };
    },
    normalize(
      input: EngineProfileProjection,
      sink: { write(value: Uint8Array): void; readonly byteLength: number },
      limits: EngineLimits,
    ): EngineOperationResult<{ readonly byteLength: number }> {
      try {
        const canonical = canonicalEngineProfileJson(input);
        if (canonical.status !== "ok") return engineFailure();
        const bytes = new TextEncoder().encode(canonical.value);
        if (
          bytes.byteLength > limits.maxPayloadBytes ||
          bytes.byteLength > ENGINE_PROFILE_LIMITS.maxPayloadBytes
        )
          return engineFailure();
        sink.write(bytes);
        return {
          ok: true,
          value: Object.freeze({ byteLength: bytes.byteLength }),
          diagnostics: [],
        };
      } catch {
        return engineFailure();
      }
    },
  });
}
