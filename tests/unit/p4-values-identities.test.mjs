import assert from "node:assert/strict";
import test from "node:test";
import {
  createIdentity,
  isIdentity,
  sameIdentity,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";
import {
  createDecimal,
  decimalFromNumber,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/decimal.js";
import {
  createFiscalDate,
  createFiscalInstant,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/date-time.js";

test("identities retain kind validation and reject noncanonical control input", () => {
  assert.equal(createIdentity("tenant", " tenant ").status, "invalid");
  assert.equal(createIdentity("taxpayer", "ES123").status, "ok");
  assert.equal(createIdentity("event", "\0bad").status, "invalid");
  assert.equal(createIdentity("tenant", "").status, "invalid");
  assert.equal(createIdentity("tenant", "x".repeat(129)).status, "invalid");
  assert.equal(isIdentity(null, "tenant"), false);
  assert.equal(isIdentity("tenant", "tenant"), false);
  assert.equal(isIdentity({ kind: "tenant", value: "" }, "tenant"), false);
  assert.equal(
    isIdentity({ kind: "tenant", value: "x".repeat(129) }, "tenant"),
    false,
  );
  assert.equal(
    isIdentity({ kind: "tenant", value: " padded " }, "tenant"),
    false,
  );
  assert.equal(
    isIdentity({ kind: "tenant", value: "a\u007f" }, "tenant"),
    false,
  );
  assert.equal(
    sameIdentity(
      createIdentity("tenant", "same-value").value,
      createIdentity("taxpayer", "same-value").value,
    ),
    false,
  );
});

test("decimal representation is exact and scale, sign and unsafe number are bounded", () => {
  const amount = createDecimal("123.450", { maxIntegerDigits: 5, maxScale: 3 });
  assert.equal(amount.status, "ok");
  assert.equal(amount.value.coefficient, 123450n);
  assert.equal(amount.value.scale, 3);
  assert.equal(
    createDecimal("01.2", { maxIntegerDigits: 5, maxScale: 3 }).status,
    "invalid",
  );
  assert.equal(
    createDecimal("-1", { maxIntegerDigits: 5, maxScale: 3 }).status,
    "invalid",
  );
  assert.equal(
    createDecimal("1.2345", { maxIntegerDigits: 5, maxScale: 3 }).status,
    "invalid",
  );
  assert.equal(
    decimalFromNumber(Number.MAX_SAFE_INTEGER + 1, {
      maxIntegerDigits: 30,
      maxScale: 0,
    }).status,
    "invalid",
  );
  assert.equal(
    createDecimal("-0", {
      maxIntegerDigits: 5,
      maxScale: 3,
      allowNegative: true,
    }).status,
    "invalid",
  );
  assert.equal(
    createDecimal("-1.25", {
      maxIntegerDigits: 5,
      maxScale: 3,
      allowNegative: true,
    }).status,
    "ok",
  );
  assert.equal(
    createDecimal("100000", { maxIntegerDigits: 5, maxScale: 3 }).status,
    "invalid",
  );
  assert.equal(
    createDecimal("1", { maxIntegerDigits: 0, maxScale: 3 }).status,
    "invalid",
  );
  assert.equal(
    createDecimal("1", { maxIntegerDigits: 5, maxScale: 19 }).status,
    "invalid",
  );
  assert.equal(
    decimalFromNumber(-0, { maxIntegerDigits: 5, maxScale: 0 }).status,
    "invalid",
  );
});

test("date and instant constructors reject impossible and implicit-time values", () => {
  assert.equal(createFiscalDate("2024-02-29").status, "ok");
  assert.equal(createFiscalDate("2023-02-29").status, "invalid");
  assert.equal(createFiscalDate("2000-02-29").status, "ok");
  assert.equal(createFiscalDate("1900-02-29").status, "invalid");
  assert.equal(createFiscalDate("2025-00-01").status, "invalid");
  assert.equal(createFiscalDate("2025-13-01").status, "invalid");
  assert.equal(createFiscalDate("2025-01-00").status, "invalid");
  assert.equal(createFiscalDate("2025-04-31").status, "invalid");
  assert.equal(createFiscalDate("0001-01-01").status, "ok");
  assert.equal(createFiscalDate("0000-01-01").status, "invalid");
  assert.equal(createFiscalDate("2024-2-09").status, "invalid");
  assert.equal(createFiscalInstant("2025-01-02T03:04:05+01:00").status, "ok");
  assert.equal(createFiscalInstant("2025-01-02T03:04:05Z").status, "ok");
  assert.equal(createFiscalInstant("2025-01-02T03:04:05.1-14:00").status, "ok");
  assert.equal(
    createFiscalInstant("2025-01-02T03:04:05.1234567890Z").status,
    "invalid",
  );
  assert.equal(
    createFiscalInstant("2025-01-02T03:04:05+15:00").status,
    "invalid",
  );
  assert.equal(
    createFiscalInstant("2025-01-02T03:04:05+14:30").status,
    "invalid",
  );
  assert.equal(
    createFiscalInstant("2025-01-02T03:04:05+01:99").status,
    "invalid",
  );
  assert.equal(createFiscalInstant("2025-01-02T03:04:05").status, "invalid");
  assert.equal(createFiscalInstant("2025-02-31T03:04:05Z").status, "invalid");
  assert.equal(createFiscalInstant("2025-01-02T24:00:00Z").status, "invalid");
  assert.equal(createFiscalInstant("2025-01-02T03:60:00Z").status, "invalid");
  assert.equal(createFiscalInstant("2025-01-02T03:04:60Z").status, "invalid");
  assert.equal(
    createFiscalInstant("2025-01-02T03:04:05+14:01").status,
    "invalid",
  );
  assert.equal(
    createFiscalInstant("2025-01-02T03:04:05+01:60").status,
    "invalid",
  );
  assert.equal(
    createFiscalInstant("2025-01-02T03:04:05.123456789Z").status,
    "ok",
  );
});
