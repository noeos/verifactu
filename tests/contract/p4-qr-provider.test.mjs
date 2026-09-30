import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";
import { decodeQR } from "qr/decode.js";
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

test("QR encoder rejects non-Uint8Array byte sources", () => {
  const payload = new TextEncoder().encode("nonempty").buffer;
  assert.equal(qrPort.encode(payload, "M").status, "invalid");
});

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

function decodeRenderedSvg(artifact, scale) {
  const svg = new TextDecoder().decode(artifact.bytes);
  const view = /<svg[^>]*viewBox="0 0 (\d+) (\d+)"/u.exec(svg);
  assert.ok(view);
  const width = Number(view[1]) * scale;
  const height = Number(view[2]) * scale;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    data[index * 4] = 255;
    data[index * 4 + 1] = 255;
    data[index * 4 + 2] = 255;
    data[index * 4 + 3] = 255;
  }
  const paths = [...svg.matchAll(/M(\d+),(\d+)h1v1h-1z/gu)];
  assert.ok(paths.length > 0);
  for (const [, rawX, rawY] of paths) {
    const x = Number(rawX) * scale;
    const y = Number(rawY) * scale;
    for (let dy = 0; dy < scale; dy += 1)
      for (let dx = 0; dx < scale; dx += 1) {
        const offset = ((y + dy) * width + x + dx) * 4;
        data[offset] = 0;
        data[offset + 1] = 0;
        data[offset + 2] = 0;
      }
  }
  return decodeQR({ width, height, data });
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
  assert.equal(
    buildQrPayload(
      record({ series: "S".repeat(30), number: "N".repeat(30) }),
      { id: editionId, environment: "test", mode: "verifactu" },
      digest,
    ).status,
    "ok",
  );
  assert.equal(
    buildQrPayload(
      record({ series: "S".repeat(30), number: "N".repeat(31) }),
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
  const matrix = qrPort.encode(payload.bytes, "M");
  assert.equal(matrix.status, "ok");
  const margin = Math.ceil((2 * matrix.value.size) / 35);
  const viewSize = matrix.value.size + margin * 2;
  const expectedPhysicalMm = viewSize * (35 / matrix.value.size);
  assert.ok(Math.abs(rendered.value.widthMm - expectedPhysicalMm) < 1e-10);
  assert.equal(rendered.value.width, viewSize * 4);
  assert.equal(rendered.value.height, viewSize * 4);
  assert.equal(rendered.value.heightMm, expectedPhysicalMm);
  const svg = new TextDecoder().decode(rendered.value.bytes);
  assert.match(svg, /^<svg/u);
  assert.ok(
    svg.includes(
      `width="${expectedPhysicalMm.toFixed(3)}mm" height="${expectedPhysicalMm.toFixed(3)}mm"`,
    ),
  );
  assert.ok(svg.includes(`viewBox="0 0 ${viewSize} ${viewSize}"`));
  assert.ok(
    svg.includes(`<path fill="#fff" d="M0 0h${viewSize}v${viewSize}H0z"/>`),
  );
  assert.equal(decodeRenderedSvg(rendered.value, 4), payload.text);
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
  assert.equal(
    buildQrPayload(base, edition, null).diagnostics[0].code,
    "DIAG-QR-DIGEST",
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
    null,
    undefined,
    { ...valid, scale: 0 },
    { ...valid, scale: 33 },
    { ...valid, scale: 1.5 },
    { ...valid, symbolSizeMm: Number.NaN },
    { ...valid, symbolSizeMm: Number.POSITIVE_INFINITY },
    { ...valid, quietZoneMm: Number.NaN },
    { ...valid, quietZoneMm: Number.POSITIVE_INFINITY },
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
  for (const options of invalidOptions)
    assert.equal(
      renderQrPng(payload, qrPort, options, digest).status,
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
  for (const failingCall of [1, 2]) {
    let calls = 0;
    const oneDigestFailure = {
      providerId: `test:bad-digest-${failingCall}`,
      digest: () => (++calls === failingCall ? "invalid" : "a".repeat(64)),
    };
    assert.equal(
      renderQrSvg(payload, qrPort, valid, oneDigestFailure).diagnostics[0].code,
      "DIAG-QR-DIGEST",
    );
    calls = 0;
    assert.equal(
      renderQrPng(payload, qrPort, valid, oneDigestFailure).diagnostics[0].code,
      "DIAG-QR-DIGEST",
    );
  }
  assert.equal(
    renderQrSvg(payload, null, valid, digest).diagnostics[0].code,
    "DIAG-QR-RENDER-INPUT",
  );
  assert.equal(
    renderQrPng(payload, null, valid, digest).diagnostics[0].code,
    "DIAG-QR-RENDER-INPUT",
  );
  assert.equal(
    renderQrSvg(payload, {}, valid, digest).diagnostics[0].code,
    "DIAG-QR-RENDER-INPUT",
  );
  assert.equal(
    renderQrPng(payload, {}, valid, digest).diagnostics[0].code,
    "DIAG-QR-RENDER-INPUT",
  );
  assert.equal(
    renderQrSvg(null, qrPort, valid, digest).diagnostics[0].code,
    "DIAG-QR-RENDER-INPUT",
  );
  assert.equal(
    renderQrPng(null, qrPort, valid, digest).diagnostics[0].code,
    "DIAG-QR-RENDER-INPUT",
  );
  const ports = [
    {
      encode: () => {
        throw new Error("encoder failure");
      },
    },
    { encode: () => ({ status: "unavailable" }) },
    { encode: () => ({ status: "ok", value: null }) },
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
  const wrongStatusWithValidMatrix = {
    encode: () => ({
      status: "unavailable",
      value: { size: 21, get: () => false },
    }),
  };
  assert.equal(
    renderQrSvg(payload, wrongStatusWithValidMatrix, valid, digest).status,
    "invalid",
  );
  const oversizedMatrix = {
    encode: () => ({
      status: "ok",
      value: { size: 177, get: () => false },
    }),
  };
  const maximumOptions = { scale: 32, symbolSizeMm: 40, quietZoneMm: 6 };
  assert.equal(
    renderQrSvg(payload, oversizedMatrix, maximumOptions, digest).diagnostics[0]
      .code,
    "DIAG-QR-DIMENSION-LIMIT",
  );
  assert.equal(
    renderQrPng(payload, oversizedMatrix, maximumOptions, digest).diagnostics[0]
      .code,
    "DIAG-QR-DIMENSION-LIMIT",
  );
  const exactDimensionMatrix = {
    encode: () => ({
      status: "ok",
      value: { size: 112, get: () => false },
    }),
  };
  const exactDimensionOptions = {
    scale: 32,
    symbolSizeMm: 30,
    quietZoneMm: 2,
  };
  const exactSvg = renderQrSvg(
    payload,
    exactDimensionMatrix,
    exactDimensionOptions,
    digest,
  );
  assert.equal(exactSvg.status, "ok");
  assert.equal(exactSvg.value.width, 4096);
  const exactPng = renderQrPng(
    payload,
    exactDimensionMatrix,
    exactDimensionOptions,
    digest,
  );
  assert.equal(exactPng.status, "ok");
  assert.equal(exactPng.value.width, 4096);
  const minimumScale = { scale: 1, symbolSizeMm: 30, quietZoneMm: 2 };
  assert.equal(
    renderQrSvg(payload, exactDimensionMatrix, minimumScale, digest).status,
    "ok",
  );
  assert.equal(
    renderQrPng(payload, exactDimensionMatrix, minimumScale, digest).status,
    "ok",
  );
});

test("P4-E encoder port enforces admitted byte and correction-level input", () => {
  assert.equal(
    qrPort.encode(new Uint8Array(), "M").diagnostics[0].code,
    "DIAG-QR-ENCODER-INPUT",
  );
  assert.equal(
    qrPort.encode(new DataView(new Uint8Array([65]).buffer), "M").diagnostics[0]
      .code,
    "DIAG-QR-ENCODER-INPUT",
  );
  assert.equal(qrPort.encode(new Uint8Array([0xff]), "M").status, "invalid");
  assert.equal(
    qrPort.encode(new TextEncoder().encode("x"), "L").status,
    "invalid",
  );
  assert.equal(qrPort.encode(new TextEncoder().encode("x"), "M").status, "ok");
  const payload = buildQrPayload(
    record(),
    { id: editionId, environment: "test", mode: "verifactu" },
    digest,
  ).value;
  const exactMinimum = {
    encode: () => ({ status: "ok", value: { size: 21, get: () => false } }),
  };
  assert.equal(
    renderQrSvg(
      payload,
      exactMinimum,
      { scale: 4, symbolSizeMm: 35, quietZoneMm: 2 },
      digest,
    ).status,
    "ok",
  );
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
    verifyQrPayload("x".repeat(1_048_576), valid, edition, digest)
      .diagnostics[0].code,
    "DIAG-QR-NONCANONICAL",
  );
  assert.equal(
    verifyQrPayload("x".repeat(1_048_577), valid, edition, digest)
      .diagnostics[0].code,
    "DIAG-QR-VERIFY-LIMIT",
  );
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
  const expectedRawLength = (rendered.value.width + 1) * rendered.value.height;
  assert.ok(expectedRawLength > 65_535);
  const png = rendered.value.bytes;
  let offset = 8;
  let imageData;
  while (offset < png.length) {
    const length = new DataView(png.buffer, png.byteOffset + offset).getUint32(
      0,
      false,
    );
    const name = Buffer.from(png.subarray(offset + 4, offset + 8)).toString(
      "ascii",
    );
    if (name === "IDAT")
      imageData = png.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;
  }
  assert.ok(imageData);
  const raw = inflateSync(imageData);
  assert.equal(raw.length, expectedRawLength);
  assert.equal(
    imageData.length,
    2 + raw.length + Math.ceil(raw.length / 65_535) * 5 + 4,
  );
  for (let y = 0; y < rendered.value.height; y += 1)
    assert.equal(raw[y * (rendered.value.width + 1)], 0);
});

test("P4-E compact PNG keeps stored blocks bounded", () => {
  const payload = buildQrPayload(
    record(),
    { id: editionId, environment: "test", mode: "verifactu" },
    digest,
  ).value;
  const matrix = {
    encode: () => ({
      status: "ok",
      value: { size: 21, get: (x, y) => x === y && x % 2 === 0 },
    }),
  };
  const rendered = renderQrPng(
    payload,
    matrix,
    { scale: 1, symbolSizeMm: 30, quietZoneMm: 2 },
    digest,
  );
  assert.equal(rendered.status, "ok");
  const bytes = rendered.value.bytes;
  let offset = 8;
  let idat;
  while (offset < bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset);
    const length = view.getUint32(0, false);
    const name = Buffer.from(bytes.subarray(offset + 4, offset + 8)).toString(
      "ascii",
    );
    if (name === "IDAT") idat = bytes.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;
  }
  assert.ok(idat);
  const raw = inflateSync(idat);
  assert.equal(
    idat.length,
    2 + raw.length + Math.ceil(raw.length / 65_535) * 5 + 4,
  );
});

test("P4-E SVG and PNG enforce the exact 4096-pixel dimension ceiling", () => {
  const payload = buildQrPayload(
    record(),
    { id: editionId, environment: "test", mode: "verifactu" },
    digest,
  ).value;
  const matrix = (size) => ({
    encode: () => ({
      status: "ok",
      value: { size, get: () => false },
    }),
  });
  const options = { scale: 32, symbolSizeMm: 30, quietZoneMm: 2 };
  const exactSvg = renderQrSvg(payload, matrix(112), options, digest);
  assert.equal(exactSvg.status, "ok");
  assert.equal(exactSvg.value.width, 4096);
  assert.equal(
    renderQrSvg(payload, matrix(113), options, digest).diagnostics[0].code,
    "DIAG-QR-DIMENSION-LIMIT",
  );
  const exactPng = renderQrPng(payload, matrix(112), options, digest);
  assert.equal(exactPng.status, "ok");
  assert.equal(exactPng.value.width, 4096);
  assert.equal(
    renderQrPng(payload, matrix(113), options, digest).diagnostics[0].code,
    "DIAG-QR-DIMENSION-LIMIT",
  );
});

test("P4-E PNG encodes exact raster pixels, physical density and chunk checksums", () => {
  const payload = buildQrPayload(
    record(),
    { id: editionId, environment: "test", mode: "verifactu" },
    digest,
  ).value;
  const matrix = {
    encode: () => ({
      status: "ok",
      value: {
        size: 21,
        get: (x, y) => x === y && x % 2 === 0,
      },
    }),
  };
  const rendered = renderQrPng(
    payload,
    matrix,
    { scale: 2, symbolSizeMm: 35, quietZoneMm: 2 },
    digest,
  );
  assert.equal(rendered.status, "ok");

  const bytes = rendered.value.bytes;
  assert.deepEqual(
    [...bytes.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
  );
  const chunks = [];
  let offset = 8;
  while (offset < bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset);
    const length = view.getUint32(0, false);
    const name = Buffer.from(bytes.subarray(offset + 4, offset + 8)).toString(
      "ascii",
    );
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    chunks.push({ name, data, crc: view.getUint32(8 + length, false) });
    offset += length + 12;
  }
  assert.deepEqual(
    chunks.map(({ name }) => name),
    ["IHDR", "pHYs", "IDAT", "IEND"],
  );

  const crc32 = (input) => {
    let crc = 0xffff_ffff;
    for (const byte of input) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1)
        crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb8_8320 : 0);
    }
    return (crc ^ 0xffff_ffff) >>> 0;
  };
  for (const { name, data, crc } of chunks) {
    const nameBytes = Buffer.from(name, "ascii");
    const crcInput = new Uint8Array(nameBytes.length + data.length);
    crcInput.set(nameBytes);
    crcInput.set(data, nameBytes.length);
    assert.equal(crc32(crcInput), crc, `${name} CRC`);
  }

  const header = chunks[0].data;
  const headerView = new DataView(header.buffer, header.byteOffset);
  assert.equal(headerView.getUint32(0, false), 50);
  assert.equal(headerView.getUint32(4, false), 50);
  assert.deepEqual([...header.subarray(8)], [8, 0, 0, 0, 0]);
  const physical = chunks[1].data;
  const physicalView = new DataView(physical.buffer, physical.byteOffset);
  assert.equal(physicalView.getUint32(0, false), 1200);
  assert.equal(physicalView.getUint32(4, false), 1200);
  assert.equal(physical[8], 1);

  const actualRaster = inflateSync(chunks[2].data);
  const expectedRaster = new Uint8Array(51 * 50);
  for (let y = 0; y < 50; y += 1) {
    expectedRaster[y * 51] = 0;
    for (let x = 0; x < 50; x += 1) {
      const moduleCoordinate = Math.floor(x / 2) - 2;
      const moduleRow = Math.floor(y / 2) - 2;
      expectedRaster[y * 51 + x + 1] =
        moduleCoordinate === moduleRow &&
        moduleRow >= 0 &&
        moduleRow < 21 &&
        moduleRow % 2 === 0
          ? 0
          : 255;
    }
  }
  assert.deepEqual([...actualRaster], [...expectedRaster]);
});
