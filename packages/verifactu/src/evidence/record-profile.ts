// SPDX-License-Identifier: Apache-2.0

import { types } from "node:util";
import {
  DIAGNOSTIC_SCHEMA as ENGINE_DIAGNOSTIC_SCHEMA,
  createEngine,
  type ByteSink,
  type Limits,
  type NormalizationProfile,
  type NormalizationStats,
  type OperationResult as EngineOperationResult,
  type RecordEvidence,
} from "@noeos/verification-engine";
import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";
import { OpaqueId, RrsifFingerprint } from "../domain/values.js";
import { inspectExactObject, isValidUnicode } from "../validation/object-inspection.js";

export const VERIFACTU_RECORD_PROFILE_ID = "es.noeos.verifactu.record" as const;
export const VERIFACTU_RECORD_PROFILE_VERSION = "1.0.0" as const;
export const VERIFACTU_EDITION = "aeat-rrsif-1.0@2026-09-03" as const;

const MAGIC = Buffer.from("NOEOS-VERIFACTU-RECORD\0", "ascii");
const PROFILE_VECTOR_SHA256 = "9b9c70e7d5cc10ec5b756ec8142dfb07a2ebd7b849d22f0b109572265951f90d";
const MAX_OFFICIAL_BYTES = 1_048_576;
const FIELD_COUNT = 8;

const PROFILE_LIMITS: Limits = Object.freeze({
  maxPayloadBytes: 2_097_152,
  maxJsonDepth: 8,
  maxObjectProperties: 16,
  maxArrayElements: 16,
  maxStringBytes: 1_048_576,
  maxNdjsonLineBytes: 2_097_152,
  maxDiagnostics: 64,
  maxFullRecords: 1_000_000,
});

export type InternalRecordClass = "alta" | "anulacion" | "event";

export interface InternalEvidenceSubject {
  readonly edition: typeof VERIFACTU_EDITION;
  readonly taxpayerScopeId: string;
  readonly installationId: string;
  readonly sequenceId: string;
  readonly recordClass: InternalRecordClass;
  readonly recordId: string;
  readonly officialFingerprint: string;
  readonly officialBytes: Uint8Array;
}

export interface InternalRecordEvidence {
  readonly evidence: RecordEvidence;
  readonly profile: Readonly<{
    readonly id: typeof VERIFACTU_RECORD_PROFILE_ID;
    readonly version: typeof VERIFACTU_RECORD_PROFILE_VERSION;
  }>;
}

export const verifactuRecordProfile: NormalizationProfile<Uint8Array> = Object.freeze({
  id: VERIFACTU_RECORD_PROFILE_ID,
  version: VERIFACTU_RECORD_PROFILE_VERSION,
  inputKind: "bytes",
  manifest: Object.freeze({
    name: VERIFACTU_RECORD_PROFILE_ID,
    version: VERIFACTU_RECORD_PROFILE_VERSION,
    vectorSha256: PROFILE_VECTOR_SHA256,
    limits: PROFILE_LIMITS,
    license: "Apache-2.0",
  }),
  validate(input: unknown, limits: Limits): EngineOperationResult<Uint8Array> {
    if (
      types.isProxy(input) ||
      !(input instanceof Uint8Array) ||
      input.buffer instanceof SharedArrayBuffer ||
      input.byteLength > limits.maxPayloadBytes
    ) {
      return engineFailure("INPUT_TYPE_INVALID", "input");
    }
    const copy = new Uint8Array(input);
    return parseEnvelope(copy)
      ? engineSuccess(copy)
      : engineFailure("NORMALIZATION_FAILED", "normalization");
  },
  normalize(
    input: Uint8Array,
    sink: ByteSink,
    limits: Limits,
  ): EngineOperationResult<NormalizationStats> {
    if (input.byteLength > limits.maxPayloadBytes || !parseEnvelope(input)) {
      return engineFailure("NORMALIZATION_FAILED", "normalization");
    }
    sink.write(input);
    return engineSuccess(Object.freeze({ byteLength: input.byteLength }));
  },
});

