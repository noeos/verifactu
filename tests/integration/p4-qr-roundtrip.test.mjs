import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  cp,
  mkdtemp,
  readFile,
  rm,
  writeFile,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { decodeQR } from "qr/decode.js";
import { inflateSync } from "node:zlib";
import {
  buildQrPayload,
  createQrEncoderPort,
  renderQrSvg,
  renderQrPng,
  verifyQrPayload,
} from "../../evidence/runs/artifacts/build/verifactu/dist/application/qr.js";
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

const editionId = "rrsif-2026-09-21-authoritative-candidate";
const digest = {
  providerId: "test:sha256",
  digest: (_algorithm, bytes) =>
    createHash("sha256").update(bytes).digest("hex"),
};
const id = (kind, value) => createIdentity(kind, value).value;
const taxpayer = id("taxpayer", "89890001K"),
  edition = id("edition", editionId);
const context = createFiscalContext({
  tenantId: id("tenant", "t"),
  taxpayerId: taxpayer,
  installationId: id("installation", "i"),
  editionId: edition,
}).value;
const record = createAltaRecord({
  kind: "alta",
  id: id("record", "r"),
  context,
  document: createFiscalDocumentIdentity({
    issuer: taxpayer,
    series: "12345678-G",
    number: "33",
    issueDate: "2024-01-01",
  }).value,
  issueDate: createFiscalDate("2024-01-01").value,
  generatedAt: createFiscalInstant("2024-01-01T00:00:00Z").value,
  total: createDecimal("123.45", { maxIntegerDigits: 8, maxScale: 2 }).value,
  predecessorId: null,
  editionId: edition,
}).value;
const encoderPort = createQrEncoderPort();

function recordFor(index) {
  return createAltaRecord({
    kind: "alta",
    id: id("record", `p4-qr-roundtrip-${index}`),
    context,
    document: createFiscalDocumentIdentity({
      issuer: taxpayer,
      series: `S${index}-`,
      number: `${index}`,
      issueDate: "2024-01-01",
    }).value,
    issueDate: createFiscalDate("2024-01-01").value,
    generatedAt: createFiscalInstant("2024-01-01T00:00:00Z").value,
    total: createDecimal(
      `${index}.${String((index * 37) % 100).padStart(2, "0")}`,
      { maxIntegerDigits: 8, maxScale: 2 },
    ).value,
    predecessorId: null,
    editionId: edition,
  }).value;
}

function decodeSvgArtifact(artifact, scale) {
  const svg = new TextDecoder().decode(artifact.bytes);
  const view = /<svg[^>]*viewBox="0 0 (\d+) (\d+)"/u.exec(svg);
  assert.ok(view);
  const units = Number(view[1]);
  const dimension = units * scale;
  const rgba = new Uint8ClampedArray(dimension * dimension * 4);
  for (let i = 0; i < dimension * dimension; i += 1) {
    rgba[i * 4] = 255;
    rgba[i * 4 + 1] = 255;
    rgba[i * 4 + 2] = 255;
    rgba[i * 4 + 3] = 255;
  }
  const paths = [...svg.matchAll(/M(\d+),(\d+)h1v1h-1z/gu)];
  assert.ok(paths.length > 0);
  for (const [, xs, ys] of paths) {
    const x = Number(xs) * scale,
      y = Number(ys) * scale;
    for (let dy = 0; dy < scale; dy += 1)
      for (let dx = 0; dx < scale; dx += 1) {
        const i = ((y + dy) * dimension + x + dx) * 4;
        rgba[i] = 0;
        rgba[i + 1] = 0;
        rgba[i + 2] = 0;
      }
  }
  return decodeQR({ width: dimension, height: dimension, data: rgba });
}

