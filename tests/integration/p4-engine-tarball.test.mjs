import assert from "node:assert/strict";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    new URL(
      "../../evidence/runs/artifacts/build/verifactu/dist/index.js",
      import.meta.url,
    ).href
);

const projection = Object.freeze({
  contextId: "tenant-a.install-a",
  sequenceId: "series-2026",
  recordId: "record-1",
  editionId: "edition-1",
  operation: "alta",
  officialArtifactDigests: Object.freeze(["a".repeat(64)]),
  previousEvidenceDigest: null,
  algorithm: "sha-256",
});

test("packed public package loads its exact engine dependency and verifies opaque evidence", () => {
  const adapter = api.createNoeosEvidenceAdapter();
  assert.equal(adapter.status, "succeeded");
  assert.equal(adapter.value.engineAdmission.version, "1.0.1");
  const evidence = api.buildNoeosEvidence(adapter.value, projection);
  assert.equal(evidence.status, "succeeded");
  const changed = api.buildNoeosEvidence(adapter.value, {
    ...projection,
    officialArtifactDigests: ["b".repeat(64)],
  });
  assert.equal(changed.status, "succeeded");
  assert.notEqual(evidence.value.contentDigest, changed.value.contentDigest);
  assert.equal(
    api.verifyNoeosEvidence(adapter.value, projection, evidence.value).value,
    "valid",
  );
  assert.equal(
    api.verifyNoeosEvidence(
      adapter.value,
      { ...projection, recordId: "different-record" },
      evidence.value,
    ).value,
    "invalid",
  );
  const throwingEngine = Object.create(adapter.value.engine);
  throwingEngine.hashRecord = () => {
    throw new Error("packed engine fault");
  };
  throwingEngine.verifyRecord = () => {
    throw new Error("packed verifier fault");
  };
  const throwing = { ...adapter.value, engine: throwingEngine };
  assert.equal(
    api.buildNoeosEvidence(throwing, projection).status,
    "unavailable",
  );
  assert.equal(
    api.verifyNoeosEvidence(throwing, projection, {}).value,
    "unavailable",
  );

  const abortedEngine = Object.create(adapter.value.engine);
  abortedEngine.hashRecord = () => ({ ok: false, diagnostics: [] });
  abortedEngine.verifyRecord = () => ({ status: "aborted" });
  const aborted = { ...adapter.value, engine: abortedEngine };
  assert.equal(
    api.buildNoeosEvidence(aborted, projection).status,
    "unavailable",
  );
  assert.equal(
    api.verifyNoeosEvidence(aborted, projection, {}).value,
    "unavailable",
  );
});

test("packed aggregate retains separate claim results and rejects malformed profile input", () => {
  const claims = {
    official: "valid",
    cryptographic: "valid",
    aeat: "unavailable",
    noeosEvidence: "valid",
  };
  assert.equal(api.defineVerificationClaims(claims).status, "succeeded");
  assert.equal(api.aggregateVerificationClaims(claims), "unavailable");
  assert.equal(
    api.buildNoeosEvidence(api.createNoeosEvidenceAdapter().value, {
      ...projection,
      officialArtifactDigests: ["malformed"],
    }).status,
    "invalid",
  );
});
