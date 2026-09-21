import assert from "node:assert/strict";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    "../../evidence/runs/artifacts/build/verifactu/dist/index.js"
);
const id = (kind, value) => api.identity(kind, value).value;
const date = api.parseFiscalDate("2026-09-21").value;
const instant = api.parseFiscalInstant("2026-09-21T12:00:00Z").value;
const alta = {
  kind: "alta",
  id: id("record", "record-1"),
  taxpayerId: id("taxpayer", "taxpayer-1"),
  issuedOn: date,
  recordedAt: instant,
  invoiceNumber: "F-1",
  total: api.parseDecimal("10.00").value,
};

test("P4-CB-007 record variants enforce kind-specific fields", () => {
  assert.equal(api.defineRecord(alta).status, "succeeded");
  assert.equal(api.recordReference(alta), null);
  assert.equal(
    api.defineRecord({ ...alta, invoiceNumber: "" }).status,
    "invalid",
  );
  const anulacion = {
    ...alta,
    kind: "anulacion",
    cancelsRecordId: id("record", "record-0"),
    reason: "duplicate",
  };
  delete anulacion.invoiceNumber;
  delete anulacion.total;
  assert.equal(api.defineRecord(anulacion).status, "succeeded");
  assert.equal(api.recordReference(anulacion), anulacion.cancelsRecordId);
  assert.equal(
    api.defineRecord({ ...anulacion, reason: "" }).status,
    "invalid",
  );
});

test("P4-CB-008 corrections append immutable history", () => {
  const entry = {
    sequence: 1,
    recordId: alta.id,
    correctedAt: instant,
    correctedBy: id("principal", "principal-1"),
    reason: "amount",
  };
  const result = api.appendCorrection([], entry);
  assert.equal(result.status, "succeeded");
  assert.equal(Object.isFrozen(result.value), true);
  assert.equal(api.appendCorrection(result.value, entry).status, "conflict");
  assert.equal(
    api.appendCorrection([], { ...entry, reason: "" }).status,
    "conflict",
  );
});

test("record invariants reject self-cancellation and negative totals", () => {
  assert.equal(
    api.assertRecordInvariants({ ...alta, total: api.parseDecimal("-1").value })
      .status,
    "invalid",
  );
  const self = {
    ...alta,
    kind: "anulacion",
    cancelsRecordId: alta.id,
    reason: "self",
  };
  assert.equal(api.assertRecordInvariants(self).status, "invalid");
  assert.equal(api.assertRecordInvariants(alta).status, "succeeded");
  assert.equal(
    api.chainEligibleRecord(api.succeeded(alta)).status,
    "succeeded",
  );
  assert.equal(
    api.chainEligibleRecord(api.failed("indeterminate", [])).status,
    "indeterminate",
  );
});
