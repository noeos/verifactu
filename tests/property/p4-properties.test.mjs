import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { canTransitionSubmission } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/states.js";
import {
  createChainLink,
  verifyChainLink,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/chains.js";
import { createDecimal } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/decimal.js";
import {
  createFiscalContext,
  sameContext,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";
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
function propertyReport(t, property, corpus) {
  t.diagnostic(
    `${property} executions=4096 seed=${SEED} discards=0 corpusSha256=${corpus.digest("hex")}`,
  );
}
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

test(`P4-PROP-001 staged decode failures do not advance (seed=${SEED})`, (t) => {
  const corpus = createHash("sha256");
  for (let index = 0; index < 4096; index += 1) {
    const malformed = new TextEncoder().encode(
      `{"id":"${index}","id":"${index + 1}"}`,
    );
    corpus.update(malformed);
    const result = decodeJson(malformed, { required: ["id"] });
    assert.equal(result.status, "invalid", `seed=${SEED} case=${index}`);
    assert.equal(
      result.diagnostics[0].code,
      "DIAG-JSON-DUPLICATE",
      `seed=${SEED} case=${index}`,
    );
    assert.equal(
      Object.hasOwn(result, "value"),
      false,
      `seed=${SEED} case=${index}`,
    );
  }
  propertyReport(t, "P4-PROP-001", corpus);
});

test("P4-PROP-008 plans are deterministic and deeply immutable", (t) => {
  const corpus = createHash("sha256");
  for (let index = 0; index < 4096; index += 1) {
    const value = "operation-" + index + "-" + Math.floor(next() * 0x7fffffff);
    corpus.update(value);
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
  propertyReport(t, "P4-PROP-008", corpus);
});

test("P4-PROP-009 projection preserves presence and order", (t) => {
  const corpus = createHash("sha256");
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
    corpus.update(JSON.stringify(fields));
    const projected = projectOfficialFields(fields);
    assert.equal(projected.status, "ok", "case=" + index);
    const expected = fields
      .filter((field) => field.value.presence !== "absent")
      .sort((left, right) => left.order - right.order)
      .map((field) => ({
        name: field.name,
        order: field.order,
        presence: field.value.presence,
        value:
          field.value.presence === "value"
            ? field.value.value
            : field.value.presence === "empty"
              ? ""
              : field.value.presence === "zero"
                ? "0"
                : null,
      }));
    assert.deepEqual(projected.value, expected, "case=" + index);
  }
  propertyReport(t, "P4-PROP-009", corpus);
});

test(`P4-PROP-002 typed identities never substitute (seed=${SEED})`, (t) => {
  const corpus = createHash("sha256");
  for (let index = 0; index < 4096; index += 1) {
    const value = `id-${Math.floor(next() * 0x7fffffff)}-${index}`;
    corpus.update(value);
    const tenant = id("tenant", value);
    const taxpayer = id("taxpayer", value);
    assert.equal(sameIdentity(tenant, id("tenant", value)), true);
    assert.equal(
      sameIdentity(tenant, taxpayer),
      false,
      `seed=${SEED} case=${index}`,
    );
    const baseContext = createFiscalContext({
      tenantId: id("tenant", `tenant-${value}`),
      taxpayerId: id("taxpayer", `taxpayer-${value}`),
      installationId: id("installation", `installation-${value}`),
      editionId: id("edition", `edition-${value}`),
    }).value;
    assert.equal(
      sameContext(baseContext, createFiscalContext(baseContext).value),
      true,
      `seed=${SEED} case=${index} context=clone`,
    );
    for (const [key, kind] of [
      ["tenantId", "tenant"],
      ["taxpayerId", "taxpayer"],
      ["installationId", "installation"],
      ["editionId", "edition"],
    ]) {
      const changed = createFiscalContext({
        ...baseContext,
        [key]: id(kind, `${baseContext[key].value}-other`),
      }).value;
      corpus.update(`${key}\0${changed[key].value}`);
      assert.equal(
        sameContext(baseContext, changed),
        false,
        `seed=${SEED} case=${index} context=${key}`,
      );
    }
  }
  propertyReport(t, "P4-PROP-002", corpus);
});

test(`P4-PROP-003 decimal parse and representation preserve exact lexical value (seed=${SEED})`, (t) => {
  const corpus = createHash("sha256");
  for (let index = 0; index < 4096; index += 1) {
    const whole = Math.floor(next() * 1_000_000);
    const fraction = Math.floor(next() * 100)
      .toString()
      .padStart(2, "0");
    const text = `${whole}.${fraction}`;
    corpus.update(text);
    const policy = { maxIntegerDigits: 6, maxScale: 2 };
    const parsed = createDecimal(text, policy);
    assert.equal(parsed.status, "ok", `seed=${SEED} case=${index}`);
    assert.equal(parsed.value.text, text, `seed=${SEED} case=${index}`);
    assert.equal(
      parsed.value.coefficient,
      BigInt(`${whole}${fraction}`),
      `seed=${SEED} case=${index}`,
    );
    const reparsed = createDecimal(parsed.value.text, policy);
    assert.equal(reparsed.status, "ok", `seed=${SEED} case=${index}`);
    assert.deepEqual(reparsed.value, parsed.value, `seed=${SEED} case=${index}`);
  }
  propertyReport(t, "P4-PROP-003", corpus);
});

test(`P4-PROP-004 date and instant acceptance remains exact (seed=${SEED})`, (t) => {
  const corpus = createHash("sha256");
  for (let index = 0; index < 4096; index += 1) {
    const year = 2020 + Math.floor(next() * 10);
    const month = 1 + Math.floor(next() * 12);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const monthDays = [
      31,
      leap ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];
    const day = 1 + Math.floor(next() * monthDays[month - 1]);
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const hour = Math.floor(next() * 24);
    const minute = Math.floor(next() * 60);
    const second = Math.floor(next() * 60);
    const offsetMinutes = Math.floor(next() * 1681) - 840;
    const offsetSign = offsetMinutes < 0 ? "-" : "+";
    const offsetHour = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMinute = Math.abs(offsetMinutes) % 60;
    const fractionalNanos = Math.floor(next() * 1_000_000_000)
      .toString()
      .padStart(9, "0")
      .replace(/0+$/u, "");
    const fraction = fractionalNanos ? `.${fractionalNanos}` : "";
    const at = `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}${fraction}${offsetSign}${String(offsetHour).padStart(2, "0")}:${String(offsetMinute).padStart(2, "0")}`;
    corpus.update(date).update(at);
    const parsedDate = createFiscalDate(date);
    assert.equal(parsedDate.status, "ok", `seed=${SEED} case=${index}`);
    assert.equal(parsedDate.value, date, `seed=${SEED} case=${index}`);
    assert.equal(
      createFiscalDate(parsedDate.value).value,
      parsedDate.value,
      `seed=${SEED} case=${index}`,
    );
    const parsedInstant = createFiscalInstant(at);
    assert.equal(parsedInstant.status, "ok", `seed=${SEED} case=${index}`);
    assert.equal(parsedInstant.value, at, `seed=${SEED} case=${index}`);
    assert.equal(
      createFiscalInstant(parsedInstant.value).value,
      parsedInstant.value,
      `seed=${SEED} case=${index}`,
    );
  }
  propertyReport(t, "P4-PROP-004", corpus);
});

test(`P4-PROP-005 submission transition table is total and closed (seed=${SEED})`, (t) => {
  const corpus = createHash("sha256");
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
  const allowedTransitions = {
    notEligible: ["queued"],
    queued: ["attempting"],
    attempting: [
      "accepted",
      "acceptedWithQualification",
      "rejected",
      "retryableFailure",
      "indeterminateOutcome",
    ],
    accepted: [],
    acceptedWithQualification: [],
    rejected: [],
    retryableFailure: ["queued"],
    indeterminateOutcome: ["queued", "accepted", "rejected"],
  };
  let pairOffset = 0;
  for (let index = 0; index < 4096; index += 1) {
    if (index % (states.length * states.length) === 0) {
      pairOffset = Math.floor(next() * states.length * states.length);
    }
    const pairIndex =
      (pairOffset + (index % (states.length * states.length))) %
      (states.length * states.length);
    const from = states[Math.floor(pairIndex / states.length)];
    const to = states[pairIndex % states.length];
    corpus.update(`${from}\0${to}`);
    assert.equal(
      canTransitionSubmission(from, to),
      allowedTransitions[from].includes(to),
      `seed=${SEED} case=${index}`,
    );
  }
  propertyReport(t, "P4-PROP-005", corpus);
});

test(`P4-PROP-006 mode tenures preserve adjacent interval boundaries (seed=${SEED})`, (t) => {
  const corpus = createHash("sha256");
  for (let index = 0; index < 4096; index += 1) {
    const day = 1 + Math.floor(next() * 27);
    const followingDay = day + 1;
    corpus.update(`${day}\0${followingDay}`);
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
  propertyReport(t, "P4-PROP-006", corpus);
});

test(`P4-PROP-007 chain recomputation detects a one-byte mutation (seed=${SEED})`, (t) => {
  const corpus = createHash("sha256");
  for (let index = 0; index < 4096; index += 1) {
    const payload = new TextEncoder().encode(`record=${index};seed=${SEED}`);
    corpus.update(payload);
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
  propertyReport(t, "P4-PROP-007", corpus);
});
