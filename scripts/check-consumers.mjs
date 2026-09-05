// SPDX-License-Identifier: Apache-2.0
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { assertProjectRoot, projectRoot } from "./project.mjs";
await assertProjectRoot();
const esm = await import(`file://${resolve(projectRoot, "packages/verifactu/dist/esm/index.js")}`);
const require = createRequire(import.meta.url);
const common = require(resolve(projectRoot, "packages/verifactu/dist/cjs/index.js"));
const expected = [
  "AeatDate",
  "AeatDateTime",
  "DecimalLexeme",
  "Nif",
  "OpaqueId",
  "OfficialText",
  "RrsifFingerprint",
  "VERIFACTU_DIAGNOSTIC_SCHEMA",
  "VERIFACTU_EDITION",
  "VERIFACTU_RECORD_PROFILE_ID",
  "VERIFACTU_RECORD_PROFILE_VERSION",
  "VERIFACTU_SIGNATURE_POLICY",
  "assertCertificateUsable",
  "buildQrPayload",
  "buildRrsifPreimage",
  "calculateRrsifFingerprint",
  "canonicalizeXml",
  "createDssBackend",
  "createInternalRecordEvidence",
  "createSignatureRequest",
  "describeCertificate",
  "editionInfo",
  "encodeInternalEvidenceSubject",
  "evaluateApplicability",
  "getEdition",
  "listEditions",
  "parseSecureXml",
  "renderQr",
  "serializeBillingRecord",
  "serializeXml",
  "validateBillingRecord",
  "validateBreakdownTotals",
  "validateFingerprintInput",
  "validateXadesEnvelope",
  "verifactuRecordProfile",
  "verifyInternalRecordEvidence",
  "verifyRrsifFingerprint",
].sort();
if (
  JSON.stringify(Object.keys(esm).sort()) !== JSON.stringify(expected) ||
  JSON.stringify(Object.keys(common).sort()) !== JSON.stringify(expected)
)
  throw new Error("Generated edition API differs between ESM and CommonJS.");
await import(`file://${resolve(projectRoot, "packages/verifactu/dist/esm/editions.js")}`);
await import(`file://${resolve(projectRoot, "packages/verifactu/dist/esm/schemas.js")}`);
await import(`file://${resolve(projectRoot, "packages/verifactu/dist/esm/catalogs.js")}`);
await import(`file://${resolve(projectRoot, "packages/cli/dist/esm/main.js")}`);
console.log("Clean consumer checks passed.");
