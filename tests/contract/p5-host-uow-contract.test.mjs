import assert from "node:assert/strict";
import test from "node:test";
import { beginUnitOfWork } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/unit-of-work.js";
import { sha256Digest } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/model.js";
import { createIdentity } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";
import { context, hash } from "../support/p5-aeat-fixture.mjs";

test("host capability and store adapter identity are checked before transaction open", async () => {
  let opens = 0;
  const ok = (value) => ({ status: "ok", value });
  const store = { contractVersion: 1, append: async () => ok("created"), put: async () => ok("created"), get: async () => ok(null),
    list: async () => ok({ items: [], snapshotId: "snapshot-1", nextCursor: null, complete: true }),
    discover: async () => ok({ items: [], snapshotId: "snapshot-1", nextCursor: null, complete: true }),
    read: async () => ok(null), compareAndAppend: async () => ok("advanced") };
  const leases = { contractVersion: 1, claim: async () => ok(null), renew: async () => ok(null), release: async () => ok("released"), complete: async () => ok(null) };
  const host = { contractVersion: 1, capabilityLevel: "atomic-host", adapterId: "host-adapter-1",
    async begin() { opens += 1; return ok({ adapterId: "host-adapter-1", transactionId: "tx-1", context,
      commandId: "cmd-1", canonicalDigest: `sha256:${hash("cmd")}`, capabilityLevel: "atomic-host" }); },
    async stageHostPublication() { return ok("staged"); }, async commit() { return ok({ commitId: "commit-1" }); },
    async rollback() { return ok("rolled-back"); }, async resolveUnknownCommit() { return ok({ committed: false, commitId: null }); } };
  const ports = { adapterId: "different-adapter", capabilityLevel: "atomic-host", hostUnitOfWork: host,
    records: store, artifacts: store, evidence: store, journal: store, outbox: store, heads: store, leases };
  const result = await beginUnitOfWork(ports, { context, commandId: "cmd-1", canonicalDigest: `sha256:${hash("cmd")}` });
  assert.equal(result.status, "invalid");
  assert.equal(opens, 0);
});

test("token mismatch triggers rollback and never hands out an unbound session", async () => {
  let rollbacks = 0;
  const ok = (value) => ({ status: "ok", value });
  const store = { contractVersion: 1, append: async () => ok("created"), put: async () => ok("created"), get: async () => ok(null),
    list: async () => ok({ items: [], snapshotId: "snapshot-1", nextCursor: null, complete: true }),
    discover: async () => ok({ items: [], snapshotId: "snapshot-1", nextCursor: null, complete: true }),
    read: async () => ok(null), compareAndAppend: async () => ok("advanced") };
  const leases = { contractVersion: 1, claim: async () => ok(null), renew: async () => ok(null), release: async () => ok("released"), complete: async () => ok(null) };
  const host = { contractVersion: 1, capabilityLevel: "atomic-host", adapterId: "host-adapter-1",
    async begin() { return ok({ adapterId: "other-adapter", transactionId: "tx-1", context, commandId: "cmd-1",
      canonicalDigest: `sha256:${hash("cmd")}`, capabilityLevel: "atomic-host" }); },
    async stageHostPublication() { return ok("staged"); }, async commit() { return ok({ commitId: "commit-1" }); },
    async rollback() { rollbacks += 1; return ok("rolled-back"); }, async resolveUnknownCommit() { return ok({ committed: false, commitId: null }); } };
  const ports = { adapterId: "host-adapter-1", capabilityLevel: "atomic-host", hostUnitOfWork: host,
    records: store, artifacts: store, evidence: store, journal: store, outbox: store, heads: store, leases };
  const result = await beginUnitOfWork(ports, { context, commandId: "cmd-1", canonicalDigest: `sha256:${hash("cmd")}` });
  assert.equal(result.status, "invalid");
  assert.equal(rollbacks, 1);
});

