import assert from "node:assert/strict";
import test from "node:test";
import { validateRecord, sha256Digest } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/model.js";
import { identity, context } from "../support/p5-domain-fixture.mjs";

const seeds = [1346651001, 1346651002, 1346651003, 1346651004];
function rng(seed) { let state = seed >>> 0; return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state; }; }

test("four frozen seeded persistence campaigns bind canonical bytes and reject digest drift", (t) => {
  let executions = 0;
  for (let campaignIndex = 0; campaignIndex < seeds.length; campaignIndex += 1) {
    const seed = seeds[campaignIndex];
    t.diagnostic(`P5-PROP-${String(campaignIndex + 1).padStart(3, "0")} seed=${seed} executions=4096`);
    const next = rng(seed);
    for (let index = 0; index < 4096; index += 1) {
      const bytes = Buffer.from(`record:${seed}:${index}:${next()}`);
      const record = { id: identity("record", `record-${seed}-${index}`), context, schemaVersion: 1,
        editionId: context.editionId, kind: "alta", predecessorId: null, semanticDigest: sha256Digest(bytes),
        canonicalBytes: bytes, createdAt: "2026-10-03T12:00:00.000Z", sequence: index + 1 };
      assert.equal(validateRecord(record).status, "ok");
      const changed = { ...record, canonicalBytes: Buffer.concat([bytes, Buffer.from("x")]) };
      assert.equal(validateRecord(changed).status, "invalid");
      executions += 1;
    }
  }
  assert.equal(executions, 16_384);
});
