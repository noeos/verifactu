import assert from "node:assert/strict";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    "../../evidence/runs/artifacts/build/verifactu/dist/index.js"
);

test("P4-CB-003 identities accept only canonical non-empty values", () => {
  assert.equal(api.identity("tenant", "tenant-1").status, "succeeded");
  for (const value of ["", " leading", "trailing ", "a/b", "x".repeat(129)]) {
    assert.equal(api.identity("tenant", value).status, "invalid");
  }
});

test("P4-CB-005 decimals are exact and never accept binary numbers", () => {
  const parsed = api.parseDecimal("123.450", 3, 6);
  assert.equal(parsed.status, "succeeded");
  assert.equal(api.formatDecimal(parsed.value), "123.450");
  assert.equal(api.decimalFromUnknown(0.1).status, "invalid");
  assert.equal(api.parseDecimal("01").status, "invalid");
  assert.equal(api.parseDecimal("-0.0").status, "invalid");
  assert.equal(api.parseDecimal("1.234", 2).status, "invalid");
  assert.equal(api.parseDecimal("123", 2, 2).status, "invalid");
  assert.equal(api.parseDecimal("1.").status, "invalid");
  assert.equal(api.parseDecimal("+1").status, "invalid");
  assert.equal(
    api.compareDecimal(
      api.parseDecimal("1.0").value,
      api.parseDecimal("1.00").value,
    ),
    0,
  );
  assert.equal(
    api.compareDecimal(
      api.parseDecimal("1").value,
      api.parseDecimal("2").value,
    ),
    -1,
  );
  assert.equal(
    api.compareDecimal(
      api.parseDecimal("2").value,
      api.parseDecimal("1").value,
    ),
    1,
  );
});

test("P4-CB-006 date and instant parsing rejects impossible or implicit values", () => {
  assert.equal(api.parseFiscalDate("2024-02-29").status, "succeeded");
  assert.equal(api.parseFiscalDate("2023-02-29").status, "invalid");
  assert.equal(api.parseFiscalDate("2026-13-01").status, "invalid");
  assert.equal(api.parseFiscalDate("2026-00-01").status, "invalid");
  assert.equal(api.parseFiscalDate("2026-04-31").status, "invalid");
  assert.equal(api.parseFiscalDate("2026-01-00").status, "invalid");
  assert.equal(api.parseFiscalDate("1900-02-29").status, "invalid");
  assert.equal(api.parseFiscalDate("2000-02-29").status, "succeeded");
  assert.equal(
    api.parseFiscalInstant("2026-09-21T10:00:00+02:00").status,
    "succeeded",
  );
  assert.equal(api.parseFiscalInstant("2026-09-21T10:00:00").status, "invalid");
  assert.equal(
    api.parseFiscalInstant("2026-09-21T24:00:00Z").status,
    "invalid",
  );
  assert.equal(
    api.parseFiscalInstant("2026-09-21T12:60:00Z").status,
    "invalid",
  );
  assert.equal(
    api.parseFiscalInstant("2026-09-21T12:00:60Z").status,
    "invalid",
  );
  assert.equal(
    api.parseFiscalInstant("2026-09-21T12:00:00+15:00").status,
    "invalid",
  );
  assert.equal(
    api.parseFiscalInstant("2026-09-21T12:00:00+14:01").status,
    "invalid",
  );
  assert.equal(
    api.parseFiscalInstant("2026-09-21T12:00:00+12:60").status,
    "invalid",
  );
  const left = api.parseFiscalInstant("2026-09-21T10:00:00+02:00").value;
  const right = api.parseFiscalInstant("2026-09-21T08:00:00Z").value;
  assert.equal(api.compareFiscalInstants(left, right), 0);
  const later = api.parseFiscalInstant("2026-09-21T09:00:00-01:00").value;
  assert.equal(api.compareFiscalInstants(left, later), -1);
  assert.equal(api.compareFiscalInstants(later, left), 1);
});