export function createInternalRecordEvidence(input: unknown): Result<InternalRecordEvidence> {
  const subject = parseSubject(input);
  if (subject === undefined) {
    return failure("INVALID_INPUT", [
      createDiagnostic({
        code: "VF_EVIDENCE_INPUT_INVALID",
        severity: "error",
        phase: "evidence",
      }),
    ]);
  }
  const payload = encodeSubject(subject);
  const engine = createEngine({ profiles: [verifactuRecordProfile], limits: PROFILE_LIMITS });
  const result = engine.hashRecord({
    contextId: subject.taxpayerScopeId,
    recordId: subject.recordId,
    payload,
    profile: { id: VERIFACTU_RECORD_PROFILE_ID, version: VERIFACTU_RECORD_PROFILE_VERSION },
    algorithm: "sha-256",
  });
  if (!result.ok) {
    return failure(
      "INTERNAL_EVIDENCE_FAILED",
      result.diagnostics.map((diagnostic) =>
        createDiagnostic({
          code: "VF_EVIDENCE_ENGINE_REJECTED",
          severity: diagnostic.severity,
          phase: "evidence",
          engineCode: diagnostic.code,
        }),
      ),
    );
  }
  return success(
    Object.freeze({
      evidence: result.value,
      profile: Object.freeze({
        id: VERIFACTU_RECORD_PROFILE_ID,
        version: VERIFACTU_RECORD_PROFILE_VERSION,
      }),
    }),
  );
}

export function verifyInternalRecordEvidence(
  input: unknown,
  evidence: unknown,
): Result<InternalRecordEvidence> {
  const subject = parseSubject(input);
  if (subject === undefined) {
    return failure("INVALID_INPUT", [
      createDiagnostic({
        code: "VF_EVIDENCE_INPUT_INVALID",
        severity: "error",
        phase: "evidence",
      }),
    ]);
  }
  const engine = createEngine({ profiles: [verifactuRecordProfile], limits: PROFILE_LIMITS });
  const result = engine.verifyRecord({ payload: encodeSubject(subject), evidence });
  if (result.status !== "valid" || result.evidence === undefined) {
    return failure(
      "INTERNAL_EVIDENCE_FAILED",
      result.diagnostics.length === 0
        ? [
            createDiagnostic({
              code: "VF_EVIDENCE_MISMATCH",
              severity: "error",
              phase: "evidence",
            }),
          ]
        : result.diagnostics.map((diagnostic) =>
            createDiagnostic({
              code: "VF_EVIDENCE_MISMATCH",
              severity: diagnostic.severity,
              phase: "evidence",
              engineCode: diagnostic.code,
            }),
          ),
    );
  }
  return success(
    Object.freeze({
      evidence: result.evidence,
      profile: Object.freeze({
        id: VERIFACTU_RECORD_PROFILE_ID,
        version: VERIFACTU_RECORD_PROFILE_VERSION,
      }),
    }),
  );
}

export function encodeInternalEvidenceSubject(input: InternalEvidenceSubject): Uint8Array {
  const subject = parseSubject(input);
  if (subject === undefined) throw new TypeError("invalid internal evidence subject");
  return encodeSubject(subject);
}

function parseSubject(input: unknown): InternalEvidenceSubject | undefined {
  const object = inspectExactObject(input, [
    "edition",
    "taxpayerScopeId",
    "installationId",
    "sequenceId",
    "recordClass",
    "recordId",
    "officialFingerprint",
    "officialBytes",
  ]);
  if (!object.ok || object.value["edition"] !== VERIFACTU_EDITION) return undefined;
  const taxpayerScope = OpaqueId.parse(object.value["taxpayerScopeId"]);
  const installation = OpaqueId.parse(object.value["installationId"]);
  const sequence = OpaqueId.parse(object.value["sequenceId"]);
  const record = OpaqueId.parse(object.value["recordId"]);
  const fingerprint = RrsifFingerprint.parse(object.value["officialFingerprint"]);
  const bytes = object.value["officialBytes"];
  if (
    taxpayerScope === undefined ||
    installation === undefined ||
    sequence === undefined ||
    record === undefined ||
    fingerprint === undefined ||
    !isRecordClass(object.value["recordClass"]) ||
    types.isProxy(bytes) ||
    !(bytes instanceof Uint8Array) ||
    bytes.buffer instanceof SharedArrayBuffer ||
    bytes.byteLength === 0 ||
    bytes.byteLength > MAX_OFFICIAL_BYTES
  ) {
    return undefined;
  }
  return Object.freeze({
    edition: VERIFACTU_EDITION,
    taxpayerScopeId: taxpayerScope.value,
    installationId: installation.value,
    sequenceId: sequence.value,
    recordClass: object.value["recordClass"],
    recordId: record.value,
    officialFingerprint: fingerprint.value,
    officialBytes: new Uint8Array(bytes),
  });
}

