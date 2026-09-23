import assert from "node:assert/strict";
import test from "node:test";
import { BitMatrix, QRCodeReader } from "@zxing/library";

const { renderQrSvg } = await import(
  new URL("../../internal/qr-provider/provider.mjs", import.meta.url).href
);
const bytes = (text) => new TextEncoder().encode(text);

test("P4-E renders deterministic static level-M QR SVG with a four-module quiet zone", () => {
  const result = renderQrSvg(
    bytes(
      "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=F-1&fecha=01-01-2024&importe=1",
    ),
  );
  assert.equal(result.kind, "rendered");
  assert.equal(result.level, "M");
  assert.equal(result.quietZoneModules, 4);
  assert.match(result.svg, /^<svg /u);
  assert.equal(
    /<script|on[a-z]+=|foreignObject|(?:href|src)=/iu.test(result.svg),
    false,
  );
  assert.equal(renderQrSvg(bytes("not-ascii-ñ")).kind, "invalid");
  assert.equal(renderQrSvg(Uint8Array.of()).kind, "defect");
  const matrix = BitMatrix.parseFromBooleanArray(result.matrix);
  const decoded = new QRCodeReader().decode({ getBlackMatrix: () => matrix });
  assert.equal(
    decoded.getText(),
    "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=F-1&fecha=01-01-2024&importe=1",
  );
});
