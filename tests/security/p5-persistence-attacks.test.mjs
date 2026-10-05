import assert from "node:assert/strict";
import test from "node:test";
import { validateArtifact, contextMatches, contextStoreKey, sha256Digest, sha512Digest } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/model.js";
import { planRetention } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/retention.js";
import { context, hash, identity } from "../support/p5-domain-fixture.mjs";

test("stored artifact bytes, lengths and both digests are recomputed before admission", () => {
  const bytes = Buffer.from("artifact bytes");
  const descriptor = { id: identity("operation", "artifact-id"), context, schemaVersion: 1, artifactId: "artifact-1",
    mediaType: "application/xml", byteLength: bytes.byteLength, sha256: sha256Digest(bytes), sha512: sha512Digest(bytes), createdAt: "2026-10-03T12:00:00.000Z" };
  assert.equal(validateArtifact(descriptor, bytes).status, "ok");
  assert.equal(validateArtifact({ ...descriptor, byteLength: bytes.byteLength + 1 }, bytes).status, "invalid");
  assert.equal(validateArtifact({ ...descriptor, sha256: `sha256:${hash("other")}` }, bytes).status, "invalid");
  assert.equal(validateArtifact({ ...descriptor, sha512: `sha512:${hash("other")}` }, bytes).status, "invalid");
});

test("store scope includes tenant, taxpayer, installation and edition identities", () => {
  const other = { ...context, taxpayerId: identity("taxpayer", "ES999") };
  assert.notEqual(contextStoreKey(context), contextStoreKey(other));
  assert.equal(contextMatches(context, other), false);
  assert.equal(contextMatches(context, context), true);
});

test("legal hold and unresolved dependency closure prevent retention purge eligibility", async () => {
  const adapter = { async dryRun() { return { status: "ok", value: [{ objectId: "record-1", context, dataClass: "fiscal-record",
    createdAt: "2020-01-01T00:00:00Z", minimumRetainUntil: "2025-01-01T00:00:00Z", legalHold: true,
    dependencies: [], closureComplete: true, version: 1 }] }; } };
  const result = await planRetention(adapter, { context, policy: { policyId: "policy-1", digest: `sha256:${hash("policy")}`,
    dataClasses: ["fiscal-record"], jurisdiction: "ES", fiscalPeriod: "2026", legalHoldResolved: true, approvalRequired: true },
    asOf: "2026-10-03T12:00:00Z", limit: 10 });
  assert.equal(result.status, "ok");
  assert.equal(result.value.status, "blocked");
  assert.deepEqual(result.value.candidates, []);
  assert.equal(result.value.blocked[0].reason, "DIAG-RETENTION-LEGAL-HOLD");
});
