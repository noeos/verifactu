import assert from "node:assert/strict";
import test from "node:test";
import { commitFiscalPublication } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/atomic-coordinator.js";
import { compareAndAppendHead, genesisHead, readHeadOrGenesis, validateHeadAdvance } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/head-cas.js";
import { sha256Digest, sha512Digest } from "../../evidence/runs/artifacts/build/verifactu/dist/persistence/model.js";
import { context, identity, hash } from "../support/p5-aeat-fixture.mjs";
import { recordP5FaultDetection } from "../support/p5-fault-evidence.mjs";

function fixture(failHead = false) {
  const calls = [];
  const digest = `sha256:${hash("command")}`;
  const tx = { adapterId: "atomic-host", transactionId: "tx-1", context, commandId: "command-1", canonicalDigest: digest, capabilityLevel: "atomic-host" };
  const ok = (value) => ({ status: "ok", value });
  const store = { contractVersion: 1,
    async append(token) { calls.push(["record", token.transactionId]); return ok("created"); },
    async put(token) { calls.push(["artifact", token.transactionId]); return ok("created"); },
    async get() { return { status: "unavailable", code: "not-found" }; },
    async list() { return ok({ items: [], snapshotId: "snap", nextCursor: null, complete: true }); },
    async discover() { return ok({ items: [], snapshotId: "snap", nextCursor: null, complete: true }); },
    async read() { return { status: "unavailable", code: "not-found" }; },
    async compareAndAppend(token) { calls.push(["head", token.transactionId]); return failHead ? { status: "conflict", code: "compare-and-set-conflict" } : ok("advanced"); },
  };
  const leases = { contractVersion: 1, claim: async () => ({ status: "unavailable", code: "unavailable" }), renew: async () => ({ status: "unavailable", code: "unavailable" }),
    release: async () => ok("released"), complete: async () => ({ status: "unavailable", code: "unavailable" }) };
  const hostUnitOfWork = { contractVersion: 1, capabilityLevel: "atomic-host", adapterId: "atomic-host",
    async begin() { calls.push(["begin", tx.transactionId]); return ok(tx); },
    async stageHostPublication(token) { calls.push(["publication", token.transactionId]); return ok("staged"); },
    async commit(token) { calls.push(["commit", token.transactionId]); return ok({ commitId: "commit-1" }); },
    async rollback(token) { calls.push(["rollback", token.transactionId]); return ok("rolled-back"); },
    async resolveUnknownCommit() { return ok({ committed: false, commitId: null }); },
  };
  const ports = { adapterId: "atomic-host", capabilityLevel: "atomic-host", hostUnitOfWork,
    records: store, artifacts: store, evidence: store, journal: store, outbox: store, heads: store, leases };
  const bytes = Buffer.from("fiscal-record");
  const record = { id: identity("record", "record-1"), context, schemaVersion: 1, editionId: context.editionId,
    kind: "alta", predecessorId: null, semanticDigest: sha256Digest(bytes), canonicalBytes: bytes,
    createdAt: "2026-10-03T12:00:00.000Z", sequence: 1 };
  const expectedHead = genesisHead(context, "chain-1");
  const nextHead = { ...expectedHead, generation: 1, lastRecordId: record.id, officialFingerprint: record.semanticDigest,
    generatedAt: "2026-10-03T12:00:00.000Z", commitId: "tx-1" };
  return { calls, ports, record, expectedHead, nextHead, digest, tx };
}

test("record, head and host publication share one atomic host transaction", async () => {
  const value = fixture();
  const result = await commitFiscalPublication(value.ports, { context, commandId: "command-1", canonicalDigest: value.digest,
    publication: { publicationId: "publication-1", revision: 1, commandId: "command-1", canonicalDigest: value.digest, createdAt: "2026-10-03T12:00:00Z" },
    record: value.record, artifacts: [], evidence: [], journal: [], outbox: [], expectedHead: value.expectedHead, nextHead: value.nextHead });
  assert.equal(result.status, "committed");
  assert.deepEqual(value.calls.map(([kind]) => kind), ["begin", "record", "head", "publication", "commit"]);
  assert.equal(new Set(value.calls.map(([, transactionId]) => transactionId)).size, 1);
});