function encodeSubject(input: InternalEvidenceSubject): Uint8Array {
  const values: readonly Uint8Array[] = Object.freeze([
    utf8(input.edition),
    utf8(input.taxpayerScopeId),
    utf8(input.installationId),
    utf8(input.sequenceId),
    utf8(input.recordClass),
    utf8(input.recordId),
    utf8(input.officialFingerprint),
    new Uint8Array(input.officialBytes),
  ]);
  const total = MAGIC.length + 2 + values.reduce((size, value) => size + 5 + value.length, 0);
  const output = new Uint8Array(total);
  output.set(MAGIC, 0);
  let offset = MAGIC.length;
  output[offset] = 1;
  output[offset + 1] = FIELD_COUNT;
  offset += 2;
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === undefined) throw new Error("unreachable evidence field");
    output[offset] = index + 1;
    writeUint32(output, offset + 1, value.length);
    output.set(value, offset + 5);
    offset += 5 + value.length;
  }
  return output;
}

function parseEnvelope(input: Uint8Array): boolean {
  if (input.length < MAGIC.length + 2 || !samePrefix(input, MAGIC)) return false;
  let offset = MAGIC.length;
  if (input[offset] !== 1 || input[offset + 1] !== FIELD_COUNT) return false;
  offset += 2;
  for (let tag = 1; tag <= FIELD_COUNT; tag += 1) {
    if (offset + 5 > input.length || input[offset] !== tag) return false;
    const length = readUint32(input, offset + 1);
    offset += 5;
    if (length > input.length - offset) return false;
    const value = input.subarray(offset, offset + length);
    if (tag < FIELD_COUNT) {
      const text = decodeUtf8(value);
      if (text === undefined || text.length === 0) return false;
    } else if (value.length === 0 || value.length > MAX_OFFICIAL_BYTES) return false;
    offset += length;
  }
  return offset === input.length;
}

function engineSuccess<T>(value: T): EngineOperationResult<T> {
  return Object.freeze({ ok: true, value, diagnostics: Object.freeze([]) });
}

function engineFailure<T>(
  code: "INPUT_TYPE_INVALID" | "NORMALIZATION_FAILED",
  phase: "input" | "normalization",
): EngineOperationResult<T> {
  return Object.freeze({
    ok: false,
    diagnostics: Object.freeze([
      Object.freeze({
        $schema: ENGINE_DIAGNOSTIC_SCHEMA,
        code,
        severity: "error",
        phase,
        messageKey: `diagnostic.${code}`,
      }),
    ]),
  });
}

function utf8(value: string): Uint8Array {
  if (!isValidUnicode(value)) throw new TypeError("invalid Unicode");
  return Buffer.from(value, "utf8");
}

function decodeUtf8(value: Uint8Array): string | undefined {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(value);
  } catch {
    return undefined;
  }
}

function samePrefix(input: Uint8Array, prefix: Uint8Array): boolean {
  if (input.length < prefix.length) return false;
  for (let index = 0; index < prefix.length; index += 1) {
    if (input[index] !== prefix[index]) return false;
  }
  return true;
}

function writeUint32(output: Uint8Array, offset: number, value: number): void {
  output[offset] = (value >>> 24) & 0xff;
  output[offset + 1] = (value >>> 16) & 0xff;
  output[offset + 2] = (value >>> 8) & 0xff;
  output[offset + 3] = value & 0xff;
}

function readUint32(input: Uint8Array, offset: number): number {
  const a = input[offset];
  const b = input[offset + 1];
  const c = input[offset + 2];
  const d = input[offset + 3];
  if (a === undefined || b === undefined || c === undefined || d === undefined) return 0xffffffff;
  return a * 0x1000000 + b * 0x10000 + c * 0x100 + d;
}

function isRecordClass(value: unknown): value is InternalRecordClass {
  return value === "alta" || value === "anulacion" || value === "event";
}
