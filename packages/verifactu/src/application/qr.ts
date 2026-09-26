import { invalid, ok, type Result } from "../contracts/results.js";
import { Byte, Charset, Encoder } from "@nuintun/qrcode";
import { createAltaRecord, type AltaRecord } from "../domain/records.js";
import type { QrEdition, QrEncoderPort, QrMatrix } from "../ports/qr.js";
import { digestBytes, type DigestPort } from "../ports/digest.js";

const EDITION = "rrsif-2026-09-21-authoritative-candidate" as const;
const ENDPOINTS = Object.freeze({
  test: Object.freeze({
    verifactu: "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR",
    "non-verifactu":
      "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQRNoVerifactu",
  }),
  production: Object.freeze({
    verifactu: "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR",
    "non-verifactu":
      "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQRNoVerifactu",
  }),
});
const encoder = new TextEncoder();
const payloads = new WeakMap<object, Uint8Array>();
export interface QrPayload {
  readonly editionId: typeof EDITION;
  readonly mode: QrEdition["mode"];
  readonly environment: QrEdition["environment"];
  readonly text: string;
  readonly bytes: Uint8Array;
  readonly digestSha256: string;
  readonly legend: {
    readonly prefix: "QR tributario:";
    readonly suffix: "VERI*FACTU" | null;
  };
}
export interface QrRenderOptions {
  readonly scale: number;
  readonly symbolSizeMm: number;
  readonly quietZoneMm: number;
}
export interface QrArtifact {
  readonly editionId: typeof EDITION;
  readonly mimeType: "image/svg+xml" | "image/png";
  readonly bytes: Uint8Array;
  readonly digestSha256: string;
  readonly width: number;
  readonly height: number;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly payloadDigestSha256: string;
}
const digest = (provider: DigestPort, bytes: Uint8Array): string | null => {
  const result = digestBytes(provider, "sha256", bytes);
  return result.status === "ok" ? result.value.slice("sha256:".length) : null;
};
const isPrintableAscii = (value: string): boolean =>
  /^[\x20-\x7e]+$/u.test(value);

