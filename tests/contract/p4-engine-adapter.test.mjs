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
  const changedDigest = api.buildNoeosEvidence(adapter.value, {
    ...projection,
    officialArtifactDigests: ["1".repeat(64)],
  });
  assert.equal(changedDigest.status, "succeeded");
  assert.notEqual(first.value.contentDigest, changedDigest.value.contentDigest);
  const ordered = api.buildNoeosEvidence(adapter.value, {
    ...projection,
    officialArtifactDigests: ["0".repeat(64), "1".repeat(64)],
  });
  const reordered = api.buildNoeosEvidence(adapter.value, {
    ...projection,
    officialArtifactDigests: ["1".repeat(64), "0".repeat(64)],
  });
  assert.notEqual(ordered.value.contentDigest, reordered.value.contentDigest);
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

test("engine exceptions, failures and aborts never become valid claims", () => {
  const created = api.createNoeosEvidenceAdapter();
  assert.equal(created.status, "succeeded");
  const throwingEngine = Object.create(created.value.engine);
  throwingEngine.hashRecord = () => {
    throw new Error("simulated engine fault");
  };
  throwingEngine.verifyRecord = () => {
    throw new Error("simulated verifier fault");
  };
  const throwingAdapter = { ...created.value, engine: throwingEngine };
  assert.equal(
    api.buildNoeosEvidence(throwingAdapter, projection).status,
    "unavailable",
  );
  assert.equal(
    api.verifyNoeosEvidence(throwingAdapter, projection, {}).value,
    "unavailable",
  );

  const limitedEngine = Object.create(created.value.engine);
  limitedEngine.hashRecord = () => ({ ok: false, diagnostics: [] });
  limitedEngine.verifyRecord = () => ({ status: "aborted" });
  const limitedAdapter = { ...created.value, engine: limitedEngine };
  assert.equal(
    api.buildNoeosEvidence(limitedAdapter, projection).status,
    "unavailable",
  );
  assert.equal(
    api.verifyNoeosEvidence(limitedAdapter, projection, {}).value,
    "unavailable",
  );

  const indeterminateEngine = Object.create(created.value.engine);
  indeterminateEngine.verifyRecord = () => ({ status: "indeterminate" });
  assert.equal(
    api.verifyNoeosEvidence(
      { ...created.value, engine: indeterminateEngine },
      projection,
      {},
    ).value,
    "indeterminate",
  );
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

test("P4-FUZZ-006 rejects 4096 bounded malformed Noeos projections", () => {
  const adapter = api.createNoeosEvidenceAdapter();
  assert.equal(adapter.status, "succeeded");
  let state = 0x50544636;
  const next = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0);
  for (let index = 0; index < 4096; index += 1) {
    const invalidProjection = {
      ...projection,
      operation: ["unknown", "alta", "anulacion"][next() % 3],
      officialArtifactDigests: [`${next().toString(16).padStart(64, "0")}`],
      unexpected: next(),
    };
    assert.equal(
      api.buildNoeosEvidence(adapter.value, invalidProjection).status,
      "invalid",
    );
  }
});