test("atomic publication preflight rejects malformed scope, identity, digest and batch families", async () => {
  const value = fixture();
  const base = { context, commandId: "command-1", canonicalDigest: value.digest,
    publication: { publicationId: "publication-1", revision: 1, commandId: "command-1", canonicalDigest: value.digest,
      createdAt: "2026-10-03T12:00:00Z" }, record: value.record, artifacts: [], evidence: [], journal: [], outbox: [],
    expectedHead: value.expectedHead, nextHead: value.nextHead };
  const malformed = [
    null,
    { ...base, context: null },
    { ...base, record: null },
    { ...base, context: { ...context, taxpayerId: identity("taxpayer", "different-taxpayer") } },
    { ...base, commandId: " unsafe " },
    { ...base, canonicalDigest: "invalid" },
    { ...base, publication: null },
    { ...base, publication: { ...base.publication, commandId: "another-command" } },
    { ...base, publication: { ...base.publication, canonicalDigest: `sha256:${"0".repeat(64)}` } },
    { ...base, artifacts: null },
    { ...base, evidence: "invalid" },
    { ...base, journal: Array(1001).fill({}) },
    { ...base, outbox: Array(501).fill({}) },
  ];
  for (const input of malformed) {
    const callsBefore = value.calls.length;
    assert.deepEqual(await commitFiscalPublication(value.ports, input), { status: "invalid", code: "invalid-input" });
    assert.equal(value.calls.length, callsBefore);
  }
});

test("head race rolls back all staged host-visible writes", async () => {
  const value = fixture(true);
  const result = await commitFiscalPublication(value.ports, { context, commandId: "command-1", canonicalDigest: value.digest,
    publication: { publicationId: "publication-1", revision: 1, commandId: "command-1", canonicalDigest: value.digest, createdAt: "2026-10-03T12:00:00Z" },
    record: value.record, artifacts: [], evidence: [], journal: [], outbox: [], expectedHead: value.expectedHead, nextHead: value.nextHead });
  assert.equal(result.status, "conflict");
  assert.deepEqual(value.calls.map(([kind]) => kind), ["begin", "record", "head", "rollback"]);
});

