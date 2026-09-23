import assert from "node:assert/strict";
import test from "node:test";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    new URL(
      "../../evidence/runs/artifacts/build/verifactu/dist/index.js",
      import.meta.url,
    ).href
);
const date = (value) => {
  const result = api.parseFiscalDate(value);
  assert.equal(result.status, "succeeded");
  return result.value;
};
const profile = (overrides = {}) => ({
  environment: "test",
  mode: "verifactu",
  maximumPayloadBytes: 1024,
  ...overrides,
});
const facts = (overrides = {}) => ({
  nif: "89890001K",
  numserie: "12345678&G33",
  fecha: date("2024-01-01"),
  importe: "241.4",
  ...overrides,
});

test("P4-E produces the captured AEAT ordered and percent-encoded QR URL", () => {
  const result = api.buildQrPayload(profile(), facts());
  assert.equal(result.status, "succeeded");
  assert.equal(
    result.value.text,
    "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=12345678%26G33&fecha=01-01-2024&importe=241.4",
  );
  assert.equal(result.value.legend, "VERI*FACTU");
  assert.deepEqual(api.parseQrPayload(profile(), result.value.text), {
    status: "succeeded",
    value: facts(),
  });
});

test("P4-E binds endpoint and visible legend to exact environment and mode", () => {
  const result = api.buildQrPayload(
    profile({ environment: "production", mode: "non-verifactu" }),
    facts({ numserie: "F-1" }),
  );
  assert.equal(result.status, "succeeded");
  assert.equal(
    result.value.text.startsWith(
      "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQRNoVerifactu?",
    ),
    true,
  );
  assert.equal(result.value.legend, "QR tributario");
});

test("P4-E rejects URL ambiguity, noncanonical facts and cross-profile payloads", () => {
  const payload = api.buildQrPayload(profile(), facts());
  assert.equal(payload.status, "succeeded");
  for (const value of [
    payload.value.text.replace("&fecha", "&unknown=x&fecha"),
    payload.value.text.replace(
      "numserie=12345678%26G33",
      "numserie=12345678&G33",
    ),
    payload.value.text.replace("importe=241.4", "importe=241,4"),
  ])
    assert.equal(api.parseQrPayload(profile(), value).status, "invalid");
  assert.equal(
    api.parseQrPayload(
      profile({ environment: "production" }),
      payload.value.text,
    ).status,
    "invalid",
  );
  assert.equal(
    api.buildQrPayload(profile(), facts({ numserie: "ñ" })).status,
    "invalid",
  );
});
