import assert from "node:assert/strict";
import test from "node:test";
import { BitMatrix, QRCodeReader } from "@zxing/library";
import { svgMatrix } from "../support/p4-qr-svg.mjs";

const api = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    new URL(
      "../../evidence/runs/artifacts/build/verifactu/dist/index.js",
      import.meta.url,
    ).href
);
const { renderQrSvg } = await import(
  process.env.VERIFACTU_QR_PROVIDER_ENTRY ??
    new URL("../../internal/qr-provider/provider.mjs", import.meta.url).href
);

test("P4-E canonical edition QR renders and independently decodes to exact facts", () => {
  const profile = {
    profileId: "aeat.qr@0.5.0",
    editionId: api.editionId("rrsif-2026-09-21-authoritative-candidate").value,
    environment: "test",
    mode: "verifactu",
    maximumPayloadBytes: 512,
  };
  const facts = {
    nif: "89890001K",
    numserie: "F/1 & G33",
    fecha: api.parseFiscalDate("2024-02-29").value,
    importe: "-241.40",
  };
  const payload = api.buildQrPayload(profile, facts);
  assert.equal(payload.status, "succeeded");
  assert.deepEqual(payload.value.facts, facts);
  const rendered = renderQrSvg(payload.value.bytes);
  assert.equal(rendered.kind, "rendered");
  const decoded = new QRCodeReader().decode({
    getBlackMatrix: () =>
      BitMatrix.parseFromBooleanArray(svgMatrix(rendered.svg)),
  });
  assert.deepEqual(api.parseQrPayload(profile, decoded.getText()), {
    status: "succeeded",
    value: facts,
  });
});