async function mutateQr(id, edits, observe) {
  const temporary = await mkdtemp(join(tmpdir(), "verifactu-p4-qr-mutant-"));
  try {
    const dist = join(temporary, "dist");
    await cp(resolve("evidence/runs/artifacts/build/verifactu/dist"), dist, {
      recursive: true,
    });
    const sourcePath = join(dist, "application/qr.js");
    let source = await readFile(sourcePath, "utf8");
    for (const [before, after] of edits) {
      assert.ok(source.includes(before), `${id} mutation span missing`);
      source = source.replace(before, after);
    }
    await writeFile(sourcePath, source);
    await writeFile(join(temporary, "package.json"), '{"type":"module"}\n');
    await symlink(
      resolve("node_modules"),
      join(temporary, "node_modules"),
      "dir",
    );
    const qr = await import(`${pathToFileURL(sourcePath).href}?mutant=${id}`);
    try {
      await observe(qr);
    } catch (error) {
      assert.equal(
        error?.code,
        "ERR_ASSERTION",
        `${id} failed outside its oracle`,
      );
      assert.match(
        error.message,
        new RegExp(id.replace("P4-MUT", "P4-CB")),
        `${id} killed by wrong oracle`,
      );
      return;
    }
    assert.fail(`${id} survived its registered behavioral oracle`);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

test("P4-PROP-014 QR bytes round-trip exactly through independent decode (4096 executions)", () => {
  for (let index = 0; index < 4096; index += 1) {
    const editionConfig = {
      id: editionId,
      environment: index % 2 ? "test" : "production",
      mode: index % 2 ? "verifactu" : "non-verifactu",
    };
    const item = recordFor(index);
    const payload = buildQrPayload(item, editionConfig, digest);
    assert.equal(payload.status, "ok", `seed=1346650369 case=${index}`);
    const artifact = renderQrSvg(
      payload.value,
      encoderPort,
      { scale: 8, symbolSizeMm: 35, quietZoneMm: 2 },
      digest,
    );
    assert.equal(artifact.status, "ok", `seed=1346650369 case=${index}`);
    const decoded = decodeSvgArtifact(artifact.value, 8);
    assert.deepEqual(
      new TextEncoder().encode(decoded),
      payload.value.bytes,
      `seed=1346650369 case=${index}`,
    );
  }
});

test("P4-PROP-011 QR payload encode-decode preserves exact canonical bytes", () => {
  const editionIdentity = id("edition", editionId);
  const fiscalContext = createFiscalContext({
    tenantId: id("tenant", "qr-property-tenant"),
    taxpayerId: taxpayer,
    installationId: id("installation", "qr-property-installation"),
    editionId: editionIdentity,
  }).value;
  for (let index = 0; index < 4096; index += 1) {
    const amount = `${index}.${String((index * 37) % 100).padStart(2, "0")}`;
    const item = createAltaRecord({
      kind: "alta",
      id: id("record", `qr-property-${index}`),
      context: fiscalContext,
      document: createFiscalDocumentIdentity({
        issuer: taxpayer,
        series: `S${index}-`,
        number: `${index}`,
        issueDate: "2025-01-01",
      }).value,
      issueDate: createFiscalDate("2025-01-01").value,
      generatedAt: createFiscalInstant("2025-01-01T00:00:00Z").value,
      total: createDecimal(amount, { maxIntegerDigits: 8, maxScale: 2 }).value,
      predecessorId: null,
      editionId: editionIdentity,
    });
    assert.equal(item.status, "ok", `seed=1346650369 case=${index}`);
    const editionConfig = {
      id: editionId,
      environment: index % 2 ? "test" : "production",
      mode: index % 2 ? "verifactu" : "non-verifactu",
    };
    const payload = buildQrPayload(item.value, editionConfig, digest);
    assert.equal(payload.status, "ok", `seed=1346650369 case=${index}`);
    assert.deepEqual(
      payload.value.bytes,
      new TextEncoder().encode(payload.value.text),
      `seed=1346650369 case=${index}`,
    );
    assert.equal(
      verifyQrPayload(payload.value.text, item.value, editionConfig, digest)
        .status,
      "ok",
      `seed=1346650369 case=${index}`,
    );
  }
});

test("P4-MUT-030 kills QR endpoint or parameter-order drift", async () => {
  await mutateQr(
    "P4-MUT-030",
    [["?nif=", "?numserie="]],
    async ({ buildQrPayload: build }) => {
      const result = build(
        record,
        { id: editionId, environment: "test", mode: "verifactu" },
        digest,
      );
      assert.equal(result.status, "ok");
      assert.ok(
        result.value.text.includes("?nif=89890001K&numserie="),
        "P4-CB-030 QR endpoint and ordered query assertion",
      );
    },
  );
});

test("P4-MUT-031 kills acceptance of noncanonical and duplicate QR parameters", async () => {
  await mutateQr(
    "P4-MUT-031",
    [["expected.value.text !== text", "false && expected.value.text !== text"]],
    async ({ verifyQrPayload: verify }) => {
      const result = verify(
        `${buildQrPayload(record, { id: editionId, environment: "test", mode: "verifactu" }, digest).value.text}&nif=000000000`,
        record,
        { id: editionId, environment: "test", mode: "verifactu" },
        digest,
      );
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-031 reject duplicate parameters assertion",
      );
    },
  );
});

test("P4-MUT-042 kills QR overflow acceptance and render fallback", async () => {
  await mutateQr(
    "P4-MUT-042",
    [
      ["dimension > 4096", "dimension > 8192"],
      [
        "dimension * dimension > 16_777_216",
        "dimension * dimension > 67_108_864",
      ],
    ],
    async ({ buildQrPayload: build, renderQrSvg: render }) => {
      const payload = build(
        record,
        { id: editionId, environment: "test", mode: "verifactu" },
        digest,
      ).value;
      const encoder = {
        providerId: "test:matrix",
        encode: () => ({ status: "ok", value: { size: 177, get: () => true } }),
      };
      const result = render(
        payload,
        encoder,
        { scale: 32, symbolSizeMm: 30, quietZoneMm: 6 },
        digest,
      );
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-042 reject symbol dimension overflow without truncation assertion",
      );
    },
  );
});