function buildQrPayloadInternal(
  record: AltaRecord,
  edition: QrEdition,
  digestProvider: DigestPort,
): Result<QrPayload> {
  if (
    !record ||
    typeof record !== "object" ||
    record.kind !== "alta" ||
    !record.editionId ||
    !record.context?.editionId ||
    !record.document?.issuer ||
    !record.total ||
    !record.issueDate ||
    !record.generatedAt ||
    !edition ||
    edition.id !== EDITION ||
    !digestProvider ||
    (edition.environment !== "test" && edition.environment !== "production") ||
    (edition.mode !== "verifactu" && edition.mode !== "non-verifactu") ||
    record.editionId.value !== EDITION ||
    record.context.editionId.value !== EDITION
  )
    return invalid("DIAG-QR-EDITION-RECORD", "edition");
  let facts: AltaRecord;
  try {
    const validated = createAltaRecord(record);
    if (validated.status !== "ok")
      return invalid("DIAG-QR-EDITION-RECORD", "edition");
    facts = validated.value;
  } catch {
    return invalid("DIAG-QR-EDITION-RECORD", "edition");
  }
  if (
    facts.document.issuer.value.length !== 9 ||
    !isPrintableAscii(facts.document.issuer.value)
  )
    return invalid("DIAG-QR-EDITION-RECORD", "edition");
  const invoiceId = facts.document.series + facts.document.number;
  const invoiceDate = facts.issueDate;
  const date = `${invoiceDate.slice(8, 10)}-${invoiceDate.slice(5, 7)}-${invoiceDate.slice(0, 4)}`;
  const amount = facts.total.text;
  const amountMatch = /^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/u.test(amount);
  if (
    !isPrintableAscii(invoiceId) ||
    [...invoiceId].length > 60 ||
    !/^\d{2}-\d{2}-\d{4}$/u.test(date) ||
    !amountMatch
  )
    return invalid("DIAG-QR-FIELD-RANGE", "domain");
  const formEncode = (value: string): string =>
    encodeURIComponent(value)
      .replace(
        /[!'()*]/gu,
        (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
      )
      .replace(/%20/gu, "+");
  const text = `${ENDPOINTS[edition.environment][edition.mode]}?nif=${formEncode(facts.document.issuer.value)}&numserie=${formEncode(invoiceId)}&fecha=${formEncode(date)}&importe=${formEncode(amount)}`;
  const bytes = encoder.encode(text);
  if (bytes.length > 1_048_576)
    return invalid("DIAG-QR-PAYLOAD-LIMIT", "bytes");
  const payloadDigest = digest(digestProvider, bytes);
  if (!payloadDigest) return invalid("DIAG-QR-DIGEST", "domain");
  const view = Object.freeze({
    editionId: EDITION,
    mode: edition.mode,
    environment: edition.environment,
    text,
    bytes: bytes.slice(),
    digestSha256: payloadDigest,
    legend: Object.freeze({
      prefix: "QR tributario:",
      suffix: edition.mode === "verifactu" ? "VERI*FACTU" : null,
    }),
  });
  payloads.set(view, bytes.slice());
  return ok(view);
}

export function buildQrPayload(
  record: AltaRecord,
  edition: QrEdition,
  digestProvider: DigestPort,
): Result<QrPayload> {
  try {
    return buildQrPayloadInternal(record, edition, digestProvider);
  } catch {
    return invalid("DIAG-QR-EDITION-RECORD", "edition");
  }
}

export function verifyQrPayload(
  text: string,
  record: AltaRecord,
  edition: QrEdition,
  digestProvider: DigestPort,
): Result<QrPayload> {
  if (typeof text !== "string" || encoder.encode(text).length > 1_048_576)
    return invalid("DIAG-QR-VERIFY-LIMIT", "bytes");
  const expected = buildQrPayload(record, edition, digestProvider);
  if (expected.status !== "ok" || expected.value.text !== text)
    return invalid("DIAG-QR-NONCANONICAL", "edition");
  return expected;
}

export function createQrEncoderPort(): QrEncoderPort {
  return Object.freeze({
    providerId: "@nuintun/qrcode@5.0.3",
    encode(payload: Uint8Array, level: "M"): Result<QrMatrix> {
      if (
        !(payload instanceof Uint8Array) ||
        payload.length === 0 ||
        level !== "M"
      )
        return invalid("DIAG-QR-ENCODER-INPUT", "bytes");
      let text: string;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(payload);
      } catch {
        return invalid("DIAG-QR-ENCODER-INPUT", "utf8");
      }
      try {
        const matrix = new Encoder({ level: "M", version: "Auto" }).encode(
          new Byte(text, Charset.UTF_8),
        );
        return ok(
          Object.freeze({
            size: matrix.size,
            get: (x: number, y: number) => Boolean(matrix.get(x, y)),
          }),
        );
      } catch {
        return invalid("DIAG-QR-ENCODER", "domain");
      }
    },
  });
}

function encodeMatrix(qr: QrEncoderPort, bytes: Uint8Array): QrMatrix | null {
  if (!qr || typeof qr.encode !== "function") return null;
  let encoded: Result<QrMatrix>;
  try {
    encoded = qr.encode(bytes.slice(), "M");
  } catch {
    return null;
  }
  if (
    !encoded ||
    encoded.status !== "ok" ||
    !encoded.value ||
    !Number.isSafeInteger(encoded.value.size) ||
    encoded.value.size < 21 ||
    encoded.value.size > 177 ||
    typeof encoded.value.get !== "function"
  )
    return null;
  return encoded.value;
}

export function renderQrSvg(
  payload: QrPayload,
  qr: QrEncoderPort,
  options: QrRenderOptions,
  digestProvider: DigestPort,
): Result<QrArtifact> {
  const canonical =
    payload && typeof payload === "object" ? payloads.get(payload) : undefined;
  if (
    !canonical ||
    !qr ||
    typeof qr.encode !== "function" ||
    !digestProvider ||
    !Number.isSafeInteger(options?.scale) ||
    !Number.isFinite(options?.symbolSizeMm) ||
    !Number.isFinite(options?.quietZoneMm) ||
    options.scale < 1 ||
    options.scale > 32 ||
    options.symbolSizeMm < 30 ||
    options.symbolSizeMm > 40 ||
    options.quietZoneMm < 2 ||
    options.quietZoneMm > 6 ||
    canonical.length > 1_048_576
  )
    return invalid("DIAG-QR-RENDER-INPUT", "domain");
  const matrix = encodeMatrix(qr, canonical);
  if (!matrix) return invalid("DIAG-QR-ENCODER", "domain");
  const margin = Math.ceil(
    (options.quietZoneMm * matrix.size) / options.symbolSizeMm,
  );
  const moduleMm = options.symbolSizeMm / matrix.size;
  const physicalMm = (matrix.size + margin * 2) * moduleMm;
  const dimension = (matrix.size + margin * 2) * options.scale;
  if (dimension > 4096 || dimension * dimension > 16_777_216)
    return invalid("DIAG-QR-DIMENSION-LIMIT", "bytes");
  let path = "";
  try {
    for (let y = 0; y < matrix.size; y += 1)
      for (let x = 0; x < matrix.size; x += 1) {
        if (matrix.get(x, y)) path += `M${x + margin},${y + margin}h1v1h-1z`;
      }
  } catch {
    return invalid("DIAG-QR-ENCODER", "domain");
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="qr-title" width="${physicalMm.toFixed(3)}mm" height="${physicalMm.toFixed(3)}mm" viewBox="0 0 ${matrix.size + margin * 2} ${matrix.size + margin * 2}" shape-rendering="crispEdges"><title id="qr-title">QR tributario</title><path fill="#fff" d="M0 0h${matrix.size + margin * 2}v${matrix.size + margin * 2}H0z"/><path fill="#000" d="${path}"/></svg>`;
  const bytes = encoder.encode(svg);
  if (bytes.length > 67_108_864)
    return invalid("DIAG-QR-OUTPUT-LIMIT", "bytes");
  const artifactDigest = digest(digestProvider, bytes);
  const payloadDigest = digest(digestProvider, canonical);
  if (!artifactDigest || !payloadDigest)
    return invalid("DIAG-QR-DIGEST", "domain");
  return ok(
    Object.freeze({
      editionId: EDITION,
      mimeType: "image/svg+xml",
      bytes,
      digestSha256: artifactDigest,
      width: dimension,
      height: dimension,
      widthMm: physicalMm,
      heightMm: physicalMm,
      payloadDigestSha256: payloadDigest,
    }),
  );
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffff_ffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1)
      crc = (crc >>> 1) ^ ((crc & 1) !== 0 ? 0xedb8_8320 : 0);
  }
  return (crc ^ 0xffff_ffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (const byte of bytes) {
    a = (a + byte) % 65_521;
    b = (b + a) % 65_521;
  }
  return ((b << 16) | a) >>> 0;
}

function pngChunk(name: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(data.length + 12);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length, false);
  for (let index = 0; index < 4; index += 1)
    chunk[index + 4] = name.charCodeAt(index);
  chunk.set(data, 8);
  view.setUint32(
    8 + data.length,
    crc32(chunk.subarray(4, 8 + data.length)),
    false,
  );
  return chunk;
}

function storedZlib(bytes: Uint8Array): Uint8Array {
  const blocks = Math.ceil(bytes.length / 65_535);
  const output = new Uint8Array(2 + bytes.length + blocks * 5 + 4);
  output[0] = 0x78;
  output[1] = 0x01;
  let sourceOffset = 0;
  let targetOffset = 2;
  while (sourceOffset < bytes.length) {
    const length = Math.min(65_535, bytes.length - sourceOffset);
    const final = sourceOffset + length === bytes.length;
    output[targetOffset] = final ? 1 : 0;
    output[targetOffset + 1] = length & 0xff;
    output[targetOffset + 2] = (length >>> 8) & 0xff;
    const complement = ~length & 0xffff;
    output[targetOffset + 3] = complement & 0xff;
    output[targetOffset + 4] = (complement >>> 8) & 0xff;
    output.set(
      bytes.subarray(sourceOffset, sourceOffset + length),
      targetOffset + 5,
    );
    sourceOffset += length;
    targetOffset += length + 5;
  }
  new DataView(output.buffer).setUint32(
    output.length - 4,
    adler32(bytes),
    false,
  );
  return output;
}

export function renderQrPng(
  payload: QrPayload,
  qr: QrEncoderPort,
  options: QrRenderOptions,
  digestProvider: DigestPort,
): Result<QrArtifact> {
  const canonical =
    payload && typeof payload === "object" ? payloads.get(payload) : undefined;
  if (
    !canonical ||
    !qr ||
    typeof qr.encode !== "function" ||
    !digestProvider ||
    !Number.isSafeInteger(options?.scale) ||
    !Number.isFinite(options?.symbolSizeMm) ||
    !Number.isFinite(options?.quietZoneMm) ||
    options.scale < 1 ||
    options.scale > 32 ||
    options.symbolSizeMm < 30 ||
    options.symbolSizeMm > 40 ||
    options.quietZoneMm < 2 ||
    options.quietZoneMm > 6 ||
    canonical.length > 1_048_576
  )
    return invalid("DIAG-QR-RENDER-INPUT", "domain");
  const matrix = encodeMatrix(qr, canonical);
  if (!matrix) return invalid("DIAG-QR-ENCODER", "domain");
  const margin = Math.ceil(
    (options.quietZoneMm * matrix.size) / options.symbolSizeMm,
  );
  const moduleMm = options.symbolSizeMm / matrix.size;
  const physicalMm = (matrix.size + margin * 2) * moduleMm;
  const dimension = (matrix.size + margin * 2) * options.scale;
  const pixels = dimension * dimension;
  if (dimension > 4096 || pixels > 16_777_216)
    return invalid("DIAG-QR-DIMENSION-LIMIT", "bytes");
  const raw = new Uint8Array((dimension + 1) * dimension);
  let offset = 0;
  try {
    for (let y = 0; y < dimension; y += 1) {
      raw[offset++] = 0;
      const moduleY = Math.floor(y / options.scale) - margin;
      for (let x = 0; x < dimension; x += 1) {
        const moduleX = Math.floor(x / options.scale) - margin;
        const inside =
          moduleX >= 0 &&
          moduleY >= 0 &&
          moduleX < matrix.size &&
          moduleY < matrix.size;
        raw[offset++] = inside && matrix.get(moduleX, moduleY) ? 0 : 255;
      }
    }
  } catch {
    return invalid("DIAG-QR-ENCODER", "domain");
  }
  const compressed = storedZlib(raw);
  const header = new Uint8Array(13);
  const headerView = new DataView(header.buffer);
  headerView.setUint32(0, dimension, false);
  headerView.setUint32(4, dimension, false);
  header[8] = 8;
  header[9] = 0;
  const physicalDensity = Math.round((dimension * 1000) / physicalMm);
  const phys = new Uint8Array(9);
  const physView = new DataView(phys.buffer);
  physView.setUint32(0, physicalDensity, false);
  physView.setUint32(4, physicalDensity, false);
  phys[8] = 1;
  const chunks = [
    pngChunk("IHDR", header),
    pngChunk("pHYs", phys),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", new Uint8Array()),
  ];
  const length = 8 + chunks.reduce((total, chunk) => total + chunk.length, 0);
  if (length > 67_108_864) return invalid("DIAG-QR-OUTPUT-LIMIT", "bytes");
  const bytes = new Uint8Array(length);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  offset = 8;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  const artifactDigest = digest(digestProvider, bytes);
  const payloadDigest = digest(digestProvider, canonical);
  if (!artifactDigest || !payloadDigest)
    return invalid("DIAG-QR-DIGEST", "domain");
  return ok(
    Object.freeze({
      editionId: EDITION,
      mimeType: "image/png",
      bytes,
      digestSha256: artifactDigest,
      width: dimension,
      height: dimension,
      widthMm: physicalMm,
      heightMm: physicalMm,
      payloadDigestSha256: payloadDigest,
    }),
  );
}
