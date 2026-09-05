// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "node:test";
import type * as VerifactuApi from "../../packages/verifactu/src/index.js";
type RuntimeApi = typeof VerifactuApi;
const root = process.cwd();
void test("contract metadata is exposed without implicit I/O", async () => {
  // Dynamic loading of the built artifact is intentional; the assertion is the runtime boundary under test.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const imported = (await import(
    `file://${resolve(root, "packages/verifactu/dist/esm/index.js")}`
  )) as unknown as RuntimeApi;
  assert.deepEqual(Object.keys(imported).sort(), [
    "AeatDate",
    "AeatDateTime",
    "DecimalLexeme",
    "MAX_BATCH_RECORDS",
    "Nif",
    "OfficialText",
    "OpaqueId",
    "RrsifFingerprint",
    "VERIFACTU_DIAGNOSTIC_SCHEMA",
    "VERIFACTU_EDITION",
    "VERIFACTU_RECORD_PROFILE_ID",
    "VERIFACTU_RECORD_PROFILE_VERSION",
    "VERIFACTU_SIGNATURE_POLICY",
    "assertCertificateUsable",
    "assertFreshness",
    "buildQrPayload",
    "buildRrsifPreimage",
    "buildSoapRequest",
    "buildSubmissionBatch",
    "calculateRrsifFingerprint",
    "canTransition",
    "canonicalizeXml",
    "commitSecuredRecord",
    "createDssBackend",
    "createInternalRecordEvidence",
    "createOutboxWork",
    "createSignatureRequest",
    "decideRetry",
    "describeCertificate",
    "editionInfo",
    "encodeInternalEvidenceSubject",
    "evaluateApplicability",
    "genesisHead",
    "getEdition",
    "listAeatEndpoints",
    "listEditions",
    "nextHead",
    "parseAeatResponse",
    "parseSecureXml",
    "parseSoapEnvelope",
    "processQueueOnce",
    "renderQr",
    "resolveAeatEndpoint",
    "serializeBillingRecord",
    "serializeXml",
    "transitionRecord",
    "validateBillingRecord",
    "validateBreakdownTotals",
    "validateFingerprintInput",
    "validateXadesEnvelope",
    "verifactuRecordProfile",
    "verifyInternalRecordEvidence",
    "verifyRrsifFingerprint",
  ]);
  const getEdition: unknown = Reflect.get(imported, "getEdition");
  const listEditions: unknown = Reflect.get(imported, "listEditions");
  assert.equal(typeof getEdition, "function");
  assert.equal(typeof listEditions, "function");
  if (typeof getEdition === "function" && typeof listEditions === "function") {
    const editionResult: unknown = Reflect.apply(getEdition, undefined, []);
    Reflect.apply(getEdition, undefined, ["aeat-rrsif-1.0@2026-09-03"]);
    Reflect.apply(getEdition, undefined, ["unknown-edition"]);
    const editionsResult: unknown = Reflect.apply(listEditions, undefined, []);
    assert.equal(typeof editionResult, "object");
    assert.equal(Array.isArray(editionsResult), true);
    if (Array.isArray(editionsResult)) assert.equal(editionsResult.length, 1);
  }
  const fingerprint = imported.validateFingerprintInput({
    kind: "alta",
    issuerNif: "89890001K",
    invoiceNumber: "A-1",
    issueDate: "01-01-2026",
    invoiceType: "F1",
    taxAmount: "21.00",
    totalAmount: "121.00",
    previous: { kind: "genesis" },
    generatedAt: "2026-01-01T00:00:00Z",
  });
  assert.equal(fingerprint.status, "valid");
  const calculated = imported.calculateRrsifFingerprint(fingerprint.value);
  assert.equal(
    imported.verifyRrsifFingerprint(fingerprint.value, calculated.fingerprint.value).status,
    "valid",
  );
  assert.equal(
    imported.evaluateApplicability({
      usesBillingSystem: "yes",
      taxpayerCategory: "corporate-taxpayer",
      territory: "common",
      subjectToSii: "no",
      operationInScope: "yes",
      hasNonApplicationResolution: "no",
    }).status,
    "valid",
  );
  assert.equal(
    imported.validateBreakdownTotals({
      taxAmount: "21.00",
      totalAmount: "121.00",
      lines: [{ baseAmount: "100.00", taxAmount: "21.00", surchargeAmount: "0", regimeCode: "01" }],
    }).status,
    "valid",
  );
  const subject = {
    edition: imported.VERIFACTU_EDITION,
    taxpayerScopeId: "tenant.alpha",
    installationId: "installation.01",
    sequenceId: "sequence.billing.01",
    recordClass: "alta",
    recordId: "record.0001",
    officialFingerprint: "3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60",
    officialBytes: new TextEncoder().encode("<RegistroAlta/>"),
  };
  const evidence = imported.createInternalRecordEvidence(subject);
  assert.equal(evidence.ok, true);
  assert.equal(imported.verifactuRecordProfile.id, imported.VERIFACTU_RECORD_PROFILE_ID);
  assert.equal(imported.OpaqueId.parse("tenant.alpha")?.value, "tenant.alpha");
  assert.equal(imported.OfficialText.parse("ok", 1, 2)?.value, "ok");
  await import(`file://${resolve(root, "packages/cli/dist/esm/main.js")}`);
});
void test("foundation source cannot perform implicit I/O", async () => {
  for (const path of ["packages/verifactu/src/index.ts", "packages/cli/src/main.ts"]) {
    const source = await readFile(resolve(root, path), "utf8");
    assert.doesNotMatch(
      source,
      /node:(?:fs|net|http|https|tls|child_process)|console\.|process\./u,
    );
  }
});