test("atomic coordinator stages every declared data family and rolls back each rejected stage", async () => {
  const makeInput = (value) => {
    const artifactBytes = Buffer.from("exact-soap-request");
    const artifact = { descriptor: { id: identity("operation", "artifact-operation"), context, schemaVersion: 1,
      artifactId: "artifact-1", mediaType: "application/soap+xml", byteLength: artifactBytes.length,
      sha256: sha256Digest(artifactBytes), sha512: sha512Digest(artifactBytes), createdAt: "2026-10-03T12:00:00Z" }, bytes: artifactBytes };
    const evidence = { id: identity("operation", "evidence-operation"), context, schemaVersion: 1, claimId: "claim-1",
      subjectDigest: sha256Digest(Buffer.from("subject")), verifierId: "verifier-1", profileId: "profile-1", result: "verified",
      supportingArtifactIds: ["artifact-1"], validatedAt: "2026-10-03T12:00:00Z" };
    const journal = { id: identity("event", "event-1"), context, schemaVersion: 1, aggregateId: "record-1", version: 1,
      eventCode: "fiscal-record-published", commandId: "command-1", causationId: null, correlationId: "correlation-1",
      priorState: null, nextState: "committed", occurredAt: "2026-10-03T12:00:00Z", instantSource: "host",
      artifactIds: ["artifact-1"], claimIds: ["claim-1"], safeDiagnostics: [] };
    const outbox = { id: identity("operation", "outbox-operation"), context, schemaVersion: 1, outboxId: "outbox-1",
      recordIds: [value.record.id], artifactIds: ["artifact-1"], operationId: "voluntary-submission", environment: "test",
      orderingScope: "chain-1", eligibleAt: "2026-10-03T12:00:00Z", state: "pending", version: 1,
      attemptCount: 0, fencingToken: 0, lastObservationId: null, reconciliationRequired: false };
    return { context, commandId: "command-1", canonicalDigest: value.digest,
      publication: { publicationId: "publication-1", revision: 1, commandId: "command-1", canonicalDigest: value.digest, createdAt: "2026-10-03T12:00:00Z" },
      record: value.record, artifacts: [artifact], evidence: [evidence], journal: [journal], outbox: [outbox],
      expectedHead: value.expectedHead, nextHead: value.nextHead };
  };
  const successful = fixture();
  const committed = await commitFiscalPublication(successful.ports, makeInput(successful));
  assert.equal(committed.status, "committed");
  assert.deepEqual(successful.calls.map(([kind]) => kind), ["begin", "record", "artifact", "record", "record", "record", "head", "publication", "commit"]);

  for (const family of ["records", "artifacts", "evidence", "journal", "outbox"]) {
    const failed = fixture();
    const original = failed.ports[family];
    const method = family === "artifacts" ? "put" : "append";
    failed.ports[family] = { ...original, async [method]() { return { status: "unavailable", code: "unavailable" }; } };
    const result = await commitFiscalPublication(failed.ports, makeInput(failed));
    assert.equal(result.status, "unavailable", family);
    assert.equal(failed.calls.at(-1)[0], "rollback", family);
  }

  const publicationFailure = fixture();
  publicationFailure.ports.hostUnitOfWork.stageHostPublication = async () => ({ status: "conflict", code: "idempotency-conflict" });
  assert.equal((await commitFiscalPublication(publicationFailure.ports, makeInput(publicationFailure))).status, "conflict");
  assert.equal(publicationFailure.calls.at(-1)[0], "rollback");

  const unknownCommit = fixture();
  unknownCommit.ports.hostUnitOfWork.commit = async () => ({ status: "indeterminate", code: "unknown-commit" });
  assert.deepEqual(await commitFiscalPublication(unknownCommit.ports, makeInput(unknownCommit)),
    { status: "unavailable", code: "local-commit-not-applied" });
});

test("head CAS validates genesis and successor chains and distinguishes absence from corruption", async () => {
  const genesis = genesisHead(context, "chain-cas");
  const bytes = Buffer.from("cas-record");
  const record = { id: identity("record", "cas-record-1"), context, schemaVersion: 1, editionId: context.editionId,
    kind: "alta", predecessorId: null, semanticDigest: sha256Digest(bytes), canonicalBytes: bytes,
    createdAt: "2026-10-03T12:00:00Z", sequence: 1 };
  const next = { ...genesis, generation: 1, lastRecordId: record.id, officialFingerprint: record.semanticDigest,
    generatedAt: record.createdAt, commitId: "commit-cas-1" };
  assert.equal(validateHeadAdvance(genesis, next, record).status, "ok");
  const invalidCases = [
    [null, next, record],
    [genesis, null, record],
    [genesis, next, null],
    [genesis, { ...next, generation: 3 }, record],
    [genesis, { ...next, lastRecordId: identity("record", "other-record") }, record],
    [genesis, { ...next, officialFingerprint: `sha256:${"0".repeat(64)}` }, record],
    [genesis, { ...next, generatedAt: "bad" }, record],
    [genesis, { ...next, commitId: " padded " }, record],
    [{ ...genesis, generation: 1 }, next, record],
    [{ ...genesis, generatedAt: "2026-10-03T12:00:00Z" }, next, record],
    [{ ...genesis, commitId: "commit-old" }, next, record],
  ];
  for (const [expected, candidate, appended] of invalidCases)
    assert.equal(validateHeadAdvance(expected, candidate, appended).status, "invalid");

  const store = { adapterId: "atomic-host", capabilityLevel: "atomic-host", heads: {
    async compareAndAppend(_token, expected, candidate, appended) {
      assert.equal(validateHeadAdvance(expected, candidate, appended).status, "ok");
      return { status: "ok", value: "advanced" };
    },
    async read(_context, chainId) {
      if (chainId === "absent") return { status: "unavailable", code: "not-found" };
      if (chainId === "unavailable") return { status: "unavailable", code: "unavailable" };
      if (chainId === "corrupt") return { status: "ok", value: { ...genesis, context: { ...context, taxpayerId: identity("taxpayer", "other") } } };
      return { status: "ok", value: genesis };
    },
  } };
  const token = { adapterId: "atomic-host", capabilityLevel: "atomic-host", context };
  assert.deepEqual(await compareAndAppendHead(store, token, genesis, next, record), { status: "ok", value: "advanced" });
  assert.equal((await compareAndAppendHead(store, { ...token, capabilityLevel: "standalone-test" }, genesis, next, record)).status, "invalid");
  assert.equal((await compareAndAppendHead(store, { ...token, adapterId: "other" }, genesis, next, record)).status, "invalid");
  assert.equal((await readHeadOrGenesis(store, context, "absent")).value.generation, 0);
  assert.equal((await readHeadOrGenesis(store, context, "unavailable")).code, "unavailable");
  assert.equal((await readHeadOrGenesis(store, context, "corrupt")).code, "corruption");
  assert.equal((await readHeadOrGenesis(store, context, "chain-cas")).status, "ok");
});

