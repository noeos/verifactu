import { TextEncoder } from "node:util";
import {
  createEngine,
  type ByteSink,
  type Engine,
  type Limits,
  type NormalizationProfile,
  type NormalizationStats,
} from "../ports/verification-engine.js";
import {
  INSTALLED_BUILTIN_PROFILES as BUILTIN_PROFILES,
  INSTALLED_VECTOR_SET as VECTOR_SET,
} from "../ports/verification-engine.js";
import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "../domain/diagnostics.js";
import type { ClaimStatus } from "./claims.js";
import {
  VERIFACTU_EVIDENCE_PROFILE,
  type NoeosEvidenceProjection,
} from "./engine-profile.js";
export { VERIFACTU_EVIDENCE_PROFILE } from "./engine-profile.js";
export type { NoeosEvidenceProjection } from "./engine-profile.js";

export const VERIFACTU_ENGINE_ADMISSION = Object.freeze({
  name: "@noeos/verification-engine",
  version: "1.0.1",
  integrity:
    "sha512-x6BXhKZt2NejyTK8UOvUDe5oZKYAmCNFG2w5NszT167juFwPcNb4rdS//oey4k912XNRAN9aN25Y4aTxHciHnQ==",
  builtInProfiles: Object.freeze([
    Object.freeze({
      id: "dev.noeos.raw-bytes",
      version: "1.0.0",
      inputKind: "bytes",
    }),
    Object.freeze({ id: "dev.noeos.jcs", version: "1.0.0", inputKind: "json" }),
  ]),
  vectorSet: Object.freeze({
    version: "1.0.0",
    protocolVersion: 1,
    manifestSha256:
      "4faabc5d16a7920b2caf5fcaeee8fbb46cc9ae680d46b7aabdd3504e51b2335a",
    files: Object.freeze([
      Object.freeze({
        path: "evidence.json",
        sha256:
          "b4e3b4a38f67e7489eafb05528fd309ee931db66e1a0c230ffbd0e103db1f032",
      }),
      Object.freeze({
        path: "framing.json",
        sha256:
          "bacc590419dcee44ad0fa3e707d00a9bf322ac51243efc0a0418821fc6c92ea8",
      }),
      Object.freeze({
        path: "hashing.json",
        sha256:
          "8722eba9ec01c80bdfa5f08fe13bc4c010b4712f61f417e5e2f748a8cbad44b3",
      }),
      Object.freeze({
        path: "invalid.json",
        sha256:
          "05d098aa80412ce8d85aafea1b4ce4add53381e2fe4a4cda1cad88d9fa286fa6",
      }),
    ]),
  }),
});

export interface NoeosEvidenceAdapter {
  readonly profile: typeof VERIFACTU_EVIDENCE_PROFILE;
  readonly engineAdmission: typeof VERIFACTU_ENGINE_ADMISSION;
}

const ENGINE_BY_ADAPTER = new WeakMap<NoeosEvidenceAdapter, Engine>();

const PROFILE = Object.freeze({
  id: VERIFACTU_EVIDENCE_PROFILE.id,
  version: VERIFACTU_EVIDENCE_PROFILE.version,
  inputKind: "json",
  manifest: Object.freeze({
    name: VERIFACTU_EVIDENCE_PROFILE.id,
    version: VERIFACTU_EVIDENCE_PROFILE.version,
    vectorSha256: VERIFACTU_EVIDENCE_PROFILE.vectorSha256,
    limits: Object.freeze({
      maxPayloadBytes: 65_536,
      maxJsonDepth: 8,
      maxObjectProperties: 32,
      maxArrayElements: 64,
      maxStringBytes: 4096,
      maxNdjsonLineBytes: 65_536,
      maxDiagnostics: 16,
      maxFullRecords: 64,
    }),
    license: "Apache-2.0",
  }),
  validate: validateProjection,
  normalize: normalizeProjection,
});

