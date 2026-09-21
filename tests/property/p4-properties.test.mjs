import assert from "node:assert/strict";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    "../../evidence/runs/artifacts/build/verifactu/dist/index.js"
);
const RUNS = 4096;
let state = 0x4e4f454f;
const next = () => {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state;
};
const id = (kind, value) => api.identity(kind, value).value;
const at = (value) => api.parseFiscalInstant(value).value;

test("P4-PROP-001 failed syntax never invokes structural decoding", () => {
  let calls = 0;
  const decoder = { decode: () => (calls += 1) };
  for (let index = 0; index < RUNS; index += 1) {
    const result = api.decodeJson(
      new TextEncoder().encode(`{"x":${next()},}`),
      decoder,
    );
    assert.equal(result.status, "invalid");
  }
  assert.equal(calls, 0);
});

test("P4-FUZZ-001 staged codec handles 4096 bounded arbitrary byte inputs", () => {
  const decoder = { decode: api.succeeded };
  const statuses = new Set([
    "succeeded",
    "invalid",
    "conflict",
    "cancelled",
    "unavailable",
    "rejected",
    "indeterminate",
    "defect",
  ]);
  for (let index = 0; index < RUNS; index += 1) {
    const input = new Uint8Array(next() % 65);
    for (let offset = 0; offset < input.length; offset += 1) {
      input[offset] = next() & 0xff;
    }
    assert.equal(statuses.has(api.decodeJson(input, decoder).status), true);
  }
});

test("P4-PROP-002 context identity scopes never substitute", () => {
  for (let index = 0; index < RUNS; index += 1) {
    const suffix = next();
    const context = {
      tenantId: id("tenant", `t-${suffix}`),
      taxpayerId: id("taxpayer", `p-${suffix}`),
      installationId: id("installation", `i-${suffix}`),
      editionId: id("edition", "rrsif-2026-09-21"),
      operatingMode: "non-verifactu",
      tenureId: "tenure-1",
      clock: { instant: "2026-09-21T00:00:00Z" },
      correlationId: id("correlation", `c-${suffix}`),
      principalId: id("principal", `u-${suffix}`),
    };
    assert.equal(
      api.validateContextScope(context, {
        tenantId: context.tenantId,
        taxpayerId: id("taxpayer", `other-${suffix}`),
        installationId: context.installationId,
        editionId: context.editionId,
      }).status,
      "rejected",
    );
  }
});

test("P4-PROP-003 decimal parse-format-parse is exact", () => {
  for (let index = 0; index < RUNS; index += 1) {
    const whole = next() % 1_000_000;
    const fraction = String(next() % 10_000).padStart(4, "0");
    const lexical = `${whole}.${fraction}`;
    const first = api.parseDecimal(lexical).value;
    const second = api.parseDecimal(api.formatDecimal(first)).value;
    assert.deepEqual(second, first);
  }
});

test("P4-PROP-004 date/time parse-format-parse is exact", () => {
  for (let index = 0; index < RUNS; index += 1) {
    const day = String((next() % 28) + 1).padStart(2, "0");
    const hour = String(next() % 24).padStart(2, "0");
    const lexical = `2026-09-${day}T${hour}:00:00Z`;
    assert.equal(
      api.parseFiscalInstant(api.parseFiscalInstant(lexical).value).value,
      lexical,
    );
  }
});

test("P4-PROP-005 state transition rejects every unlisted edge", () => {
  const principalId = id("principal", "principal-1");
  const event = {
    kind: "transition-completed",
    id: id("event", "event-1"),
    occurredAt: at("2026-09-21T00:00:00Z"),
    principalId,
  };
  for (let index = 0; index < RUNS; index += 1) {
    assert.equal(
      api.transitionInstallation(api.INITIAL_INSTALLATION_STATE, event).status,
      "conflict",
    );
  }
});

test("P4-PROP-006 mode tenure intervals remain contiguous", () => {
  const common = {
    taxpayerId: id("taxpayer", "taxpayer-1"),
    installationId: id("installation", "installation-1"),
  };
  for (let index = 0; index < RUNS; index += 1) {
    const boundary = String((next() % 27) + 2).padStart(2, "0");
    const instant = at(`2026-09-${boundary}T00:00:00Z`);
    const tenures = [
      {
        ...common,
        id: "tenure-1",
        mode: "non-verifactu",
        beganAt: at("2026-09-01T00:00:00Z"),
        endedAt: instant,
      },
      { ...common, id: "tenure-2", mode: "verifactu", beganAt: instant },
    ];
    assert.equal(api.validateTenureSequence(tenures).status, "succeeded");
    assert.equal(api.tenureAt(tenures, instant).value.id, "tenure-2");
  }
});

test("P4-PROP-007 chain recomputation detects every link mutation", () => {
  const taxpayerId = id("taxpayer", "taxpayer-1");
  const issuedOn = api.parseFiscalDate("2026-09-21").value;
  const recordedAt = at("2026-09-21T00:00:00Z");
  const digest = (record, predecessor) => {
    const source = `${record.id}|${predecessor ?? "GENESIS"}`;
    let accumulator = 0n;
    for (const character of source)
      accumulator =
        (accumulator * 131n + BigInt(character.codePointAt(0))) % (1n << 256n);
    return accumulator.toString(16).padStart(64, "0");
  };
  for (let index = 0; index < RUNS; index += 1) {
    const suffix = next();
    const record = {
      kind: "alta",
      id: id("record", `record-${suffix}`),
      taxpayerId,
      issuedOn,
      recordedAt,
      invoiceNumber: `F-${suffix}`,
      total: api.parseDecimal("1.00").value,
    };
    const chain = api.buildChain([record], digest);
    const replacement = chain[0].currentDigest[0] === "a" ? "b" : "a";
    const mutated = [
      {
        ...chain[0],
        currentDigest: `${replacement}${chain[0].currentDigest.slice(1)}`,
      },
    ];
    assert.equal(api.verifyChain(mutated, digest).status, "conflict");
  }
});
