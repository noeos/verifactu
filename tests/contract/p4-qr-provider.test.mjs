import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  createIdentity,
  createFiscalDocumentIdentity,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/identities.js";
import { createFiscalContext } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/context.js";
import {
  createFiscalDate,
  createFiscalInstant,
} from "../../evidence/runs/artifacts/build/verifactu/dist/domain/date-time.js";
import { createDecimal } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/decimal.js";
import { createAltaRecord } from "../../evidence/runs/artifacts/build/verifactu/dist/domain/records.js";
import {
  buildQrPayload,
  createQrEncoderPort,
  renderQrSvg,
  verifyQrPayload,
  renderQrPng,
} from "../../evidence/runs/artifacts/build/verifactu/dist/application/qr.js";
const qrPort = createQrEncoderPort();
const editionId = "rrsif-2026-09-21-authoritative-candidate";
const digest = {
  providerId: "test:sha256",
  digest: (_algorithm, bytes) =>
    createHash("sha256").update(bytes).digest("hex"),
};
function record({
  series = "12345678-G",
  number = "33",
  amount = "123.45",
  taxpayerValue = "89890001K",
} = {}) {
  const id = (kind, value) => createIdentity(kind, value).value;
  const taxpayer = id("taxpayer", taxpayerValue);
  const edition = id("edition", editionId);
  const context = createFiscalContext({
    tenantId: id("tenant", "t"),
    taxpayerId: taxpayer,
    installationId: id("installation", "i"),
    editionId: edition,
  }).value;
  return createAltaRecord({
    kind: "alta",
    id: id("record", "r"),
    context,
    document: createFiscalDocumentIdentity({
      issuer: taxpayer,
      series,
      number,
      issueDate: "2024-01-01",
    }).value,
    issueDate: createFiscalDate("2024-01-01").value,
    generatedAt: createFiscalInstant("2024-01-01T00:00:00Z").value,
    total: createDecimal(amount, { maxIntegerDigits: 8, maxScale: 18 }).value,
    predecessorId: null,
    editionId: edition,
  }).value;
}

test("P4-E payload binds canonical ordered query and mode endpoint", () => {
  const built = buildQrPayload(
    record(),
    { id: editionId, environment: "test", mode: "verifactu" },
    digest,
  );
  assert.equal(built.status, "ok");
  assert.equal(
    built.value.text,
    "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=12345678-G33&fecha=01-01-2024&importe=123.45",
  );
  assert.match(built.value.digestSha256, /^[0-9a-f]{64}$/u);
  assert.equal(
    verifyQrPayload(
      built.value.text,
      record(),
      { id: editionId, environment: "test", mode: "verifactu" },
      digest,
    ).status,
    "ok",
  );
  for (const altered of [
    built.value.text + "&nif=000000000",
    built.value.text.replace("&importe=", "&unknown=x&importe="),
    built.value.text.replace("fecha=01-01-2024", "fecha=1-1-2024"),
    built.value.text.replace("prewww2", "www"),
  ])
    assert.equal(
      verifyQrPayload(
        altered,
        record(),
        { id: editionId, environment: "test", mode: "verifactu" },
        digest,
      ).status,
      "invalid",
    );
  const other = buildQrPayload(
    record(),
    { id: editionId, environment: "production", mode: "non-verifactu" },
    digest,
  );
  assert.equal(other.status, "ok");
  assert.ok(
    other.value.text.startsWith(
      "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQRNoVerifactu?",
    ),
  );
  assert.deepEqual(other.value.legend, {
    prefix: "QR tributario:",
    suffix: null,
  });
  assert.deepEqual(built.value.legend, {
    prefix: "QR tributario:",
    suffix: "VERI*FACTU",
  });
});

