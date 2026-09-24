import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
  profileId: "aeat.qr@0.5.0",
  editionId: api.editionId("rrsif-2026-09-21-authoritative-candidate").value,
  environment: "test",
  mode: "verifactu",
  maximumPayloadBytes: 512,
  ...overrides,
});
const facts = (overrides = {}) => ({
  nif: "89890001K",
  numserie: "12345678&G33",
  fecha: date("2024-01-01"),
  importe: "241.4",
  ...overrides,
});
const digest = (_algorithm, bytes) =>
  new Uint8Array(createHash("sha256").update(bytes).digest());
const buildQrPayload = (qrProfile, qrFacts) =>
  api.buildQrPayload(qrProfile, qrFacts, digest);

test("P4-E produces the captured AEAT ordered and percent-encoded QR URL", () => {
  const result = buildQrPayload(profile(), facts());
  assert.equal(result.status, "succeeded");
  assert.equal(
    result.value.text,
    "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=12345678%26G33&fecha=01-01-2024&importe=241.4",
  );
  assert.equal(result.value.legend, "VERI*FACTU");
  assert.equal(result.value.label, "QR tributario:");
  assert.equal(result.value.profileId, "aeat.qr@0.5.0");
  assert.equal(result.value.editionId, profile().editionId);
  assert.deepEqual(
    result.value.bytes,
    new TextEncoder().encode(result.value.text),
  );
  assert.deepEqual(result.value.facts, facts());
  assert.equal(
    result.value.artifactDigest,
    createHash("sha256").update(result.value.bytes).digest("hex"),
  );
  assert.equal(Object.isFrozen(result.value.facts), true);
  const exposed = result.value.bytes;
  exposed[0] = 0;
  assert.deepEqual(
    result.value.bytes,
    new TextEncoder().encode(result.value.text),
  );
  assert.deepEqual(api.parseQrPayload(profile(), result.value.text), {
    status: "succeeded",
    value: facts(),
  });
});

test("P4-E matches all four captured environment and mode endpoints", () => {
  for (const [environment, mode, endpoint, host] of [
    ["test", "verifactu", "ValidarQR", "prewww2.aeat.es"],
    ["test", "non-verifactu", "ValidarQRNoVerifactu", "prewww2.aeat.es"],
    ["production", "verifactu", "ValidarQR", "www2.agenciatributaria.gob.es"],
    [
      "production",
      "non-verifactu",
      "ValidarQRNoVerifactu",
      "www2.agenciatributaria.gob.es",
    ],
  ]) {
    const result = buildQrPayload(
      profile({ environment, mode }),
      facts({ numserie: "A-1" }),
    );
    assert.equal(result.status, "succeeded");
    assert.equal(
      result.value.text.startsWith(
        `https://${host}/wlpl/TIKE-CONT/${endpoint}?`,
      ),
      true,
    );
    assert.equal(result.value.editionId, profile().editionId);
    assert.equal(
      result.value.legend,
      mode === "verifactu" ? "VERI*FACTU" : "QR tributario",
    );
  }
});

