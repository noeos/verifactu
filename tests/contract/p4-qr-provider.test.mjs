import assert from "node:assert/strict";
import test from "node:test";

const { renderQrSvg } = await import(
  process.env.VERIFACTU_QR_PROVIDER_ENTRY ??
    new URL("../../internal/qr-provider/provider.mjs", import.meta.url).href
);
const bytes = (value) => new TextEncoder().encode(value);

test("P4-E QR renderer contract reports M correction and physical geometry", () => {
  const result = renderQrSvg(
    bytes(
      "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=F-1&fecha=01-01-2024&importe=1",
    ),
    { quietZoneModules: 4 },
  );
  assert.equal(result.kind, "rendered");
  assert.equal(result.errorCorrection, "M");
  assert.equal(result.symbolModules, result.size);
  assert.equal(result.quietZoneModules, 4);
  assert.equal(result.symbolWidthMillimetres, 32);
  assert.ok(result.widthMillimetres >= 30);
  assert.ok(result.widthMillimetres <= 40);
  assert.ok(result.quietZoneMillimetres >= 2);
  assert.match(
    result.svg,
    new RegExp(
      `width="${result.widthMillimetres}mm" height="${result.widthMillimetres}mm"`,
      "u",
    ),
  );
});

test("P4-E QR renderer rejects request, option and byte-limit violations", () => {
  assert.equal(renderQrSvg(null).kind, "defect");
  assert.equal(renderQrSvg(bytes("")).kind, "defect");
  const url = bytes(
    "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=F-1&fecha=01-01-2024&importe=1",
  );
  assert.equal(renderQrSvg(url, { quietZoneModules: 3 }).kind, "defect");
  assert.equal(renderQrSvg(url, { quietZoneModules: 4.5 }).kind, "defect");
  assert.equal(renderQrSvg(url, null).kind, "rendered");
  assert.equal(
    renderQrSvg(url, {
      get quietZoneModules() {
        throw new Error("hostile getter");
      },
    }).kind,
    "defect",
  );
  assert.equal(renderQrSvg(new Uint8Array(513)).kind, "limit");
  const maximum = renderQrSvg(bytes("A".repeat(512)));
  assert.ok(["rendered", "limit"].includes(maximum.kind));
  if (maximum.kind === "rendered") {
    assert.equal(maximum.symbolWidthMillimetres, 32);
    assert.ok(maximum.widthMillimetres <= 40);
    assert.ok(maximum.quietZoneMillimetres >= 2);
  }
});