test("P4-E rejects cross-edition payloads, oversized fields and render bounds", () => {
  assert.equal(
    buildQrPayload(
      record(),
      { id: "other", environment: "test", mode: "verifactu" },
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    buildQrPayload(
      {
        ...record(),
        document: { ...record().document, number: "x".repeat(60) },
      },
      { id: editionId, environment: "test", mode: "verifactu" },
      digest,
    ).status,
    "invalid",
  );
  const payload = buildQrPayload(
    record(),
    { id: editionId, environment: "test", mode: "verifactu" },
    digest,
  ).value;
  assert.equal(
    renderQrSvg(
      payload,
      qrPort,
      { scale: 1, symbolSizeMm: 35, quietZoneMm: 1 },
      digest,
    ).status,
    "invalid",
  );
  assert.equal(
    renderQrSvg(
      { ...payload },
      qrPort,
      { scale: 1, symbolSizeMm: 35, quietZoneMm: 2 },
      digest,
    ).status,
    "invalid",
  );
  const rendered = renderQrSvg(
    payload,
    qrPort,
    { scale: 4, symbolSizeMm: 35, quietZoneMm: 2 },
    digest,
  );
  assert.equal(rendered.status, "ok");
  assert.match(new TextDecoder().decode(rendered.value.bytes), /^<svg/u);
});

test("P4-E rejects forged record facts, unsupported QR lexicals and digest failures", () => {
  const edition = { id: editionId, environment: "test", mode: "verifactu" };
  assert.equal(buildQrPayload(null, edition, digest).status, "invalid");
  const base = record();
  const invalidDate = {
    ...base,
    issueDate: "2024-99-99",
    document: { ...base.document, issueDate: "2024-99-99" },
  };
  assert.equal(buildQrPayload(invalidDate, edition, digest).status, "invalid");
  assert.equal(
    buildQrPayload(record({ taxpayerValue: "SHORT" }), edition, digest).status,
    "invalid",
  );
  assert.equal(
    buildQrPayload(record({ amount: "10.123" }), edition, digest).status,
    "invalid",
  );
  assert.equal(
    buildQrPayload(record({ series: "A\t" }), edition, digest).status,
    "invalid",
  );
  const reserved = buildQrPayload(
    record({ series: "A &+'()", number: "2" }),
    edition,
    digest,
  );
  assert.equal(reserved.status, "ok");
  assert.ok(reserved.value.text.includes("numserie=A+%26%2B%27%28%292"));
  assert.equal(
    buildQrPayload(base, edition, {
      providerId: "test:bad",
      digest: () => "invalid",
    }).status,
    "invalid",
  );
});

test("P4-E rejects malformed encoder ports, matrices and render option boundaries", () => {
  const payload = buildQrPayload(
    record(),
    { id: editionId, environment: "test", mode: "verifactu" },
    digest,
  ).value;
  const valid = { scale: 4, symbolSizeMm: 35, quietZoneMm: 2 };
  const invalidOptions = [
    { ...valid, scale: 0 },
    { ...valid, scale: 33 },
    { ...valid, scale: 1.5 },
    { ...valid, symbolSizeMm: 29 },
    { ...valid, symbolSizeMm: 41 },
    { ...valid, quietZoneMm: 1 },
    { ...valid, quietZoneMm: 7 },
  ];
  for (const options of invalidOptions)
    assert.equal(
      renderQrSvg(payload, qrPort, options, digest).status,
      "invalid",
    );
  const failingDigest = { providerId: "test:bad-digest", digest: () => "bad" };
  assert.equal(
    renderQrSvg(payload, qrPort, valid, failingDigest).status,
    "invalid",
  );
  assert.equal(
    renderQrPng(payload, qrPort, valid, failingDigest).status,
    "invalid",
  );
  const ports = [
    {
      encode: () => {
        throw new Error("encoder failure");
      },
    },
    { encode: () => ({ status: "unavailable" }) },
    { encode: () => ({ status: "ok", value: { size: 20, get: () => false } }) },
    {
      encode: () => ({ status: "ok", value: { size: 178, get: () => false } }),
    },
    { encode: () => ({ status: "ok", value: { size: 21 } }) },
    {
      encode: () => ({
        status: "ok",
        value: {
          size: 21,
          get: () => {
            throw new Error("matrix failure");
          },
        },
      }),
    },
  ];
  for (const port of ports) {
    assert.equal(renderQrSvg(payload, port, valid, digest).status, "invalid");
    assert.equal(renderQrPng(payload, port, valid, digest).status, "invalid");
  }
});

test("P4-E encoder port enforces admitted byte and correction-level input", () => {
  assert.equal(qrPort.encode(new Uint8Array(), "M").status, "invalid");
  assert.equal(qrPort.encode(new Uint8Array([0xff]), "M").status, "invalid");
  assert.equal(
    qrPort.encode(new TextEncoder().encode("x"), "L").status,
    "invalid",
  );
  assert.equal(qrPort.encode(new TextEncoder().encode("x"), "M").status, "ok");
  assert.equal(
    qrPort.encode(new Uint8Array(20_000).fill(65), "M").status,
    "invalid",
  );
});

test("P4-E malformed verifier and edition identities fail closed", () => {
  const valid = record();
  const edition = { id: editionId, environment: "test", mode: "verifactu" };
  assert.equal(buildQrPayload(valid, undefined, digest).status, "invalid");
  assert.equal(
    buildQrPayload(valid, { ...edition, environment: "staging" }, digest)
      .status,
    "invalid",
  );
  assert.equal(
    buildQrPayload(valid, { ...edition, mode: "other" }, digest).status,
    "invalid",
  );
  assert.equal(buildQrPayload(valid, edition, null).status, "invalid");
  assert.equal(verifyQrPayload(null, valid, edition, digest).status, "invalid");
  assert.equal(
    verifyQrPayload(valid, valid, edition, digest).status,
    "invalid",
  );
  assert.equal(
    verifyQrPayload("canonical", { ...valid, context: null }, edition, digest)
      .status,
    "invalid",
  );
  let contextReads = 0;
  const throwingRecord = new Proxy(valid, {
    get(target, property, receiver) {
      if (property === "context" && ++contextReads > 2)
        throw new Error("malformed record");
      return Reflect.get(target, property, receiver);
    },
  });
  assert.equal(
    buildQrPayload(throwingRecord, edition, digest).status,
    "invalid",
  );
  const throwingKind = new Proxy(valid, {
    get(target, property, receiver) {
      if (property === "kind") throw new Error("malformed record");
      return Reflect.get(target, property, receiver);
    },
  });
  assert.equal(buildQrPayload(throwingKind, edition, digest).status, "invalid");
});

test("P4-E deterministic PNG supports multi-block bounded rasters", () => {
  const payload = buildQrPayload(
    record(),
    { id: editionId, environment: "test", mode: "verifactu" },
    digest,
  ).value;
  const rendered = renderQrPng(
    payload,
    qrPort,
    { scale: 32, symbolSizeMm: 40, quietZoneMm: 6 },
    digest,
  );
  assert.equal(rendered.status, "ok");
  assert.ok((rendered.value.width + 1) * rendered.value.height > 65_535);
});