test("P4-E binds endpoint and visible legend to exact environment and mode", () => {
  const result = buildQrPayload(
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
  const payload = buildQrPayload(profile(), facts());
  assert.equal(payload.status, "succeeded");
  for (const value of [
    payload.value.text.replace("&fecha", "&unknown=x&fecha"),
    payload.value.text.replace("&fecha=", "&nif=89890001K&fecha="),
    payload.value.text.replace(/&importe=.*$/u, ""),
    payload.value.text.replace(
      "nif=89890001K&numserie=12345678%26G33",
      "numserie=12345678%26G33&nif=89890001K",
    ),
    payload.value.text.replace(
      "numserie=12345678%26G33",
      "numserie=12345678&G33",
    ),
    payload.value.text.replace("importe=241.4", "importe=241,4"),
    payload.value.text.replace(
      "numserie=12345678%26G33",
      "numserie=12345678+G33",
    ),
    payload.value.text.replace(
      "https://prewww2.aeat.es",
      "HTTPS://PREWWW2.AEAT.ES",
    ),
    `${payload.value.text}#fragment`,
    payload.value.text.replace(
      "https://prewww2.aeat.es",
      "https://user@prewww2.aeat.es",
    ),
  ])
    assert.equal(api.parseQrPayload(profile(), value).status, "invalid");
  const slash = buildQrPayload(profile(), facts({ numserie: "A/B" }));
  assert.equal(slash.status, "succeeded");
  assert.equal(slash.value.text.includes("numserie=A%2FB"), true);
  assert.equal(
    api.parseQrPayload(profile(), slash.value.text.replace("%2F", "%2f"))
      .status,
    "invalid",
  );
  assert.equal(
    api.parseQrPayload(
      profile({ environment: "production" }),
      payload.value.text,
    ).status,
    "invalid",
  );
  assert.equal(
    buildQrPayload(profile(), facts({ numserie: "ñ" })).status,
    "invalid",
  );
  assert.equal(
    buildQrPayload(profile(), facts({ importe: "-210.00" })).status,
    "succeeded",
  );
  assert.match(
    buildQrPayload(profile(), facts({ importe: "-210.00" })).value.text,
    /importe=-210\.00$/u,
  );
  for (const importe of ["-", "--1", "+1", "-1000000000000", "-1.001"])
    assert.equal(
      buildQrPayload(profile(), facts({ importe })).status,
      "invalid",
    );
  assert.equal(buildQrPayload(profile(), null).status, "invalid");
  assert.equal(buildQrPayload(null, facts()).status, "invalid");
  assert.equal(
    buildQrPayload(profile({ profileId: "untrusted-profile" }), facts()).status,
    "invalid",
  );
  assert.equal(
    buildQrPayload(
      profile({
        editionId: api.editionId("rrsif-2026-09-21-authoritative").value,
      }),
      facts(),
    ).status,
    "invalid",
  );
  assert.equal(
    buildQrPayload(
      Object.defineProperty({}, "profileId", {
        get() {
          throw new Error("hostile getter");
        },
      }),
      facts(),
    ).status,
    "invalid",
  );
});

test("P4-E accepts official field boundaries and enforces byte ceiling exactly", () => {
  const boundary = facts({
    numserie: `${"A".repeat(59)}!`,
    fecha: date("9999-12-31"),
    importe: "999999999999.99",
  });
  const base = profile();
  const size = buildQrPayload(base, boundary);
  assert.equal(size.status, "succeeded");
  assert.equal(
    buildQrPayload(base, { ...boundary, importe: "-999999999999.99" }).status,
    "succeeded",
  );
  const exact = profile({ maximumPayloadBytes: size.value.bytes.byteLength });
  assert.equal(buildQrPayload(exact, boundary).status, "succeeded");
  assert.equal(
    buildQrPayload(
      profile({ maximumPayloadBytes: size.value.bytes.byteLength - 1 }),
      boundary,
    ).status,
    "invalid",
  );
  assert.equal(
    buildQrPayload(profile({ maximumPayloadBytes: 513 }), boundary).status,
    "invalid",
  );
  assert.equal(
    buildQrPayload(
      profile(),
      facts({ fecha: date("2024-02-29"), importe: "0" }),
    ).status,
    "succeeded",
  );
  assert.equal(
    buildQrPayload(profile(), facts({ fecha: "2024-02-30" })).status,
    "invalid",
  );
});

test("P4-E rejects a failed or malformed SHA-256 provider", () => {
  assert.equal(
    api.buildQrPayload(profile(), facts(), () => {
      throw new Error("digest provider fault");
    }).status,
    "invalid",
  );
  assert.equal(
    api.buildQrPayload(profile(), facts(), () => new Uint8Array(31)).status,
    "invalid",
  );
});