test("P4-MUT-043 kills use of altered bytes instead of independent exact-byte oracle", async () => {
  await mutateQr(
    "P4-MUT-043",
    [['qr.encode(bytes.slice(), "M")', 'qr.encode(new Uint8Array(), "M")']],
    async ({ buildQrPayload: build, renderQrSvg: render }) => {
      const payload = build(
        record,
        { id: editionId, environment: "test", mode: "verifactu" },
        digest,
      ).value;
      const result = render(
        payload,
        encoderPort,
        { scale: 8, symbolSizeMm: 35, quietZoneMm: 2 },
        digest,
      );
      assert.equal(
        result.status,
        "ok",
        "P4-CB-043 render exact payload assertion",
      );
      let decoded = null;
      try {
        decoded = decodeSvgArtifact(result.value, 8);
      } catch {
        /* malformed mutation output is an oracle failure */
      }
      assert.equal(
        decoded,
        payload.text,
        "P4-CB-043 independent decoder exact-byte assertion",
      );
    },
  );
});

test("P4-FUZZ-005 QR payload and rendered symbol decoder remain bounded (4096 executions)", () => {
  let state = 0x50444101;
  const nextByte = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state >>> 24;
  };
  const editionConfig = {
    id: editionId,
    environment: "test",
    mode: "verifactu",
  };
  for (let index = 0; index < 4096; index += 1) {
    const length = index % 512;
    const chars = new Uint8Array(length);
    for (let offset = 0; offset < length; offset += 1)
      chars[offset] = nextByte();
    const candidate = new TextDecoder().decode(chars);
    const verified = verifyQrPayload(candidate, record, editionConfig, digest);
    assert.ok(
      ["ok", "invalid"].includes(verified.status),
      `seed=1346650369 case=${index}`,
    );
    const width = 32 + (index % 33);
    const height = 32 + (Math.floor(index / 33) % 33);
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let byte = 0; byte < rgba.length; byte += 4) {
      const color = nextByte();
      rgba[byte] = color;
      rgba[byte + 1] = color;
      rgba[byte + 2] = color;
      rgba[byte + 3] = 255;
    }
    try {
      decodeQR({ width, height, data: rgba });
    } catch {
      // Malformed and non-QR images are expected fuzz outcomes.
    }
  }
});

