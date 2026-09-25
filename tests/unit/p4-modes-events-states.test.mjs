import assert from "node:assert/strict";
import test from "node:test";
import { createIdentity } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";
import { createFiscalContext } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";
import { createFiscalInstant } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/date-time.js";
import { appendEvent } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/events.js";
import {
  canTransitionSubmission,
  isTerminalOutcome,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/states.js";
import {
  resolveMode,
  transitionMode,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/mode-tenure.js";
import {
  assertRecordIdentityDistinct,
  chainEligible,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/invariants.js";
import "../../evidence/runs/artifacts/build/verifactu/dist/domain/diagnostics.js";
import "../../evidence/runs/artifacts/build/verifactu/dist/index.js";

const f = () => {
  const id = (kind, value) => createIdentity(kind, value).value;
  return {
    id,
    context: createFiscalContext({
      tenantId: id("tenant", "t"),
      taxpayerId: id("taxpayer", "p"),
      installationId: id("installation", "i"),
      editionId: id("edition", "e"),
    }).value,
    at: createFiscalInstant("2025-01-01T00:00:00Z").value,
  };
};

test("mode tenures allow listed transitions, reject rollback and resolve explicit effective time", () => {
  const x = f();
  const start = {
    context: x.context,
    mode: "nonVerifactu",
    effectiveFrom: x.at,
    effectiveUntil: "2025-01-02T00:00:00Z",
    authorizationId: "auth",
    evidenceId: "ev",
  };
  assert.equal(transitionMode(null, start).status, "ok");
  const pending = {
    ...start,
    mode: "transitionPending",
    effectiveFrom: start.effectiveUntil,
    effectiveUntil: null,
  };
  assert.equal(transitionMode(start, pending).status, "ok");
  assert.equal(
    transitionMode(
      { ...start, mode: "verifactu" },
      { ...pending, mode: "nonVerifactu" },
    ).status,
    "invalid",
  );
  assert.equal(resolveMode([start], x.at, x.context).status, "ok");
  assert.equal(resolveMode([], x.at, x.context).status, "indeterminate");
  assert.equal(
    transitionMode(null, { ...start, mode: "transitionPending" }).status,
    "invalid",
  );
  assert.equal(
    transitionMode(null, { ...start, authorizationId: "" }).status,
    "invalid",
  );
  assert.equal(
    transitionMode(null, { ...start, evidenceId: "" }).status,
    "invalid",
  );
  assert.equal(
    transitionMode(null, { ...start, mode: "unrecognized" }).status,
    "invalid",
  );
  assert.equal(
    transitionMode({ ...start, effectiveUntil: null }, pending).status,
    "invalid",
  );
  assert.equal(
    transitionMode({ ...start, effectiveUntil: "bad" }, pending).status,
    "invalid",
  );
  assert.equal(
    transitionMode({ ...start, effectiveUntil: start.effectiveFrom }, pending)
      .status,
    "invalid",
  );
  assert.equal(
    transitionMode(start, { ...pending, effectiveUntil: pending.effectiveFrom })
      .status,
    "invalid",
  );
  assert.equal(
    transitionMode(start, {
      ...pending,
      context: { ...x.context, tenantId: x.id("tenant", "other") },
    }).status,
    "invalid",
  );
  assert.equal(
    transitionMode(
      { ...start, mode: "verifactu" },
      { ...pending, mode: "nonVerifactu" },
      true,
    ).status,
    "ok",
  );
});

test("regulated events are append-only and separate from billing chain sequencing", () => {
  const x = f();
  const event = {
    id: x.id("event", "e1"),
    context: x.context,
    code: "START",
    occurredAt: x.at,
    observedAt: x.at,
    previousEventId: null,
  };
  const sequence = { context: x.context, events: [] };
  assert.equal(appendEvent(sequence, event).status, "ok");
  assert.equal(
    appendEvent(sequence, { ...event, previousEventId: event.id }).status,
    "invalid",
  );
  const first = appendEvent(sequence, event).value;
  const second = {
    ...event,
    id: x.id("event", "e2"),
    code: "STOP",
    occurredAt: "2025-01-02T00:00:00Z",
    previousEventId: event.id,
  };
  assert.equal(appendEvent(first, second).status, "ok");
  assert.equal(
    appendEvent(first, { ...second, occurredAt: "2024-12-31T00:00:00Z" })
      .status,
    "invalid",
  );
  assert.equal(
    appendEvent(first, { ...second, previousEventId: x.id("event", "other") })
      .status,
    "invalid",
  );
  assert.equal(
    appendEvent(first, { ...second, code: "not safe" }).status,
    "invalid",
  );
  assert.equal(
    appendEvent(first, { ...second, id: event.id }).status,
    "invalid",
  );
  assert.equal(
    appendEvent(first, { ...second, occurredAt: "bad" }).status,
    "invalid",
  );
});

test("terminal operation outcomes and retry state transitions stay distinct", () => {
  assert.equal(canTransitionSubmission("attempting", "rejected"), true);
  assert.equal(
    canTransitionSubmission("attempting", "indeterminateOutcome"),
    true,
  );
  assert.equal(canTransitionSubmission("rejected", "queued"), false);
  assert.equal(canTransitionSubmission("retryableFailure", "queued"), true);
  assert.equal(isTerminalOutcome("rejected"), true);
  assert.equal(isTerminalOutcome("conflict"), true);
  assert.equal(isTerminalOutcome("unavailable"), true);
  assert.equal(isTerminalOutcome("indeterminate"), true);
  assert.equal(isTerminalOutcome("accepted"), true);
  assert.equal(canTransitionSubmission("bogus", "queued"), false);
  assert.equal(canTransitionSubmission("queued", "bogus"), false);
  assert.equal(
    chainEligible(
      { status: "rejected", diagnostics: ["invalid"] },
      f().context,
    ),
    false,
  );
  assert.equal(
    chainEligible(
      { status: "indeterminate", diagnostics: [], requiredEvidence: ["proof"] },
      f().context,
    ),
    false,
  );
  assert.equal(
    chainEligible(
      { status: "accepted", value: { context: f().context } },
      f().context,
    ),
    true,
  );
});

test("record identity invariant permits null or distinct predecessors only", () => {
  const x = f();
  const id = x.id("invoice", "one");
  assert.equal(assertRecordIdentityDistinct({ id, predecessorId: null }), true);
  assert.equal(
    assertRecordIdentityDistinct({ id, predecessorId: x.id("invoice", "two") }),
    true,
  );
  assert.equal(assertRecordIdentityDistinct({ id, predecessorId: id }), false);
});