test("active UoW rejects malformed staged writes and terminal sessions reject further changes", async () => {
  const ok = (value) => ({ status: "ok", value });
  const store = { contractVersion: 1, append: async () => ok("created"), put: async () => ok("created"), get: async () => ok(null),
    list: async () => ok({ items: [], snapshotId: "snapshot-1", nextCursor: null, complete: true }),
    discover: async () => ok({ items: [], snapshotId: "snapshot-1", nextCursor: null, complete: true }),
    read: async () => ({ status: "unavailable", code: "not-found" }), compareAndAppend: async () => ok("advanced") };
  const leases = { contractVersion: 1, claim: async () => ok(null), renew: async () => ok(null), release: async () => ok("released"), complete: async () => ok(null) };
  const host = { contractVersion: 1, capabilityLevel: "atomic-host", adapterId: "host-adapter-1",
    async begin() { return ok({ adapterId: "host-adapter-1", transactionId: "tx-1", context, commandId: "cmd-1",
      canonicalDigest: `sha256:${hash("cmd")}`, capabilityLevel: "atomic-host" }); },
    async stageHostPublication() { return ok("staged"); }, async commit() { return ok({ commitId: "commit-1" }); },
    async rollback() { return ok("rolled-back"); }, async resolveUnknownCommit() { return ok({ committed: false, commitId: null }); } };
  const ports = { adapterId: "host-adapter-1", capabilityLevel: "atomic-host", hostUnitOfWork: host,
    records: store, artifacts: store, evidence: store, journal: store, outbox: store, heads: store, leases };
  const opened = await beginUnitOfWork(ports, { context, commandId: "cmd-1", canonicalDigest: `sha256:${hash("cmd")}` });
  assert.equal(opened.status, "ok");
  const session = opened.value;
  assert.equal((await session.stagePublication(null)).status, "invalid");
  assert.equal((await session.appendRecord(null, null)).status, "invalid");
  assert.equal((await session.putArtifact(null, Buffer.from("x"))).status, "invalid");
  assert.equal((await session.appendEvidence(null)).status, "invalid");
  assert.equal((await session.appendJournal(null)).status, "invalid");
  assert.equal((await session.appendOutbox(null)).status, "invalid");
  assert.equal((await session.compareAndAppendHead(null, null, null)).status, "invalid");
  assert.equal((await session.commit()).status, "invalid");
  assert.equal((await session.rollback()).status, "ok");
  assert.equal((await session.appendEvidence(null)).status, "conflict");
  assert.equal(session.state, "rolled-back");
});

test("record idempotency binds both command identity and canonical digest", async () => {
  const ok = (value) => ({ status: "ok", value });
  let appends = 0;
  const store = { contractVersion: 1, async append() { appends += 1; return ok("created"); }, async put() { return ok("created"); },
    async get() { return ok(null); }, async list() { return ok({ items: [], snapshotId: "snapshot-1", nextCursor: null, complete: true }); },
    async discover() { return ok({ items: [], snapshotId: "snapshot-1", nextCursor: null, complete: true }); },
    async read() { return { status: "unavailable", code: "not-found" }; }, async compareAndAppend() { return ok("advanced"); } };
  const leases = { contractVersion: 1, async claim() { return ok(null); }, async renew() { return ok(null); }, async release() { return ok("released"); }, async complete() { return ok(null); } };
  const host = { contractVersion: 1, capabilityLevel: "atomic-host", adapterId: "host-adapter-1",
    async begin() { return ok({ adapterId: "host-adapter-1", transactionId: "tx-1", context, commandId: "cmd-1",
      canonicalDigest: `sha256:${hash("cmd")}`, capabilityLevel: "atomic-host" }); },
    async stageHostPublication() { return ok("staged"); }, async commit() { return ok({ commitId: "commit-1" }); },
    async rollback() { return ok("rolled-back"); }, async resolveUnknownCommit() { return ok({ committed: false, commitId: null }); } };
  const ports = { adapterId: "host-adapter-1", capabilityLevel: "atomic-host", hostUnitOfWork: host,
    records: store, artifacts: store, evidence: store, journal: store, outbox: store, heads: store, leases };
  const opened = await beginUnitOfWork(ports, { context, commandId: "cmd-1", canonicalDigest: `sha256:${hash("cmd")}` });
  assert.equal(opened.status, "ok");
  const bytes = Buffer.from("record");
  const record = { id: createIdentity("record", "record-1").value, context, schemaVersion: 1, editionId: context.editionId,
    kind: "alta", predecessorId: null, semanticDigest: sha256Digest(bytes), canonicalBytes: bytes,
    createdAt: "2026-10-03T12:00:00Z", sequence: 1 };
  assert.equal((await opened.value.appendRecord(record, { context, commandId: "different-command", canonicalDigest: `sha256:${hash("cmd")}`, resultDigest: null })).status, "invalid");
  assert.equal((await opened.value.appendRecord(record, { context, commandId: "cmd-1", canonicalDigest: `sha256:${hash("other")}`, resultDigest: null })).status, "invalid");
  assert.equal(appends, 0);
});
