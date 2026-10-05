import assert from "node:assert/strict";
import test from "node:test";
import { createSafeOperationalEvent, emitSafeOperationalEvent, opaqueIncidentReference } from "../../evidence/runs/artifacts/build/verifactu/dist/operations/safe-observability.js";
import { decideRunbook } from "../../evidence/runs/artifacts/build/verifactu/dist/operations/runbook-decisions.js";
import { recordP5FaultDetection } from "../support/p5-fault-evidence.mjs";

test("operational event has bounded fields and rejects taxpayer or payload identifiers", () => {
  const safe = createSafeOperationalEvent({ eventId: opaqueIncidentReference(Buffer.from("synthetic")), category: "reconciliation",
    code: "DIAG-RECONCILIATION-REQUIRED", occurredAt: "2026-10-03T12:00:00.000Z", count: 1 });
  assert.ok(safe);
  assert.equal(JSON.stringify(safe).includes("synthetic"), false);
  assert.equal(createSafeOperationalEvent({ eventId: "taxpayer-ES123", category: "reconciliation",
    code: "DIAG-RECONCILIATION-REQUIRED", occurredAt: "2026-10-03T12:00:00.000Z" }), null);
  assert.equal(createSafeOperationalEvent({ eventId: "incident-1", category: "provider-availability",
    code: "DIAG-UNAPPROVED", occurredAt: "2026-10-03T12:00:00.000Z" }), null);
  const base = { eventId: "incident-2", category: "reconciliation", code: "DIAG-RECONCILIATION-REQUIRED",
    occurredAt: "2026-10-03T12:00:00.000Z" };
  for (const invalid of [
    null, { ...base, eventId: "bad token" }, { ...base, category: "invoice" }, { ...base, code: "not-diagnostic" },
    { ...base, occurredAt: "2026-02-30T12:00:00Z" }, { ...base, occurredAt: "2026-10-03T12:00:00+15:00" },
    { ...base, count: -1 }, { ...base, count: 1.5 }, { ...base, count: 1_000_000_001 },
    { ...base, durationMs: -1 }, { ...base, durationMs: Number.NaN }, { ...base, durationMs: 86_400_001 },
    { ...base, bytes: -1 }, { ...base, bytes: 1.5 }, { ...base, bytes: 1_073_741_825 },
    { ...base, category: "certificate-expiry", code: "DIAG-RECONCILIATION-REQUIRED" },
    { ...base, eventId: "endpoint-name-1" },
  ]) assert.equal(createSafeOperationalEvent(invalid), null);
});

test("telemetry sink errors do not interrupt the caller and runbooks never authorize automatic mutation", async () => {
  const event = createSafeOperationalEvent({ eventId: "inc-123", category: "unknown-response", code: "DIAG-RESPONSE-UNKNOWN",
    occurredAt: "2026-10-03T12:00:00.000Z" });
  assert.equal(await emitSafeOperationalEvent({ async emit() { throw new Error("secret raw details"); } }, event), false);
  recordP5FaultDetection("P5-FAULT-053", await emitSafeOperationalEvent({ async emit() { throw new Error("private telemetry failure"); } }, event) === false);
  assert.equal(await emitSafeOperationalEvent(null, event), false);
  assert.equal(await emitSafeOperationalEvent({ async emit() { return true; } }, null), false);
  assert.equal(await emitSafeOperationalEvent({ async emit() { return false; } }, event), false);
  const decision = decideRunbook({ condition: "unknown-attempt", evidenceReference: "attempt-ref-1" });
  assert.equal(decision.automaticMutationAllowed, false);
  assert.equal(decision.actions.includes("preserve-evidence-and-reconcile"), true);
  assert.equal(decision.actions.some((action) => /delete|resend/iu.test(action)), false);
  for (const condition of ["aeat-outage", "certificate-expiring", "certificate-revoked", "endpoint-drift", "schema-drift",
    "lease-stuck", "unknown-attempt", "restore-request", "rollback-request", "clock-anomaly", "provider-unavailable"]) {
    const result = decideRunbook({ condition, evidenceReference: null });
    assert.equal(result.condition, condition);
    assert.equal(result.automaticMutationAllowed, false);
  }
  assert.equal(decideRunbook(null), null);
  assert.equal(decideRunbook({ condition: "unknown-condition", evidenceReference: null }), null);
  assert.equal(decideRunbook({ condition: "unknown-attempt", evidenceReference: " padded " }), null);
});
