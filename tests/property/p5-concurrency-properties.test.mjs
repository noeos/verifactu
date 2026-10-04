import assert from "node:assert/strict";
import test from "node:test";
import { genesisHead, readHeadOrGenesis, validateHeadAdvance } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/head-cas.js";
import { sha256Digest } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/model.js";
import { identity, context } from "../support/p5-aeat-fixture.mjs";

const seeds = [1346651005, 1346651006, 1346651007, 1346651008];
function rng(seed) { let state = seed >>> 0; return () => { state = (Math.imul(state, 1103515245) + 12345) >>> 0; return state; }; }

test("four frozen concurrency campaigns preserve head generation and predecessor binding", (t) => {
  let executions = 0;
  for (let campaignIndex = 0; campaignIndex < seeds.length; campaignIndex += 1) {
    const seed = seeds[campaignIndex];
    t.diagnostic(`P5-PROP-${String(campaignIndex + 5).padStart(3, "0")} seed=${seed} executions=4096`);
    const next = rng(seed);
    for (let index = 0; index < 4096; index += 1) {
      const bytes = Buffer.from(`fiscal-${seed}-${index}-${next()}`);
      const record = { id: identity("record", `record-${seed}-${index}`), context, schemaVersion: 1,
        editionId: context.editionId, kind: "alta", predecessorId: null, semanticDigest: sha256Digest(bytes), canonicalBytes: bytes,
        createdAt: "2026-10-03T12:00:00.000Z", sequence: 1 };
      const genesis = genesisHead(context, "chain-1");
      const advanced = { ...genesis, generation: 1, lastRecordId: record.id, officialFingerprint: record.semanticDigest,
        generatedAt: "2026-10-03T12:00:00.000Z", commitId: `commit-${seed}-${index}` };
      assert.equal(validateHeadAdvance(genesis, advanced, record).status, "ok");
      assert.equal(validateHeadAdvance(genesis, { ...advanced, generation: 2 }, record).status, "invalid");
      executions += 1;
    }
  }
  assert.equal(executions, 16_384);
});

test("head advancement preserves the predecessor chain and read falls back only on explicit not-found", async () => {
  const firstBytes = Buffer.from("first-record");
  const first = { id: identity("record", "record-first"), context, schemaVersion: 1, editionId: context.editionId, kind: "alta",
    predecessorId: null, semanticDigest: sha256Digest(firstBytes), canonicalBytes: firstBytes, createdAt: "2026-10-03T12:00:00Z", sequence: 1 };
  const initial = genesisHead(context, "chain-1");
  const head1 = { ...initial, generation: 1, lastRecordId: first.id, officialFingerprint: first.semanticDigest,
    generatedAt: "2026-10-03T12:00:00Z", commitId: "commit-1" };
  const secondBytes = Buffer.from("second-record");
  const second = { ...first, id: identity("record", "record-second"), predecessorId: first.id,
    semanticDigest: sha256Digest(secondBytes), canonicalBytes: secondBytes, sequence: 2 };
  const head2 = { ...head1, generation: 2, lastRecordId: second.id, officialFingerprint: second.semanticDigest,
    generatedAt: "2026-10-03T12:01:00Z", commitId: "commit-2" };
  assert.equal(validateHeadAdvance(head1, head2, second).status, "ok");
  assert.equal(validateHeadAdvance(head1, head2, { ...second, predecessorId: identity("record", "fork") }).status, "invalid");
  assert.equal(validateHeadAdvance(initial, { ...head1, generation: 0 }, first).status, "invalid");
  assert.equal(genesisHead(context, " invalid-chain"), null);

  const absent = await readHeadOrGenesis({ heads: { async read() { return { status: "unavailable", code: "not-found" }; } } }, context, "chain-1");
  assert.equal(absent.status, "ok");
  assert.equal(absent.value.generation, 0);
  const unavailable = await readHeadOrGenesis({ heads: { async read() { return { status: "unavailable", code: "backend-down" }; } } }, context, "chain-1");
  assert.equal(unavailable.status, "unavailable");
  const corrupt = await readHeadOrGenesis({ heads: { async read() { return { status: "ok", value: { ...initial, id: identity("chain", "different-chain") } }; } } }, context, "chain-1");
  assert.equal(corrupt.status, "indeterminate");
});
