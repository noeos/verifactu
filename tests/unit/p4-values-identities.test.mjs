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
import { digestBytes } from "../../evidence/runs/artifacts/build/verifactu/dist/ports/digest.js";
import {
  createFiscalContext,
  requireSameContext,
  sameContext,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";

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
  for (const policy of [
    { maxIntegerDigits: Number.MAX_SAFE_INTEGER + 1, maxScale: 0 },
    { maxIntegerDigits: 65, maxScale: 0 },
    { maxIntegerDigits: 5, maxScale: -1 },
    { maxIntegerDigits: 5, maxScale: Number.NaN },
  ]) {
    assert.equal(
      createDecimal("1", policy).diagnostics[0].code,
      "DIAG-DECIMAL-POLICY",
    );
  }
  for (const value of ["+1", "1.", ".1", "1e2", " 1", "1\n"]) {
    assert.equal(
      createDecimal(value, { maxIntegerDigits: 5, maxScale: 3 }).diagnostics[0]
        .code,
      "DIAG-DECIMAL-LEXICAL",
    );
  }
});

test("digest port validates every input, provider failure, and output form", () => {
  const bytes = new Uint8Array([1, 2, 3]);
  const valid = { providerId: "test:digest", digest: () => "a".repeat(64) };
  assert.equal(digestBytes(valid, "sha256", bytes).status, "ok");
  for (const [provider, algorithm, payload] of [
    [null, "sha256", bytes],
    [{ providerId: "", digest: () => "a".repeat(64) }, "sha256", bytes],
    [{ providerId: " padded ", digest: () => "a".repeat(64) }, "sha256", bytes],
    [
      { providerId: "x".repeat(129), digest: () => "a".repeat(64) },
      "sha256",
      bytes,
    ],
    [{ providerId: "test", digest: true }, "sha256", bytes],
    [valid, "sha1", bytes],
    [valid, "sha256", [1, 2, 3]],
  ]) {
    assert.equal(
      digestBytes(provider, algorithm, payload).diagnostics[0].code,
      "DIAG-DIGEST-INPUT",
    );
  }
  assert.equal(
    digestBytes(
      {
        providerId: "throws",
        digest: () => {
          throw new Error("private");
        },
      },
      "sha256",
      bytes,
    ).diagnostics[0].code,
    "DIAG-DIGEST-UNAVAILABLE",
  );
  for (const value of [null, "A".repeat(64), "a".repeat(63), "a".repeat(128)]) {
    assert.equal(
      digestBytes(
        { providerId: "bad-output", digest: () => value },
        "sha256",
        bytes,
      ).diagnostics[0].code,
      "DIAG-DIGEST-OUTPUT",
    );
  }
  assert.equal(
    digestBytes(
      { providerId: "sha512", digest: () => "b".repeat(128) },
      "sha512",
      bytes,
    ).status,
    "ok",
  );
});

test("fiscal contexts require all four correctly typed identities", () => {
  const id = (kind, value) => createIdentity(kind, value).value;
  const valid = {
    tenantId: id("tenant", "tenant-a"),
    taxpayerId: id("taxpayer", "taxpayer-a"),
    installationId: id("installation", "install-a"),
    editionId: id("edition", "edition-a"),
  };
  const context = createFiscalContext(valid);
  assert.equal(context.status, "ok");
  assert.equal(sameContext(context.value, { ...context.value }), true);
  assert.equal(
    requireSameContext(context.value, { ...context.value }).status,
    "ok",
  );
  for (const malformed of [
    null,
    { ...valid, tenantId: id("taxpayer", "wrong") },
    { ...valid, taxpayerId: id("tenant", "wrong") },
    { ...valid, installationId: id("tenant", "wrong") },
    { ...valid, editionId: id("tenant", "wrong") },
  ]) {
    assert.equal(createFiscalContext(malformed).status, "invalid");
  }
  const other = createFiscalContext({
    ...valid,
    taxpayerId: id("taxpayer", "taxpayer-b"),
  });
  assert.equal(other.status, "ok");
  assert.equal(sameContext(context.value, other.value), false);
  assert.equal(
    requireSameContext(context.value, other.value).status,
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

test("calendar and offset boundaries remain valid across every month", () => {
  const monthLengths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let month = 1; month <= 12; month += 1) {
    const mm = String(month).padStart(2, "0");
    assert.equal(createFiscalDate(`2024-${mm}-01`).status, "ok");
    const lastDay = monthLengths[month - 1];
    assert.equal(createFiscalDate(`2024-${mm}-${lastDay}`).status, "ok");
    assert.equal(
      createFiscalDate(`2024-${mm}-${String(lastDay + 1).padStart(2, "0")}`)
        .status,
      "invalid",
    );
  }
  for (const [year, validLeap] of [
    [1900, false],
    [2000, true],
    [2100, false],
    [2400, true],
  ]) {
    assert.equal(
      createFiscalDate(`${year}-02-29`).status,
      validLeap ? "ok" : "invalid",
    );
  }
  for (const instant of [
    "2024-01-01T00:00:00Z",
    "2024-12-31T23:59:59+14:00",
    "2024-01-01T12:30:30-00:00",
    "2024-01-01T12:30:30+00:59",
  ]) {
    assert.equal(createFiscalInstant(instant).status, "ok");
  }
});
