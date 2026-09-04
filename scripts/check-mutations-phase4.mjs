// SPDX-License-Identifier: Apache-2.0
import {
  createInternalRecordEvidence,
  verifyInternalRecordEvidence,
} from "../packages/verifactu/dist/esm/evidence/record-profile.js";
import {
  calculateRrsifFingerprint,
  validateFingerprintInput,
  verifyRrsifFingerprint,
} from "../packages/verifactu/dist/esm/fingerprint/rrsif.js";
import { assertProjectRoot } from "./project.mjs";

await assertProjectRoot();
const base = {
  kind: "alta",
  issuerNif: "89890001K",
  invoiceNumber: "A-1",
  issueDate: "01-01-2026",
  invoiceType: "F1",
  taxAmount: "21.00",
  totalAmount: "121.00",
  previous: { kind: "genesis" },
  generatedAt: "2026-01-01T00:00:00Z",
};
const expected = calculate(base);
const mutations = [
  { ...base, issuerNif: "89890002E" },
  { ...base, invoiceNumber: "A-2" },
  { ...base, issueDate: "02-01-2026" },
  { ...base, invoiceType: "F2" },
  { ...base, taxAmount: "22.00" },
  { ...base, totalAmount: "122.00" },
  { ...base, generatedAt: "2026-01-01T00:00:01Z" },
];
for (const mutation of mutations) {
  if (calculate(mutation) === expected) throw new Error("Critical fingerprint mutant survived.");
}
if (verifyRrsifFingerprint(baseInput(base), expected.toLowerCase()).status !== "invalid")
  throw new Error("Lowercase hash mutant survived.");
const subject = {
  edition: "aeat-rrsif-1.0@2026-09-03",
  taxpayerScopeId: "tenant.alpha",
  installationId: "installation.01",
  sequenceId: "sequence.billing.01",
  recordClass: "alta",
  recordId: "record.0001",
  officialFingerprint: expected,
  officialBytes: new TextEncoder().encode("<RegistroAlta/>"),
};
const evidence = createInternalRecordEvidence(subject);
if (!evidence.ok) throw new Error("Mutation fixture evidence could not be created.");
const tampered = new Uint8Array(subject.officialBytes);
tampered[0] = tampered[0] === 60 ? 62 : 60;
if (
  verifyInternalRecordEvidence({ ...subject, officialBytes: tampered }, evidence.value.evidence).ok
)
  throw new Error("Evidence payload mutation survived.");
console.log(`Phase 4 mutation gate passed: ${mutations.length + 2} critical mutants killed.`);

function baseInput(input) {
  const result = validateFingerprintInput(input);
  if (result.status !== "valid") throw new Error("Mutation fixture rejected.");
  return result.value;
}

function calculate(input) {
  return calculateRrsifFingerprint(baseInput(input)).fingerprint.value;
}
