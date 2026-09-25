import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { canTransitionSubmission } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/states.js";
import {
  createChainLink,
  verifyChainLink,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/chains.js";
import { createDecimal } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/decimal.js";
import { createFiscalContext } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";
import {
  createFiscalDate,
  createFiscalInstant,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/date-time.js";
import {
  createIdentity,
  sameIdentity,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";
import { decodeJson } from "../../evidence/runs/artifacts/build/verifactu/dist/contracts/staged-codec.js";
import { transitionMode } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/mode-tenure.js";
import { createOperationPlan } from "../../evidence/runs/artifacts/build/verifactu/dist/application/operation-plan.js";
import { projectOfficialFields } from "../../evidence/runs/artifacts/build/verifactu/dist/application/official-projection.js";

const SEED = 0x50444101;
function random(seed = SEED) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}
const next = random();
const id = (kind, value) => createIdentity(kind, value).value;
const context = createFiscalContext({
  tenantId: id("tenant", "property-tenant"),
  taxpayerId: id("taxpayer", "property-taxpayer"),
  installationId: id("installation", "property-installation"),
  editionId: id("edition", "property-edition"),
}).value;
const instant = (day) =>
  createFiscalInstant(`2025-01-${String(day).padStart(2, "0")}T00:00:00Z`)
    .value;
const digest = (bytes) =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

test(`P4-PROP-001 staged decode failures do not advance (seed=${SEED})`, () => {
  for (let index = 0; index < 4096; index += 1) {
    const malformed = new TextEncoder().encode(
      `{"id":"${index}","id":"${index + 1}"}`,
    );
    const result = decodeJson(malformed, { required: ["id"] });
    assert.equal(result.status, "invalid", `seed=${SEED} case=${index}`);
    assert.equal(
      result.diagnostics[0].code,
      "DIAG-JSON-DUPLICATE",
      `seed=${SEED} case=${index}`,
    );
  }
});

test("P4-PROP-008 plans are deterministic and deeply immutable", () => {
  for (let index = 0; index < 4096; index += 1) {
    const value = "operation-" + index + "-" + Math.floor(next() * 0x7fffffff);
    const input = {
      operationId: id("operation", value),
      context,
      editionId: context.editionId,
      expectedHead: index % 2 === 0 ? null : "head-" + index,
      expiresAt: instant(1),
      actions: ["validate", "project", "fingerprint"],
    };
    const first = createOperationPlan(input);
    const second = createOperationPlan(input);
    assert.equal(first.status, "ok", "case=" + index);
    assert.deepEqual(first.value, second.value, "case=" + index);
    assert.equal(
      JSON.stringify(first.value),
      JSON.stringify(second.value),
      "case=" + index,
    );
    assert.equal(Object.isFrozen(first.value), true, "case=" + index);
    assert.equal(Object.isFrozen(first.value.context), true, "case=" + index);
    assert.equal(
      Object.isFrozen(first.value.context.tenantId),
      true,
      "case=" + index,
    );
    assert.equal(
      Object.isFrozen(first.value.operationId),
      true,
      "case=" + index,
    );
    assert.equal(Object.isFrozen(first.value.actions), true, "case=" + index);
  }
});

test("P4-PROP-009 projection preserves presence and order", () => {
  const presences = ["value", "empty", "zero", "nil", "absent"];
  for (let index = 0; index < 4096; index += 1) {
    const presence = presences[Math.floor(next() * presences.length)];
    const secondPresence = presences[Math.floor(next() * presences.length)];
    const fields = [
      {
        name: "second",
        order: 2,
        value:
          secondPresence === "value"
            ? { presence: secondPresence, value: "v-" + index }
            : { presence: secondPresence },
        allowAbsent: true,
        allowNil: true,
      },
      {
        name: "first",
        order: 1,
        value:
          presence === "value"
            ? { presence, value: String(index) }
            : { presence },
        allowAbsent: true,
        allowNil: true,
      },
    ];
    const projected = projectOfficialFields(fields);
    assert.equal(projected.status, "ok", "case=" + index);
    assert.deepEqual(
      projected.value.map((field) => field.name),
      projected.value
        .map((field) => field.name)
        .sort((a, b) => (a === "first" ? -1 : b === "first" ? 1 : 0)),
      "case=" + index,
    );
    assert.equal(
      projected.value.some((field) => field.name === "first"),
      presence !== "absent",
      "case=" + index,
    );
    assert.equal(
      projected.value.some((field) => field.name === "second"),
      secondPresence !== "absent",
      "case=" + index,
    );
    const first = projected.value.find((field) => field.name === "first");
    if (first) assert.equal(first.presence, presence, "case=" + index);
  }
});

test(`P4-PROP-002 typed identities never substitute (seed=${SEED})`, () => {
  for (let index = 0; index < 4096; index += 1) {
    const value = `id-${Math.floor(next() * 0x7fffffff)}-${index}`;
    const tenant = id("tenant", value);
    const taxpayer = id("taxpayer", value);
    assert.equal(
      sameIdentity(tenant, taxpayer),
      false,
      `seed=${SEED} case=${index}`,
    );
  }
});

test(`P4-PROP-003 decimal parse and representation preserve exact lexical value (seed=${SEED})`, () => {
  for (let index = 0; index < 4096; index += 1) {
    const whole = Math.floor(next() * 1_000_000);
    const fraction = Math.floor(next() * 100)
      .toString()
      .padStart(2, "0");
    const text = `${whole}.${fraction}`;
    const parsed = createDecimal(text, { maxIntegerDigits: 6, maxScale: 2 });
    assert.equal(parsed.status, "ok", `seed=${SEED} case=${index}`);
    assert.equal(parsed.value.text, text, `seed=${SEED} case=${index}`);
    assert.equal(
      parsed.value.coefficient,
      BigInt(`${whole}${fraction}`),
      `seed=${SEED} case=${index}`,
    );
  }
});

test(`P4-PROP-004 date and instant acceptance remains exact (seed=${SEED})`, () => {
  for (let index = 0; index < 4096; index += 1) {
    const year = 2020 + Math.floor(next() * 10);
    const month = 1 + Math.floor(next() * 12);
    const date = `${year}-${String(month).padStart(2, "0")}-01`;
    const at = `${date}T12:30:45Z`;
    assert.equal(
      createFiscalDate(date).value,
      date,
      `seed=${SEED} case=${index}`,
    );
    assert.equal(
      createFiscalInstant(at).value,
      at,
      `seed=${SEED} case=${index}`,
    );
  }
});

test(`P4-PROP-005 submission transition table is total and closed (seed=${SEED})`, () => {
  const states = [
    "notEligible",
    "queued",
    "attempting",
    "accepted",
    "acceptedWithQualification",
    "rejected",
    "retryableFailure",
    "indeterminateOutcome",
  ];
  for (let index = 0; index < 4096; index += 1) {
    const from = states[Math.floor(next() * states.length)];
    const to = states[Math.floor(next() * states.length)];
    assert.equal(
      typeof canTransitionSubmission(from, to),
      "boolean",
      `seed=${SEED} case=${index}`,
    );
  }
});

test(`P4-PROP-006 mode tenures preserve adjacent interval boundaries (seed=${SEED})`, () => {
  for (let index = 0; index < 4096; index += 1) {
    const day = 1 + Math.floor(next() * 27);
    const followingDay = day + 1;
    const first = {
      context,
      mode: "nonVerifactu",
      effectiveFrom: instant(day),
      effectiveUntil: instant(followingDay),
      authorizationId: "a",
      evidenceId: "e",
    };
    const second = {
      ...first,
      mode: "transitionPending",
      effectiveFrom: instant(followingDay),
      effectiveUntil: null,
    };
    assert.equal(
      transitionMode(first, second).status,
      "ok",
      `seed=${SEED} case=${index}`,
    );
    assert.equal(
      transitionMode(first, {
        ...second,
        effectiveFrom: instant(followingDay - 1),
      }).status,
      "invalid",
      `seed=${SEED} case=${index}`,
    );
  }
});

test(`P4-PROP-007 chain recomputation detects a one-byte mutation (seed=${SEED})`, () => {
  for (let index = 0; index < 4096; index += 1) {
    const payload = new TextEncoder().encode(`record=${index};seed=${SEED}`);
    const link = createChainLink(
      context,
      id("record", `r${index}`),
      null,
      payload,
      digest,
    );
    assert.equal(link.status, "ok", `seed=${SEED} case=${index}`);
    const changed = payload.slice();
    changed[0] = changed[0] === 0x78 ? 0x79 : 0x78;
    assert.equal(
      verifyChainLink(link.value, context, null, changed, digest).status,
      "invalid",
      `seed=${SEED} case=${index}`,
    );
  }
});