test("competing process head CAS admits exactly one successor", async () => {
  const genesis = genesisHead(context, "chain-process-race");
  const bytes = Buffer.from("competing-process-record");
  const record = { id: identity("record", "process-race-record"), context, schemaVersion: 1, editionId: context.editionId,
    kind: "alta", predecessorId: null, semanticDigest: sha256Digest(bytes), canonicalBytes: bytes,
    createdAt: "2026-10-03T12:00:00Z", sequence: 1 };
  const next = { ...genesis, generation: 1, lastRecordId: record.id, officialFingerprint: record.semanticDigest,
    generatedAt: record.createdAt, commitId: "process-race-commit" };
  let current = genesis;
  const store = { adapterId: "atomic-host", capabilityLevel: "atomic-host", heads: {
    async compareAndAppend(_token, expected, candidate) {
      if (current.generation !== expected.generation || current.lastRecordId?.value !== expected.lastRecordId?.value)
        return { status: "conflict", code: "compare-and-set-conflict" };
      current = candidate;
      return { status: "ok", value: "advanced" };
    },
  } };
  const token = { adapterId: "atomic-host", capabilityLevel: "atomic-host", context };
  const outcomes = await Promise.all([
    compareAndAppendHead(store, token, genesis, next, record),
    compareAndAppendHead(store, token, genesis, next, record),
  ]);
  assert.deepEqual(outcomes.map((item) => item.status).sort(), ["conflict", "ok"]);
  assert.equal(current.generation, 1);
  assert.equal(current.lastRecordId.value, record.id.value);
  recordP5FaultDetection("P5-FAULT-056", outcomes.filter((item) => item.status === "ok").length === 1 && current.generation === 1);
});

