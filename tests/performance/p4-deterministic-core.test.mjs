import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    "../../evidence/runs/artifacts/build/verifactu/dist/index.js"
);
const id = (kind, lexical) => api.identity(kind, lexical).value;
const editionId = id("edition", "performance-active-edition");
const preparedAt = api.parseFiscalInstant("2026-09-22T00:00:00+02:00").value;
const expiresAt = api.parseFiscalInstant("2026-09-22T00:05:00+02:00").value;
const digest = (algorithm, bytes) =>
  new Uint8Array(
    createHash(algorithm === "SHA-256" ? "sha256" : "sha512")
      .update(bytes)
      .digest(),
  );

test("P4-BUD-006/008 one thousand effect-free plans complete within the smoke ceiling", () => {
  const began = performance.now();
  for (let index = 0; index < 1000; index += 1) {
    const result = api.planRecord(
      {
        planId: `plan-${index}`,
        commandId: `command-${index}`,
        idempotencyKey: id("idempotency", `idem-${index}`),
        contextId: "tenant-1:taxpayer-1:installation-1",
        editionId,
        configurationId: id("configuration", "configuration-1"),
        preparedAt,
        expiresAt,
        observedHead: {
          scope: "chain-1",
          version: `version-${index}`,
          recordId: null,
          fingerprint: null,
        },
        recordId: id("record", `record-${index}`),
        artifactIds: [id("artifact", `artifact-${index}`)],
        editionPolicy: {
          edition: editionId,
          creationAllowed: true,
          allowedModes: ["verifactu"],
        },
        fingerprint: index.toString(16).padStart(64, "0"),
        semanticInputDigest: index.toString(16).padStart(64, "0"),
        configurationDigest: "f".repeat(64),
      },
      digest,
    );
    assert.equal(result.status, "succeeded");
  }
  const elapsedMilliseconds = performance.now() - began;
  assert.ok(elapsedMilliseconds < 5000, `${elapsedMilliseconds}ms >= 5000ms`);
});
