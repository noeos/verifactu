import assert from "node:assert/strict";
import { gunzipSync, gzipSync } from "node:zlib";
import test from "node:test";
import { BitMatrix, QRCodeReader } from "@zxing/library";

const { renderQrSvg } = await import(
  process.env.VERIFACTU_QR_PROVIDER_ENTRY ??
    new URL("../../internal/qr-provider/provider.mjs", import.meta.url).href
);
const bytes = (text) => new TextEncoder().encode(text);
const decode = (matrix) =>
  new QRCodeReader().decode({
    getBlackMatrix: () => BitMatrix.parseFromBooleanArray(matrix),
  }).getText();
const rotateClockwise = (matrix) =>
  matrix.map((_, y) => matrix.map((row) => row[y]).reverse());
const scaleByTwo = (matrix) =>
  matrix.flatMap((row) => {
    const scaled = row.flatMap((value) => [value, value]);
    return [scaled, [...scaled]];
  });
function svgMatrix(svg) {
  const viewBox = /viewBox="0 0 (\d+) (\d+)"/u.exec(svg);
  const blackPath = /<path fill="#000" d="([^"]+)"\/>/u.exec(svg);
  assert.notEqual(viewBox, null);
  assert.notEqual(blackPath, null);
  assert.equal(viewBox[1], viewBox[2]);
  const edge = Number(viewBox[1]);
  const matrix = Array.from({ length: edge }, () => Array(edge).fill(false));
  const command = /M(\d+),(\d+)h1v1h-1z/gu;
  let count = 0;
  for (const match of blackPath[1].matchAll(command)) {
    const x = Number(match[1]);
    const y = Number(match[2]);
    assert.ok(x > 0 && x < edge - 1 && y > 0 && y < edge - 1);
    matrix[y][x] = true;
    count += 1;
  }
  assert.ok(count > 0);
  return matrix;
}

test("P4-E renders deterministic static level-M QR SVG with a four-module quiet zone", () => {
  const result = renderQrSvg(
    bytes(
      "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=F-1&fecha=01-01-2024&importe=1",
    ),
  );
  assert.equal(result.kind, "rendered");
  assert.equal(result.level, "M");
  assert.equal(result.errorCorrection, "M");
  assert.equal(result.symbolModules, result.size);
  assert.equal(result.quietZoneModules, 4);
  assert.equal(result.symbolWidthMillimetres, 32);
  assert.ok(result.widthMillimetres <= 40);
  assert.ok(result.quietZoneMillimetres >= 2);
  assert.match(result.svg, /^<svg /u);
  assert.equal(
    /<script|on[a-z]+=|foreignObject|(?:href|src)=/iu.test(result.svg),
    false,
  );
  assert.equal(renderQrSvg(bytes("not-ascii-ñ")).kind, "invalid");
  assert.equal(renderQrSvg(Uint8Array.of()).kind, "defect");
  const matrix = svgMatrix(result.svg);
  const payload =
    "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=F-1&fecha=01-01-2024&importe=1";
  assert.equal(decode(matrix), payload);
  assert.equal(decode(rotateClockwise(matrix)), payload);
  assert.equal(decode(scaleByTwo(matrix)), payload);
  const compressed = gzipSync(result.svg);
  const restored = gunzipSync(compressed).toString("utf8");
  assert.equal(decode(svgMatrix(restored)), payload);

  for (const [x, y] of [
    [15, 17],
    [20, 16],
    [31, 14],
    [18, 31],
    [33, 28],
  ])
    matrix[y][x] = !matrix[y][x];
  assert.equal(decode(scaleByTwo(matrix)), payload);
});

test("P4-FUZZ-005 renderer handles 4096 bounded arbitrary byte payloads", () => {
  let state = 0x51524335;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
  const outcomes = new Set(["rendered", "invalid", "limit", "defect"]);
  for (let index = 0; index < 4096; index += 1) {
    const length = index % 32 === 0 ? index % 513 : next() % 1025;
    const input = new Uint8Array(length);
    for (let offset = 0; offset < length; offset += 1)
      input[offset] = index % 32 === 0 ? 65 : next() & 0xff;
    const result = renderQrSvg(input);
    assert.equal(outcomes.has(result.kind), true);
    if (result.kind === "rendered") {
      assert.equal(typeof result.svg, "string");
      assert.equal(result.errorCorrection, "M");
      assert.equal(result.symbolWidthMillimetres, 32);
      assert.ok(result.widthMillimetres <= 40);
    }
  }
});
