// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import { type ByteSink, type Limits } from "@noeos/verification-engine";
import { evaluateApplicability } from "../../packages/verifactu/src/domain/applicability.js";
import {
  AeatDate,
  AeatDateTime,
  DecimalLexeme,
  Nif,
  OfficialText,
  OpaqueId,
} from "../../packages/verifactu/src/domain/values.js";
import {
  createInternalRecordEvidence,
  encodeInternalEvidenceSubject,
  verifactuRecordProfile,
  VERIFACTU_EDITION,
} from "../../packages/verifactu/src/evidence/record-profile.js";
import { validateFingerprintInput } from "../../packages/verifactu/src/fingerprint/rrsif.js";
import {
  inspectExactObject,
  inspectJsonLike,
} from "../../packages/verifactu/src/validation/object-inspection.js";

const LIMITS: Limits = Object.freeze({
  maxPayloadBytes: 2_097_152,
  maxJsonDepth: 8,
  maxObjectProperties: 16,
  maxArrayElements: 16,
  maxStringBytes: 1_048_576,
  maxNdjsonLineBytes: 2_097_152,
  maxDiagnostics: 64,
  maxFullRecords: 1_000_000,
});

void test("exercises all fingerprint variants and rejects malformed discriminators", () => {
  const event = {
    kind: "event",
    producer: { kind: "nif", nif: "89890001K" },
    systemId: "A1",
    version: "1.0",
    installationNumber: "installation.01",
    taxpayerNif: "89890001K",
    eventType: "01",
    previous: { kind: "genesis" },
    generatedAt: "2026-01-01T00:00:00Z",
  };
  assert.equal(validateFingerprintInput(event).status, "valid");
  assert.equal(
    validateFingerprintInput({ ...event, producer: { kind: "other", id: "OTHER" } }).status,
    "valid",
  );
  for (const malformed of [
    { ...event, systemId: "a1" },
    { ...event, systemId: "A" },
    { ...event, eventType: "11" },
    { ...event, previous: { kind: "previous", fingerprint: "bad" } },
    { ...event, previous: { kind: "genesis", fingerprint: "unexpected" } },
    { ...event, producer: { kind: "nif", nif: "89890001K", id: "x" } },
    { ...event, producer: { kind: "other", id: "OTHER", nif: "89890001K" } },
    { ...event, producer: { kind: "unknown" } },
    { ...event, generatedAt: "2026-01-01T00:00:00+15:00" },
  ]) {
    assert.equal(validateFingerprintInput(malformed).status, "invalid");
  }
  assert.equal(validateFingerprintInput({ kind: "unknown" }).status, "invalid");
  assert.equal(validateFingerprintInput(null).status, "invalid");
});

void test("exercises value-object boundaries and applicability indeterminate input", () => {
  assert.equal(Nif.parse(1), undefined);
  assert.equal(AeatDate.parse("01-13-2026"), undefined);
  assert.equal(AeatDateTime.parse("bad"), undefined);
  assert.equal(AeatDateTime.parse("2026-01-01T00:00:00+14:01"), undefined);
  assert.ok(DecimalLexeme.parse("-0"));
  assert.equal(OfficialText.parse("a\ud800", 1, 4), undefined);
  assert.equal(OfficialText.parse(" a ", 1, 4), undefined);
  assert.equal(OpaqueId.parse("bad id"), undefined);
  assert.equal(evaluateApplicability({}).status, "indeterminate");
  assert.equal(
    evaluateApplicability({
      usesBillingSystem: "maybe",
      taxpayerCategory: "unknown",
      territory: "unknown",
      subjectToSii: "unknown",
      operationInScope: "unknown",
      hasNonApplicationResolution: "unknown",
    }).status,
    "indeterminate",
  );
});

void test("profile boundary rejects malformed envelopes and accepts a normalized one", () => {
  const valid = encodeInternalEvidenceSubject({
    edition: VERIFACTU_EDITION,
    taxpayerScopeId: "tenant.alpha",
    installationId: "installation.01",
    sequenceId: "sequence.billing.01",
    recordClass: "event",
    recordId: "record.0001",
    officialFingerprint: "3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60",
    officialBytes: new TextEncoder().encode("<Evento/>"),
  });
  const sinkBytes: number[] = [];
  const sink: ByteSink = {
    get byteLength() {
      return sinkBytes.length;
    },
    write(bytes) {
      sinkBytes.push(...bytes);
    },
  };
  assert.equal(verifactuRecordProfile.validate(valid, LIMITS).ok, true);
  assert.equal(verifactuRecordProfile.normalize(valid, sink, LIMITS).ok, true);
  assert.equal(sinkBytes.length, valid.length);
  for (const malformed of [
    new Uint8Array(),
    new TextEncoder().encode("not-an-envelope"),
    new Uint8Array([0, ...valid.slice(1)]),
  ]) {
    assert.equal(verifactuRecordProfile.validate(malformed, LIMITS).ok, false);
    assert.equal(verifactuRecordProfile.normalize(malformed, sink, LIMITS).ok, false);
  }
  assert.equal(verifactuRecordProfile.validate("x", LIMITS).ok, false);
  assert.equal(createInternalRecordEvidence({}).ok, false);
});

void test("inspection rejects pollution keys and unsafe primitive values", () => {
  assert.equal(inspectJsonLike({ __proto__: { polluted: true } }).ok, false);
  const pollution: Record<string, unknown> = {};
  Object.defineProperty(pollution, "__proto__", { value: "blocked", enumerable: true });
  assert.equal(inspectJsonLike(pollution).ok, false);
  assert.equal(inspectJsonLike(Number.NaN).ok, false);
  assert.equal(inspectJsonLike(1.5).ok, false);
  assert.equal(inspectJsonLike(1).ok, true);
  assert.equal(inspectExactObject({ required: 1 }, ["missing"]).ok, false);
});