test("atomic adapter exceptions preserve an unknown outcome and require an acknowledged rollback", async () => {
  const invoke = (value) => commitFiscalPublication(value.ports, {
    context, commandId: "command-1", canonicalDigest: value.digest,
    publication: { publicationId: "publication-1", revision: 1, commandId: "command-1", canonicalDigest: value.digest,
      createdAt: "2026-10-03T12:00:00Z" },
    record: value.record, artifacts: [], evidence: [], journal: [], outbox: [], expectedHead: value.expectedHead, nextHead: value.nextHead,
  });

  const beginFailure = fixture();
  beginFailure.ports.hostUnitOfWork.begin = async () => { throw new Error("adapter-private-detail"); };
  assert.deepEqual(await invoke(beginFailure), { status: "unavailable", code: "unavailable" });

  const stageFailure = fixture();
  stageFailure.ports.records.append = async () => { throw new Error("adapter-private-detail"); };
  assert.deepEqual(await invoke(stageFailure), { status: "unavailable", code: "unavailable" });
  assert.equal(stageFailure.calls.at(-1)[0], "rollback");

  const rollbackUnknown = fixture();
  rollbackUnknown.ports.records.append = async () => ({ status: "unavailable", code: "unavailable" });
  rollbackUnknown.ports.hostUnitOfWork.rollback = async () => ({ status: "unavailable", code: "unavailable" });
  assert.deepEqual(await invoke(rollbackUnknown), { status: "indeterminate", code: "local-commit-indeterminate" });

  const commitUnknown = fixture();
  commitUnknown.ports.hostUnitOfWork.commit = async () => { throw new Error("acknowledgement-lost"); };
  assert.deepEqual(await invoke(commitUnknown), { status: "unavailable", code: "local-commit-not-applied" });
  assert.equal(commitUnknown.calls.some(([kind]) => kind === "rollback"), false);
});

