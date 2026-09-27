import assert from "node:assert/strict";
import test from "node:test";
import {
  listEditions,
  openEdition,
} from "../../evidence/runs/artifacts/build/verifactu/dist/editions/registry.js";

const editionId = "rrsif-2026-09-21-authoritative-candidate";
const sourceDigest =
  "0856118bfb3d528ffa2acc6322c3484616ba6aff978f620db5e7aab916ba60c6";

test("edition registry is deterministic and preserves verification-only status", () => {
  const editions = listEditions();
  assert.deepEqual(
    editions.map(({ id }) => id),
    [editionId],
  );
  assert.equal(Object.isFrozen(editions), true);
  assert.equal(Object.isFrozen(editions[0]), true);
  assert.equal(editions[0].creationAllowed, false);
  assert.equal(editions[0].verificationAllowed, true);
  assert.equal(openEdition(editionId, sourceDigest).status, "ok");
});

test("unknown editions and mismatched source digests fail closed", () => {
  assert.equal(openEdition("latest").status, "invalid");
  assert.equal(openEdition(editionId, "0".repeat(64)).status, "invalid");
  assert.equal(openEdition(editionId).status, "ok");
});
