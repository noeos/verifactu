// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  buildRrsifPreimage,
  calculateRrsifFingerprint,
  validateFingerprintInput,
} from "../packages/verifactu/dist/esm/fingerprint/rrsif.js";
import {
  createInternalRecordEvidence,
  encodeInternalEvidenceSubject,
  verifactuRecordProfile,
} from "../packages/verifactu/dist/esm/evidence/record-profile.js";
import { assertProjectRoot, projectRoot, readJson } from "./project.mjs";

await assertProjectRoot();
const directory = resolve(projectRoot, "vectors");
const manifest = await readJson(resolve(directory, "manifest.json"));
for (const file of manifest.files ?? []) {
  const path = safeVectorPath(directory, file.path);
  const bytes = await readFile(path);
  if (
    bytes.length !== file.bytes ||
    digest(bytes, "sha256") !== file.sha256 ||
    digest(bytes, "sha512") !== file.sha512
  ) {
    throw new Error(`Vector digest mismatch: ${file.path}`);
  }
}

const fingerprints = await readJson(resolve(directory, "rrsif-fingerprint.v1.json"));
for (const testCase of fingerprints.cases ?? []) {
  const parsed = validateFingerprintInput(testCase.input);
  if (parsed.status !== "valid") throw new Error(`Invalid fingerprint vector: ${testCase.id}`);
  if (buildRrsifPreimage(parsed.value) !== testCase.preimage)
    throw new Error(`Fingerprint preimage mismatch: ${testCase.id}`);
  if (calculateRrsifFingerprint(parsed.value).fingerprint.value !== testCase.sha256)
    throw new Error(`Fingerprint digest mismatch: ${testCase.id}`);
}

const internal = await readJson(resolve(directory, "internal-evidence.v1.json"));
const profileFile = (manifest.files ?? []).find(
  (file) => file.path === "internal-evidence.v1.json",
);
if (profileFile?.sha256 !== verifactuRecordProfile.manifest.vectorSha256)
  throw new Error("Internal evidence profile vector digest is stale.");
for (const testCase of internal.cases ?? []) {
  const subject = {
    ...testCase.subject,
    officialBytes: new TextEncoder().encode(testCase.subject.officialBytesUtf8),
  };
  delete subject.officialBytesUtf8;
  const encoded = encodeInternalEvidenceSubject(subject);
  if (Buffer.from(encoded).toString("base64") !== testCase.canonicalBase64)
    throw new Error(`Internal canonical bytes mismatch: ${testCase.id}`);
  const result = createInternalRecordEvidence(subject);
  if (
    !result.ok ||
    result.value.evidence.contentDigest !== testCase.contentDigest ||
    result.value.evidence.recordDigest !== testCase.recordDigest
  ) {
    throw new Error(`Internal evidence mismatch: ${testCase.id}`);
  }
}
console.log(
  `Conformance vectors passed: ${fingerprints.cases.length} official fingerprints, ${internal.cases.length} internal evidence cases.`,
);

function safeVectorPath(directory, filename) {
  if (!/^[a-z0-9][a-z0-9.-]{0,127}\.json$/u.test(filename))
    throw new Error(`Unsafe vector filename: ${filename}`);
  const path = resolve(directory, filename);
  if (!path.startsWith(`${directory}/`)) throw new Error(`Unsafe vector path: ${filename}`);
  return path;
}

function digest(bytes, algorithm) {
  return createHash(algorithm).update(bytes).digest("hex");
}
