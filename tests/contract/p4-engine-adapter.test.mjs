import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    "../../evidence/runs/artifacts/build/verifactu/dist/index.js"
);

const projection = Object.freeze({
  contextId: "tenant-a.install-a",
  sequenceId: "series-2026",
  recordId: "record-1",
  editionId: "edition-1",
  operation: "alta",
  officialArtifactDigests: Object.freeze(["0".repeat(64)]),
  previousEvidenceDigest: null,
  algorithm: "sha-256",
});

test("profile fixture digest, engine admission and vector pins are explicit", async () => {
  const bytes = await readFile(
    new URL(
      "../../packages/verifactu/src/verification/vectors/profile-v1.json",
      import.meta.url,
    ),
  );
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    api.VERIFACTU_EVIDENCE_PROFILE.vectorSha256,
  );
  assert.equal(
    api.VERIFACTU_ENGINE_ADMISSION.name,
    "@noeos/verification-engine",
  );
  assert.equal(api.VERIFACTU_ENGINE_ADMISSION.version, "1.0.1");
  assert.equal(api.VERIFACTU_ENGINE_ADMISSION.vectorSet.files.length, 4);
});

test("Noeos evidence hashes only the opaque projection and verifies repeatably", () => {
  const adapter = api.createNoeosEvidenceAdapter();
  assert.equal(adapter.status, "succeeded");
  const first = api.buildNoeosEvidence(adapter.value, projection);
  const again = api.buildNoeosEvidence(adapter.value, projection);
  assert.equal(first.status, "succeeded");
  assert.equal(again.status, "succeeded");
  assert.deepEqual(first.value, again.value);
  assert.equal(
    first.value.$schema,
    "urn:noeos:verification-engine:record-evidence:1",
  );
  assert.equal(
    api.verifyNoeosEvidence(adapter.value, projection, first.value).value,
    "valid",
  );
  assert.equal(
    api.verifyNoeosEvidence(
      adapter.value,
      { ...projection, recordId: "record-2" },
      first.value,
    ).value,
    "invalid",
  );
  assert.equal(JSON.stringify(first.value).includes("invoice"), false);
});

test("projection validator rejects fiscal plaintext, unknown and accessor fields", () => {
  const adapter = api.createNoeosEvidenceAdapter();
  assert.equal(adapter.status, "succeeded");
  for (const malformed of [
    { ...projection, invoice: "private fiscal payload" },
    { ...projection, operation: "unknown" },
    { ...projection, officialArtifactDigests: ["not-a-digest"] },
    {
      ...projection,
      officialArtifactDigests: Object.defineProperty([], "0", {
        get: () => "0".repeat(64),
        enumerable: true,
      }),
    },
    {
      ...projection,
      officialArtifactDigests: new Proxy(["0".repeat(64)], {
        getOwnPropertyDescriptor: () => {
          throw new Error("hostile array proxy");
        },
      }),
    },
    Object.defineProperty({ ...projection }, "recordId", {
      get: () => "record-1",
    }),
  ]) {
    assert.equal(
      api.buildNoeosEvidence(adapter.value, malformed).status,
      "invalid",
    );
  }
});
