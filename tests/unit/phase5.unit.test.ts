// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildQrPayload,
  canonicalizeXml,
  parseSecureXml,
  renderQr,
  serializeXml,
  validateXadesEnvelope,
  VERIFACTU_SIGNATURE_POLICY,
} from "../../packages/verifactu/src/index.js";

void test("secure XML codec rejects DTDs and is deterministic", () => {
  const unsafe = parseSecureXml("<!DOCTYPE r [<!ENTITY x 'x'>]><r>&x;</r>");
  assert.equal(unsafe.ok, false);
  const parsed = parseSecureXml('<r b="2" a="1">hola &amp; adiós</r>');
  assert.equal(parsed.ok, true);
  assert.ok(parsed.ok);
  assert.equal(
    serializeXml(parsed.value),
    '<?xml version="1.0" encoding="UTF-8"?><r a="1" b="2">hola &amp; adiós</r>',
  );
  assert.deepEqual(
    [...canonicalizeXml(parsed.value)],
    [...new TextEncoder().encode('<r a="1" b="2">hola &amp; adiós</r>')],
  );
});

void test("AEAT QR payload uses the four ordered fields and M correction", () => {
  const payload = buildQrPayload({
    nif: "B12345678",
    invoiceNumber: "F-2026/1",
    issueDate: "05-09-2026",
    total: "120.50",
    environment: "test",
  });
  assert.equal(payload.ok, true);
  assert.ok(payload.ok);
  assert.equal(
    payload.value,
    "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=B12345678&numserie=F-2026%2F1&fecha=05-09-2026&importe=120.50",
  );
  const qr = renderQr({
    nif: "B12345678",
    invoiceNumber: "F-2026/1",
    issueDate: "05-09-2026",
    total: "120.50",
  });
  assert.equal(qr.ok, true);
  assert.ok(qr.ok);
  assert.equal(qr.value.correctionLevel, "M");
});

void test("XAdES structural verifier requires the policy and reference", () => {
  const xml = `<Invoice><Signature><SignedInfo><Reference><DigestValue>abc</DigestValue></Reference></SignedInfo><SignaturePolicyIdentifier>${VERIFACTU_SIGNATURE_POLICY.oid}${VERIFACTU_SIGNATURE_POLICY.uri}</SignaturePolicyIdentifier></Signature></Invoice>`;
  assert.equal(validateXadesEnvelope(new TextEncoder().encode(xml)).ok, true);
});