export function createNoeosEvidenceAdapter(): OperationResult<NoeosEvidenceAdapter> {
  if (!sameInstalledEngine())
    return failed("unavailable", [
      diagnostic("DIAG-ENGINE-IDENTITY", "availability", "edition", "/engine"),
    ]);
  try {
    const engine = createEngine({
      profiles: [
        PROFILE as unknown as NormalizationProfile<NoeosEvidenceProjection>,
      ],
      limits: PROFILE.manifest.limits,
    });
    return succeeded(adapterFor(engine));
  } catch {
    return failed("unavailable", [
      diagnostic(
        "DIAG-ENGINE-UNAVAILABLE",
        "availability",
        "edition",
        "/engine",
      ),
    ]);
  }
}

/** Internal fault-injection seam; deliberately not re-exported from the package root. */
export function createNoeosEvidenceAdapterWithEngineForTesting(
  engine: Engine,
): OperationResult<NoeosEvidenceAdapter> {
  return succeeded(adapterFor(engine));
}

export function buildNoeosEvidence(
  adapter: NoeosEvidenceAdapter,
  projection: NoeosEvidenceProjection,
): OperationResult<unknown> {
  const checked = validateProjection(projection, PROFILE.manifest.limits);
  if (!checked.ok)
    return failed("invalid", [
      diagnostic("DIAG-ENGINE-PROJECTION", "input", "structure", "/evidence"),
    ]);
  try {
    const engine = ENGINE_BY_ADAPTER.get(adapter);
    if (engine === undefined)
      return failed("unavailable", [
        diagnostic(
          "DIAG-ENGINE-UNAVAILABLE",
          "availability",
          "edition",
          "/engine",
        ),
      ]);
    const result = engine.hashRecord({
      contextId: checked.value.contextId,
      recordId: checked.value.recordId,
      payload: checked.value,
      profile: { id: adapter.profile.id, version: adapter.profile.version },
      algorithm: "sha-256",
    });
    return result.ok
      ? succeeded(result.value)
      : failed("unavailable", [
          diagnostic("DIAG-ENGINE-HASH", "integrity", "structure", "/evidence"),
        ]);
  } catch {
    return failed("unavailable", [
      diagnostic("DIAG-ENGINE-HASH", "availability", "edition", "/engine"),
    ]);
  }
}

export function verifyNoeosEvidence(
  adapter: NoeosEvidenceAdapter,
  projection: NoeosEvidenceProjection,
  evidence: unknown,
): OperationResult<ClaimStatus> {
  try {
    const engine = ENGINE_BY_ADAPTER.get(adapter);
    if (engine === undefined) return succeeded("unavailable");
    const result = engine.verifyRecord({
      payload: projection,
      evidence,
    });
    switch (result.status) {
      case "valid":
      case "invalid":
      case "indeterminate":
        return succeeded(result.status);
      case "aborted":
      default:
        return succeeded("unavailable");
    }
  } catch {
    return succeeded("unavailable");
  }
}

function adapterFor(engine: Engine): NoeosEvidenceAdapter {
  const adapter = Object.freeze({
    profile: VERIFACTU_EVIDENCE_PROFILE,
    engineAdmission: VERIFACTU_ENGINE_ADMISSION,
  });
  ENGINE_BY_ADAPTER.set(adapter, engine);
  return adapter;
}

function sameInstalledEngine(): boolean {
  const profiles = BUILTIN_PROFILES;
  const expected = VERIFACTU_ENGINE_ADMISSION.builtInProfiles;
  if (profiles.length !== expected.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    const actual = profiles[index];
    const pinned = expected[index];
    if (
      actual?.id !== pinned?.id ||
      actual?.version !== pinned?.version ||
      actual?.inputKind !== pinned?.inputKind
    )
      return false;
  }
  const vectors = VECTOR_SET;
  if (
    vectors.version !== VERIFACTU_ENGINE_ADMISSION.vectorSet.version ||
    vectors.protocolVersion !== 1 ||
    vectors.files.length !== 4
  )
    return false;
  return vectors.files.every((file, index) => {
    const pinned = VERIFACTU_ENGINE_ADMISSION.vectorSet.files[index];
    return file.path === pinned?.path && file.sha256 === pinned?.sha256;
  });
}