test("P4-E PNG renderer is deterministic, bounded and independently decodable", () => {
  const payload = buildQrPayload(
    record,
    { id: editionId, environment: "test", mode: "verifactu" },
    digest,
  ).value;
  const options = { scale: 8, symbolSizeMm: 35, quietZoneMm: 2 };
  const first = renderQrPng(payload, encoderPort, options, digest);
  const second = renderQrPng(payload, encoderPort, options, digest);
  assert.equal(first.status, "ok");
  assert.deepEqual(first.value.bytes, second.value.bytes);
  assert.deepEqual(
    [...first.value.bytes.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
  );
  let cursor = 8;
  const idat = [];
  while (cursor < first.value.bytes.length) {
    const view = new DataView(
      first.value.bytes.buffer,
      first.value.bytes.byteOffset + cursor,
    );
    const chunkLength = view.getUint32(0, false);
    const kind = new TextDecoder().decode(
      first.value.bytes.subarray(cursor + 4, cursor + 8),
    );
    if (kind === "IDAT")
      idat.push(
        first.value.bytes.subarray(cursor + 8, cursor + 8 + chunkLength),
      );
    cursor += chunkLength + 12;
  }
  const compressed = new Uint8Array(
    idat.reduce((length, chunk) => length + chunk.length, 0),
  );
  cursor = 0;
  for (const chunk of idat) {
    compressed.set(chunk, cursor);
    cursor += chunk.length;
  }
  const scanlines = inflateSync(compressed),
    width = first.value.width,
    height = first.value.height;
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const gray = scanlines[y * (width + 1) + x + 1],
        offset = (y * width + x) * 4;
      rgba[offset] = gray;
      rgba[offset + 1] = gray;
      rgba[offset + 2] = gray;
      rgba[offset + 3] = 255;
    }
  assert.equal(decodeQR({ width, height, data: rgba }), payload.text);

  const rotated = new Uint8ClampedArray(rgba.length);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const source = (y * width + x) * 4;
      const target = (x * width + (width - 1 - y)) * 4;
      rotated.set(rgba.subarray(source, source + 4), target);
    }
  assert.equal(
    decodeQR({ width, height, data: rotated }),
    payload.text,
    "independent decoder preserves payload after a 90-degree rotation",
  );

  const scaledWidth = width * 2,
    scaled = new Uint8ClampedArray(scaledWidth * scaledWidth * 4);
  for (let y = 0; y < scaledWidth; y++)
    for (let x = 0; x < scaledWidth; x++) {
      const source = (Math.floor(y / 2) * width + Math.floor(x / 2)) * 4;
      const target = (y * scaledWidth + x) * 4;
      scaled.set(rgba.subarray(source, source + 4), target);
    }
  assert.equal(
    decodeQR({ width: scaledWidth, height: scaledWidth, data: scaled }),
    payload.text,
    "independent decoder preserves payload after 2x nearest-neighbor scaling",
  );

  const damaged = rgba.slice();
  damaged.fill(255);
  let damagedPayload = null;
  try {
    damagedPayload = decodeQR({ width, height, data: damaged });
  } catch {
    // A damaged raster may be rejected or decode to a different payload.
  }
  assert.notEqual(
    damagedPayload,
    payload.text,
    "fully damaged symbol cannot satisfy exact-byte verification",
  );
  assert.throws(() => decodeQR({ width, height, data: new Uint8ClampedArray(8) }));
});