test("seeded local commit cuts preserve atomic visibility and resolve unknown acknowledgement", async () => {
  const makeInput = (value, notifyOutbox) => {
    const artifactBytes = Buffer.from("fault-exact-request");
    const artifact = { descriptor: { id: identity("operation", "fault-artifact-operation"), context, schemaVersion: 1,
      artifactId: "fault-artifact", mediaType: "application/soap+xml", byteLength: artifactBytes.length,
      sha256: sha256Digest(artifactBytes), sha512: sha512Digest(artifactBytes), createdAt: "2026-10-03T12:00:00Z" }, bytes: artifactBytes };
    const evidence = { id: identity("operation", "fault-evidence-operation"), context, schemaVersion: 1, claimId: "fault-claim",
      subjectDigest: sha256Digest(Buffer.from("fault-subject")), verifierId: "verifier-1", profileId: "profile-1", result: "verified",
      supportingArtifactIds: ["fault-artifact"], validatedAt: "2026-10-03T12:00:00Z" };
    const journal = { id: identity("event", "fault-journal-event"), context, schemaVersion: 1, aggregateId: "fault-record", version: 1,
      eventCode: "fiscal-record-published", commandId: "command-1", causationId: null, correlationId: "fault-correlation",
      priorState: null, nextState: "committed", occurredAt: "2026-10-03T12:00:00Z", instantSource: "host",
      artifactIds: ["fault-artifact"], claimIds: ["fault-claim"], safeDiagnostics: [] };
    const outbox = { id: identity("operation", "fault-outbox-operation"), context, schemaVersion: 1, outboxId: "fault-outbox",
      recordIds: [value.record.id], artifactIds: ["fault-artifact"], operationId: "voluntary-submission", environment: "test",
      orderingScope: "chain-1", eligibleAt: "2026-10-03T12:00:00Z", state: "pending", version: 1,
      attemptCount: 0, fencingToken: 0, lastObservationId: null, reconciliationRequired: false };
    return { context, commandId: "command-1", canonicalDigest: value.digest,
      publication: { publicationId: "fault-publication", revision: 1, commandId: "command-1", canonicalDigest: value.digest,
        createdAt: "2026-10-03T12:00:00Z" }, record: value.record, artifacts: [artifact], evidence: [evidence], journal: [journal],
      outbox: [outbox], expectedHead: value.expectedHead, nextHead: value.nextHead, ...(notifyOutbox ? { notifyOutbox } : {}) };
  };
  const scenario = (fault) => {
    const value = fixture();
    const staged = [];
    const visible = [];
    const reservations = [];
    let injected = false;
    const mark = (id) => { if (fault === id) { injected = true; return true; } return false; };
    const stage = (kind, item) => { staged.push({ kind, item }); return { status: "ok", value: "created" }; };
    value.ports.records = { ...value.ports.records,
      async append(_token, record, binding) {
        if (mark("P5-FAULT-002")) return { status: "conflict", code: "idempotency-conflict" };
        reservations.push(binding.commandId);
        if (mark("P5-FAULT-005")) return { status: "unavailable", code: "unavailable" };
        if (mark("P5-FAULT-006")) { stage("record", record); return { status: "unavailable", code: "unavailable" }; }
        return stage("record", record);
      },
    };
    value.ports.artifacts = { ...value.ports.artifacts,
      async put(_token, descriptor, bytes) {
        if (mark("P5-FAULT-003")) return { status: "unavailable", code: "unavailable" };
        if (mark("P5-FAULT-004")) { stage("artifact", { descriptor, bytes }); return { status: "unavailable", code: "unavailable" }; }
        return stage("artifact", { descriptor, bytes });
      },
    };
    value.ports.evidence = { ...value.ports.evidence,
      async append(_token, claim) {
        if (mark("P5-FAULT-007")) return { status: "unavailable", code: "unavailable" };
        return stage("evidence", claim);
      },
    };
    value.ports.journal = { ...value.ports.journal,
      async append(_token, entry) {
        if (mark("P5-FAULT-008")) return { status: "unavailable", code: "unavailable" };
        return stage("journal", entry);
      },
    };
    value.ports.outbox = { ...value.ports.outbox,
      async append(_token, item) {
        if (mark("P5-FAULT-010")) return { status: "unavailable", code: "unavailable" };
        return stage("outbox", item);
      },
    };
    value.ports.heads = { ...value.ports.heads,
      async compareAndAppend(_token, expected, next) {
        if (mark("P5-FAULT-009")) return { status: "conflict", code: "compare-and-set-conflict" };
        return stage("head", { expected, next });
      },
    };
    value.ports.hostUnitOfWork = { ...value.ports.hostUnitOfWork,
      async begin(input) {
        if (mark("P5-FAULT-001")) return { status: "unavailable", code: "unavailable" };
        value.calls.push(["begin", value.tx.transactionId]);
        return { status: "ok", value: { ...value.tx, context: input.context, commandId: input.commandId, canonicalDigest: input.canonicalDigest } };
      },
      async stageHostPublication(_token, publication) { return stage("publication", publication); },
      async commit() {
        if (mark("P5-FAULT-011")) return { status: "unavailable", code: "commit-not-sent" };
        visible.push(...staged.splice(0));
        if (fault === "P5-FAULT-012" || fault === "P5-FAULT-013") {
          injected = true;
          return { status: "indeterminate", code: "unknown-commit" };
        }
        return { status: "ok", value: { commitId: "commit-1" } };
      },
      async rollback() { staged.length = 0; value.calls.push(["rollback", value.tx.transactionId]); return { status: "ok", value: "rolled-back" }; },
      async resolveUnknownCommit(input) {
        assert.equal(input.commandId, "command-1");
        assert.equal(input.canonicalDigest, value.digest);
        if (mark("P5-FAULT-013")) return { status: "unavailable", code: "readback-unavailable" };
        return { status: "ok", value: { committed: true, commitId: "commit-1" } };
      },
    };
    const notifyOutbox = fault === "P5-FAULT-014" ? async () => { injected = true; throw new Error("wakeup lost"); } : undefined;
    return { value, staged, visible, reservations, input: makeInput(value, notifyOutbox), triggered: () => injected };
  };

  for (const [faultId, expected] of [
    ["P5-FAULT-001", "unavailable"], ["P5-FAULT-002", "conflict"], ["P5-FAULT-003", "unavailable"],
    ["P5-FAULT-004", "unavailable"], ["P5-FAULT-005", "unavailable"], ["P5-FAULT-006", "unavailable"],
    ["P5-FAULT-007", "unavailable"], ["P5-FAULT-008", "unavailable"], ["P5-FAULT-009", "conflict"],
    ["P5-FAULT-010", "unavailable"], ["P5-FAULT-011", "unavailable"],
  ]) {
    const run = scenario(faultId);
    const result = await commitFiscalPublication(run.value.ports, run.input);
    assert.equal(run.triggered(), true, faultId);
    assert.equal(result.status, expected, faultId);
    assert.equal(run.visible.length, 0, faultId);
    assert.equal(run.staged.length, 0, faultId);
    recordP5FaultDetection(faultId, true);
  }

  const unknownApplied = scenario("P5-FAULT-012");
  const appliedResult = await commitFiscalPublication(unknownApplied.value.ports, unknownApplied.input);
  assert.deepEqual(appliedResult, { status: "committed", commitId: "commit-1" });
  assert.equal(unknownApplied.visible.length, 7);
  recordP5FaultDetection("P5-FAULT-012", unknownApplied.triggered());

  const unknownReadback = scenario("P5-FAULT-013");
  const readbackResult = await commitFiscalPublication(unknownReadback.value.ports, unknownReadback.input);
  assert.deepEqual(readbackResult, { status: "indeterminate", code: "local-commit-indeterminate" });
  assert.equal(unknownReadback.visible.length, 7);
  recordP5FaultDetection("P5-FAULT-013", unknownReadback.triggered());

  const wakeupFailure = scenario("P5-FAULT-014");
  const wakeupResult = await commitFiscalPublication(wakeupFailure.value.ports, wakeupFailure.input);
  assert.deepEqual(wakeupResult, { status: "committed", commitId: "commit-1" });
  assert.equal(wakeupFailure.visible.length, 7);
  recordP5FaultDetection("P5-FAULT-014", wakeupFailure.triggered());
});