function validateProjection(
  value: unknown,
  limits: Limits,
):
  | {
      readonly ok: true;
      readonly value: NoeosEvidenceProjection;
      readonly diagnostics: readonly [];
    }
  | { readonly ok: false; readonly diagnostics: readonly [] } {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return invalid();
  let candidate: Partial<NoeosEvidenceProjection>;
  try {
    if (Object.getPrototypeOf(value) !== Object.prototype) return invalid();
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Object.keys(descriptors).sort();
    const expected = [
      "algorithm",
      "contextId",
      "editionId",
      "officialArtifactDigests",
      "operation",
      "previousEvidenceDigest",
      "recordId",
      "sequenceId",
    ].sort();
    if (
      keys.length !== expected.length ||
      keys.some((key, index) => key !== expected[index])
    )
      return invalid();
    if (
      Object.values(descriptors).some(
        (descriptor) => !("value" in descriptor) || !descriptor.enumerable,
      )
    )
      return invalid();
    candidate = Object.fromEntries(
      keys.map((key) => [key, descriptors[key]?.value]),
    ) as Partial<NoeosEvidenceProjection>;
  } catch {
    return invalid();
  }
  const ids = [
    candidate.contextId,
    candidate.sequenceId,
    candidate.recordId,
    candidate.editionId,
  ];
  if (
    ids.some(
      (id) =>
        typeof id !== "string" ||
        !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,126}[A-Za-z0-9]$/u.test(id),
    )
  )
    return invalid();
  if (
    !(
      ["alta", "anulacion", "subsanacion", "sustitucion"] as unknown[]
    ).includes(candidate.operation)
  )
    return invalid();
  if (
    candidate.algorithm !== "sha-256" ||
    !Array.isArray(candidate.officialArtifactDigests)
  )
    return invalid();
  const digests = copyDigests(
    candidate.officialArtifactDigests,
    Math.min(64, limits.maxArrayElements),
  );
  if (digests === null) return invalid();
  if (
    candidate.previousEvidenceDigest !== null &&
    (typeof candidate.previousEvidenceDigest !== "string" ||
      !/^[a-f0-9]{64}$/u.test(candidate.previousEvidenceDigest))
  )
    return invalid();
  return {
    ok: true,
    value: Object.freeze({
      contextId: candidate.contextId!,
      sequenceId: candidate.sequenceId!,
      recordId: candidate.recordId!,
      editionId: candidate.editionId!,
      operation: candidate.operation as NoeosEvidenceProjection["operation"],
      officialArtifactDigests: digests,
      previousEvidenceDigest: candidate.previousEvidenceDigest!,
      algorithm: "sha-256",
    }),
    diagnostics: [],
  };
}

function copyDigests(
  value: readonly string[],
  maximum: number,
): readonly string[] | null {
  try {
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      value.length === 0 ||
      value.length > maximum
    )
      return null;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const copied: string[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        descriptor === undefined ||
        !("value" in descriptor) ||
        !descriptor.enumerable ||
        typeof descriptor.value !== "string" ||
        !/^[a-f0-9]{64}$/u.test(descriptor.value)
      )
        return null;
      copied.push(descriptor.value);
    }
    if (Reflect.ownKeys(descriptors).length !== value.length + 1) return null;
    return Object.freeze(copied);
  } catch {
    return null;
  }
}

function normalizeProjection(
  value: NoeosEvidenceProjection,
  sink: ByteSink,
  limits: Limits,
):
  | {
      readonly ok: true;
      readonly value: NormalizationStats;
      readonly diagnostics: readonly [];
    }
  | { readonly ok: false; readonly diagnostics: readonly [] } {
  const text = JSON.stringify({
    contextId: value.contextId,
    sequenceId: value.sequenceId,
    recordId: value.recordId,
    editionId: value.editionId,
    operation: value.operation,
    officialArtifactDigests: value.officialArtifactDigests,
    previousEvidenceDigest: value.previousEvidenceDigest,
    algorithm: value.algorithm,
  });
  const bytes = new TextEncoder().encode(text);
  if (bytes.byteLength > limits.maxPayloadBytes) return invalid();
  sink.write(bytes);
  return {
    ok: true,
    value: Object.freeze({ byteLength: bytes.byteLength }),
    diagnostics: [],
  };
}

function invalid(): { readonly ok: false; readonly diagnostics: readonly [] } {
  return { ok: false, diagnostics: [] };
}
