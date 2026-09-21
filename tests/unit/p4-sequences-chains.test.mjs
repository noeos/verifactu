import assert from "node:assert/strict";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    "../../evidence/runs/artifacts/build/verifactu/dist/index.js"
);
const id = (kind, value) => api.identity(kind, value).value;
const at = (value) => api.parseFiscalInstant(value).value;
const date = api.parseFiscalDate("2026-09-21").value;
const taxpayerId = id("taxpayer", "taxpayer-1");
const installationId = id("installation", "installation-1");
const makeRecord = (suffix) => ({
  kind: "alta",
  id: id("record", `record-${suffix}`),
  taxpayerId,
  issuedOn: date,
  recordedAt: at(`2026-09-21T12:00:0${suffix}Z`),
  invoiceNumber: `F-${suffix}`,
  total: api.parseDecimal(`${suffix}.00`).value,
});
const digest = (record, predecessor) => {
  const source = `${record.id}|${record.invoiceNumber}|${predecessor ?? "GENESIS"}`;
  let accumulator = 0n;
  for (const point of source) {
    accumulator =
      (accumulator * 257n + BigInt(point.codePointAt(0))) % (1n << 256n);
  }
  return accumulator.toString(16).padStart(64, "0");
};

test("P4-CB-014 sequence rejects gaps, duplicates, chronology and scope changes", () => {
  const entries = [1, 2].map((value) => ({
    position: api.sequencePosition(value).value,
    recordId: id("record", `record-${value}`),
    taxpayerId,
    installationId,
    occurredAt: at(`2026-09-21T12:00:0${value}Z`),
  }));
  assert.equal(api.validateScopedSequence(entries).status, "succeeded");
  const gap = api.validateScopedSequence([
    { ...entries[0], position: { value: 2 } },
  ]);
  assert.equal(gap.status, "conflict");
  assert.equal(gap.diagnostics[0].parameters.expected, 1);
  assert.equal(gap.diagnostics[0].parameters.actual, 2);
  assert.equal(
    api.validateScopedSequence([
      entries[0],
      { ...entries[1], recordId: entries[0].recordId },
    ]).status,
    "conflict",
  );
  assert.equal(
    api.validateScopedSequence([entries[1], entries[0]]).status,
    "conflict",
  );
  assert.equal(
    api.validateScopedSequence([
      entries[0],
      { ...entries[1], occurredAt: entries[0].occurredAt },
    ]).status,
    "conflict",
  );
  assert.equal(
    api.validateScopedSequence([
      entries[0],
      { ...entries[1], taxpayerId: id("taxpayer", "other") },
    ]).status,
    "conflict",
  );
});

test("P4-CB-015 genesis, predecessor and current digests are distinct", () => {
  const chain = api.buildChain([makeRecord(1), makeRecord(2)], digest);
  assert.equal(chain[0].predecessor.kind, "genesis");
  assert.equal(chain[1].predecessor.kind, "link");
  assert.equal(chain[1].predecessor.digest, chain[0].currentDigest);
  assert.notEqual(chain[1].currentDigest, chain[1].predecessor.digest);
  assert.equal(api.verifyChain(chain, digest).status, "succeeded");
});

test("P4-CB-016 complete verification rejects gaps, forks, mutation and wrong head", () => {
  const chain = api.buildChain([makeRecord(1), makeRecord(2)], digest);
  assert.equal(
    api.verifyChain([{ ...chain[0], position: 2 }], digest).status,
    "conflict",
  );
  assert.equal(
    api.verifyChain(
      [{ ...chain[0], predecessor: chain[1].predecessor }],
      digest,
    ).diagnostics[0].code,
    "DIAG-CHAIN-PREDECESSOR",
  );
  assert.equal(
    api.verifyChain(
      [
        chain[0],
        {
          ...chain[1],
          predecessor: {
            ...chain[1].predecessor,
            recordId: id("record", "wrong-record"),
          },
        },
      ],
      digest,
    ).diagnostics[0].code,
    "DIAG-CHAIN-PREDECESSOR",
  );
  assert.equal(
    api.verifyChain(
      [chain[0], { ...chain[1], predecessor: { kind: "genesis" } }],
      digest,
    ).diagnostics[0].code,
    "DIAG-CHAIN-PREDECESSOR",
  );
  assert.equal(
    api.verifyChain(
      [
        chain[0],
        {
          ...chain[1],
          predecessor: { ...chain[1].predecessor, digest: "f".repeat(64) },
        },
      ],
      digest,
    ).status,
    "conflict",
  );
  assert.equal(
    api.verifyChain(
      [chain[0], { ...chain[1], currentDigest: "e".repeat(64) }],
      digest,
    ).status,
    "conflict",
  );
  assert.equal(
    api.verifyChain(chain, digest, "d".repeat(64)).diagnostics[0].code,
    "DIAG-CHAIN-HEAD",
  );
  assert.equal(
    api.verifyChain(
      [chain[0], { ...chain[1], record: chain[0].record }],
      digest,
    ).diagnostics[0].code,
    "DIAG-CHAIN-DUPLICATE",
  );
});

test("digest and position constructors reject malformed values", () => {
  assert.equal(api.recordDigest("abcd").status, "invalid");
  assert.equal(api.recordDigest("a".repeat(64)).status, "succeeded");
  assert.equal(api.sequencePosition(0).status, "invalid");
  assert.equal(api.nextSequencePosition(null).value, 1);
  assert.equal(api.nextSequencePosition({ value: 1 }).value, 2);
  assert.equal(api.validateSequence([]).status, "succeeded");
  assert.equal(api.verifyChain([], digest).value.head, null);
  const emptyHead = api.verifyChain([], digest, "a".repeat(64));
  assert.equal(emptyHead.diagnostics[0].code, "DIAG-CHAIN-HEAD");
  assert.equal(emptyHead.diagnostics[0].parameters.index, -1);
});
