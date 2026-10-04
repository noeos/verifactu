import assert from "node:assert/strict";
import test from "node:test";
import {
  contextMatches,
  contextStoreKey,
  isSafeStoreToken,
  sha256Digest,
  sha512Digest,
  parseSha256,
  storeFailure,
  storeOk,
  validateArtifact,
  validateEvidenceClaim,
  validateRecord,
} from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/model.js";
import { createFiscalContext, requireSameContext } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";
import { createFiscalDocumentIdentity, createIdentity, identityKey, isIdentity, sameIdentity } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";
import { PERSISTENCE_PORT_CONTRACT_VERSION } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/ports.js";

const id = (kind, value) => createIdentity(kind, value).value;
const context = createFiscalContext({
  tenantId: id("tenant", "tenant-a"),
  taxpayerId: id("taxpayer", "taxpayer-a"),
  installationId: id("installation", "install-a"),
  editionId: id("edition", "edition-a"),
}).value;
const recordBytes = Buffer.from('{"sequence":1,"total":"12.50"}', "utf8");

test("SHA-256 parser admits only canonical lowercase digests", () => {
  const digest = `sha256:${"a".repeat(64)}`;
  assert.deepEqual(parseSha256(digest), { status: "ok", value: digest });
  for (const value of [null, "", "sha256:ABCDEF", `sha256:${"A".repeat(64)}`, `sha256:${"a".repeat(63)}`])
    assert.equal(parseSha256(value).status, "invalid");
});

test("P5 immutable record validates context, edition, sequence and canonical bytes", () => {
  const valid = {
    id: id("record", "record-1"),
    context,
    schemaVersion: 1,
    editionId: context.editionId,
    kind: "alta",
    predecessorId: null,
    semanticDigest: sha256Digest(recordBytes),
    canonicalBytes: recordBytes,
    createdAt: "2026-10-03T12:00:00Z",
    sequence: 1,
  };
  const result = validateRecord(valid);
  assert.equal(result.status, "ok");
  assert.notEqual(result.value.canonicalBytes, recordBytes);
  assert.deepEqual(result.value.canonicalBytes, recordBytes);
  for (const malformed of [
    null,
    { ...valid, schemaVersion: 2 },
    { ...valid, id: id("tenant", "not-a-record") },
    { ...valid, editionId: id("tenant", "not-an-edition") },
    { ...valid, sequence: 0 },
    { ...valid, sequence: 1.5 },
    { ...valid, kind: "unknown" },
    { ...valid, editionId: id("edition", "other-edition") },
    { ...valid, predecessorId: id("event", "wrong-kind") },
    { ...valid, predecessorId: valid.id },
    { ...valid, context: null },
    { ...valid, semanticDigest: `sha256:${"0".repeat(64)}` },
    { ...valid, createdAt: "2026-02-30T12:00:00Z" },
    { ...valid, canonicalBytes: new Uint8Array() },
    { ...valid, canonicalBytes: Buffer.alloc(1_048_577) },
  ]) assert.equal(validateRecord(malformed).status, "invalid");
});

test("artifact descriptors bind exact bytes, length, both digests and context", () => {
  const bytes = Buffer.from("immutable-wire-artifact", "utf8");
  const descriptor = {
    id: id("operation", "op-1"),
    context,
    schemaVersion: 1,
    artifactId: "soap-request-1",
    mediaType: "application/soap+xml",
    byteLength: bytes.length,
    sha256: sha256Digest(bytes),
    sha512: sha512Digest(bytes),
    createdAt: "2026-10-03T12:00:00Z",
  };
  const stored = validateArtifact(descriptor, bytes);
  assert.equal(stored.status, "ok");
  assert.notEqual(stored.value.bytes, bytes);
  assert.deepEqual(stored.value.bytes, bytes);
  assert.equal(validateArtifact({ ...descriptor, byteLength: bytes.length + 1 }, bytes).status, "invalid");
  assert.equal(validateArtifact({ ...descriptor, sha512: `sha512:${"0".repeat(128)}` }, bytes).status, "invalid");
  assert.equal(validateArtifact(descriptor, Buffer.from("changed", "utf8")).status, "invalid");
  assert.equal(validateArtifact({ ...descriptor, context: { ...context, tenantId: id("tenant", "tenant-b") } }, bytes).status, "ok");
  for (const malformed of [
    null,
    { ...descriptor, schemaVersion: 2 },
    { ...descriptor, context: null },
    { ...descriptor, id: id("record", "wrong-kind") },
    { ...descriptor, artifactId: "" },
    { ...descriptor, mediaType: "invalid media type" },
    { ...descriptor, byteLength: -1 },
    { ...descriptor, byteLength: 1_048_577 },
    { ...descriptor, createdAt: "invalid" },
  ]) assert.equal(validateArtifact(malformed, bytes).status, "invalid");
});

