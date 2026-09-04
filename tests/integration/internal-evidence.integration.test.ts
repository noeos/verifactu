// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  VERIFACTU_EDITION,
  createInternalRecordEvidence,
  encodeInternalEvidenceSubject,
  verifactuRecordProfile,
  verifyInternalRecordEvidence,
} from "../../packages/verifactu/src/evidence/record-profile.js";

const FINGERPRINT = "3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60";

void test("creates deterministic evidence through the public verification-engine API", () => {
  const subject = evidenceSubject(new TextEncoder().encode("<RegistroAlta/>"));
  const first = createInternalRecordEvidence(subject);
  const second = createInternalRecordEvidence(subject);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.value.evidence, second.value.evidence);
  assert.equal(first.value.evidence.algorithm, "sha-256");
  assert.equal(first.value.evidence.profile.id, "es.noeos.verifactu.record");
  assert.equal(verifyInternalRecordEvidence(subject, first.value.evidence).ok, true);
});

void test("internal evidence commits bytes and metadata that RRSIF fingerprint omits", () => {
  const original = evidenceSubject(new TextEncoder().encode("<RegistroAlta a='1'/>"));
  const changed = evidenceSubject(new TextEncoder().encode("<RegistroAlta a='2'/>"));
  const first = createInternalRecordEvidence(original);
  const second = createInternalRecordEvidence(changed);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.notEqual(first.value.evidence.contentDigest, second.value.evidence.contentDigest);
  assert.equal(verifyInternalRecordEvidence(changed, first.value.evidence).ok, false);
});

void test("canonical envelope rejects reordering and trailing data", () => {
  const encoded = encodeInternalEvidenceSubject(
    evidenceSubject(new TextEncoder().encode("<RegistroAlta/>")),
  );
  const trailing = new Uint8Array(encoded.length + 1);
  trailing.set(encoded);
  assert.notDeepEqual(encoded, trailing);
  assert.equal(
    verifactuRecordProfile.validate(trailing, verifactuRecordProfile.manifest.limits).ok,
    false,
  );
});

function evidenceSubject(officialBytes: Uint8Array) {
  return {
    edition: VERIFACTU_EDITION,
    taxpayerScopeId: "tenant.alpha",
    installationId: "installation.01",
    sequenceId: "sequence.billing.01",
    recordClass: "alta" as const,
    recordId: "record.0001",
    officialFingerprint: FINGERPRINT,
    officialBytes,
  };
}
