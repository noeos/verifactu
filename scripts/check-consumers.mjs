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
  "MAX_BATCH_RECORDS",
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
].sort();
const commonKeys = Object.keys(common).filter(
  (key) => !["__esModule", "default", "module.exports"].includes(key),
);
if (
  JSON.stringify(Object.keys(esm).sort()) !== JSON.stringify(expected) ||
  JSON.stringify(commonKeys.sort()) !== JSON.stringify(expected)
)
  throw new Error("Generated edition API differs between ESM and CommonJS.");
await import(`file://${resolve(projectRoot, "packages/verifactu/dist/esm/editions.js")}`);
await import(`file://${resolve(projectRoot, "packages/verifactu/dist/esm/schemas.js")}`);
await import(`file://${resolve(projectRoot, "packages/verifactu/dist/esm/catalogs.js")}`);
await import(`file://${resolve(projectRoot, "packages/verifactu/dist/esm/state/index.js")}`);
await import(`file://${resolve(projectRoot, "packages/verifactu/dist/esm/submissions/index.js")}`);
await import(`file://${resolve(projectRoot, "packages/verifactu/dist/esm/transport/index.js")}`);
await import(`file://${resolve(projectRoot, "packages/verifactu/dist/esm/application/index.js")}`);
await import(`file://${resolve(projectRoot, "packages/verifactu/dist/esm/outbox/index.js")}`);
await import(`file://${resolve(projectRoot, "packages/cli/dist/esm/main.js")}`);
console.log("Clean consumer checks passed.");