test("evidence claims bind identity, verifier outcome and unique bounded artifacts", () => {
  const claim = { id: id("operation", "claim-operation"), context, schemaVersion: 1, claimId: "claim-1",
    subjectDigest: `sha256:${"a".repeat(64)}`, verifierId: "verifier-1", profileId: "profile-1", result: "verified",
    supportingArtifactIds: ["artifact-1"], validatedAt: "2026-10-03T12:00:00Z" };
  assert.equal(validateEvidenceClaim(claim).status, "ok");
  for (const malformed of [
    null,
    { ...claim, schemaVersion: 2 },
    { ...claim, id: id("record", "wrong-kind") },
    { ...claim, context: null },
    { ...claim, claimId: "" },
    { ...claim, subjectDigest: "invalid" },
    { ...claim, verifierId: "" },
    { ...claim, profileId: "" },
    { ...claim, result: "unknown" },
    { ...claim, supportingArtifactIds: null },
    { ...claim, supportingArtifactIds: Array(501).fill("artifact") },
    { ...claim, supportingArtifactIds: ["bad\nartifact"] },
    { ...claim, supportingArtifactIds: ["artifact-1", "artifact-1"] },
    { ...claim, validatedAt: "invalid" },
  ]) assert.equal(validateEvidenceClaim(malformed).status, "invalid");
});

test("fiscal identities reject invalid tokens and bind document dates without aliasing kinds", () => {
  const taxpayer = id("taxpayer", "taxpayer-a");
  assert.equal(createIdentity("taxpayer", " padded ").status, "invalid");
  assert.equal(createIdentity("taxpayer", "").status, "invalid");
  assert.equal(createIdentity("taxpayer", `x${"x".repeat(128)}`).status, "invalid");
  assert.equal(createIdentity("taxpayer", "bad\nvalue").status, "invalid");
  assert.equal(isIdentity(null, "taxpayer"), false);
  assert.equal(isIdentity({ kind: "tenant", value: "tenant-a" }, "taxpayer"), false);
  assert.equal(isIdentity({ kind: "taxpayer", value: " padded " }, "taxpayer"), false);
  assert.equal(sameIdentity(taxpayer, id("taxpayer", "taxpayer-a")), true);
  assert.equal(sameIdentity(taxpayer, id("taxpayer", "taxpayer-b")), false);
  assert.equal(identityKey([taxpayer, "fiscal"]), identityKey([taxpayer, "fiscal"]));
  assert.notEqual(identityKey([taxpayer, "fiscal"]), identityKey(["taxpayer-a", "fiscal"]));
  assert.equal(createFiscalDocumentIdentity({ issuer: taxpayer, series: "A", number: "1", issueDate: "2026-10-03" }).status, "ok");
  for (const invalid of [
    { issuer: id("tenant", "tenant-a"), series: "A", number: "1", issueDate: "2026-10-03" },
    { issuer: taxpayer, series: "", number: "1", issueDate: "2026-10-03" },
    { issuer: taxpayer, series: "x".repeat(61), number: "1", issueDate: "2026-10-03" },
    { issuer: taxpayer, series: "A", number: "", issueDate: "2026-10-03" },
    { issuer: taxpayer, series: "A", number: "x".repeat(61), issueDate: "2026-10-03" },
    { issuer: taxpayer, series: "A", number: "1", issueDate: "2026-02-30" },
  ]) assert.equal(createFiscalDocumentIdentity(invalid).status, "invalid");
});

test("fiscal context comparison returns a diagnostic when any scope identity differs", () => {
  assert.deepEqual(requireSameContext(context, context), { status: "ok", value: true });
  const otherTenant = createFiscalContext({ ...context, tenantId: id("tenant", "tenant-b") }).value;
  assert.deepEqual(requireSameContext(context, otherTenant), {
    status: "invalid", diagnostics: [{ code: "DIAG-CONTEXT-MISMATCH", stage: "domain", path: "", severity: "error", retryable: false }],
  });
});

test("persistence results and tokens are explicit and context keys bind all scope identities", () => {
  assert.equal(PERSISTENCE_PORT_CONTRACT_VERSION, 1);
  const value = Object.freeze({ stored: true });
  assert.deepEqual(storeOk(value), { status: "ok", value });
  assert.deepEqual(storeFailure("conflict", "idempotency-conflict"), {
    status: "conflict",
    code: "idempotency-conflict",
  });

  assert.equal(isSafeStoreToken("store-key-1"), true);
  assert.equal(isSafeStoreToken("x".repeat(256)), true);
  for (const token of [null, 1, "", " padded ", "bad\ntoken", "x".repeat(257)])
    assert.equal(isSafeStoreToken(token), false);
  assert.equal(isSafeStoreToken("x".repeat(3), 2), false);

  const expectedKey = contextStoreKey(context);
  assert.equal(typeof expectedKey, "string");
  assert.equal(expectedKey.length > 0, true);
  assert.equal(contextMatches(context, context), true);
  for (const [field, kind, value] of [
    ["tenantId", "tenant", "tenant-b"],
    ["taxpayerId", "taxpayer", "taxpayer-b"],
    ["installationId", "installation", "install-b"],
    ["editionId", "edition", "edition-b"],
  ]) {
    const otherContext = createFiscalContext({
      ...context,
      [field]: id(kind, value),
    }).value;
    assert.notEqual(contextStoreKey(otherContext), expectedKey);
    assert.equal(contextMatches(context, otherContext), false);
  }
});