test("unknown commit readback validates identity and keeps malformed outcomes indeterminate", async () => {
  const run = async (resolveUnknownCommit, rollback = async () => ({ status: "ok", value: "rolled-back" })) => {
    const value = fixture();
    value.ports.hostUnitOfWork.commit = async () => ({ status: "indeterminate", code: "unknown-commit" });
    value.ports.hostUnitOfWork.resolveUnknownCommit = resolveUnknownCommit;
    value.ports.hostUnitOfWork.rollback = rollback;
    return commitFiscalPublication(value.ports, {
      context, commandId: "command-1", canonicalDigest: value.digest,
      publication: { publicationId: "publication-1", revision: 1, commandId: "command-1", canonicalDigest: value.digest,
        createdAt: "2026-10-03T12:00:00Z" }, record: value.record, artifacts: [], evidence: [], journal: [], outbox: [],
      expectedHead: value.expectedHead, nextHead: value.nextHead,
    });
  };
  const indeterminate = { status: "indeterminate", code: "local-commit-indeterminate" };
  assert.deepEqual(await run(async () => { throw new Error("readback unavailable"); }), indeterminate);
  assert.deepEqual(await run(async () => ({ status: "ok", value: { committed: true, commitId: null } })), indeterminate);
  assert.deepEqual(await run(async () => ({ status: "ok", value: { committed: false, commitId: "contradictory" } })), indeterminate);

  const failedCommit = fixture();
  failedCommit.ports.hostUnitOfWork.commit = async () => ({ status: "unavailable", code: "unavailable" });
  failedCommit.ports.hostUnitOfWork.rollback = async () => ({ status: "unavailable", code: "unavailable" });
  assert.deepEqual(await commitFiscalPublication(failedCommit.ports, {
    context, commandId: "command-1", canonicalDigest: failedCommit.digest,
    publication: { publicationId: "publication-1", revision: 1, commandId: "command-1", canonicalDigest: failedCommit.digest,
      createdAt: "2026-10-03T12:00:00Z" }, record: failedCommit.record, artifacts: [], evidence: [], journal: [], outbox: [],
    expectedHead: failedCommit.expectedHead, nextHead: failedCommit.nextHead,
  }), indeterminate);
});
