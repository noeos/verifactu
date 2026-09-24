import { Byte, Encoder } from "@nuintun/qrcode";

const MAXIMUM_PAYLOAD_BYTES = 512;
const SYMBOL_SIZE_MILLIMETRES = 32;

export function renderQrSvg(payload, options = {}) {
  if (!(payload instanceof Uint8Array) || payload.byteLength === 0)
    return outcome("defect", ["DIAG-QR-REQUEST"]);
  if (payload.byteLength > MAXIMUM_PAYLOAD_BYTES)
    return outcome("limit", ["DIAG-QR-BYTES"]);
  let requestedQuietZone;
  try {
    requestedQuietZone = options?.quietZoneModules ?? 4;
  } catch {
    return outcome("defect", ["DIAG-QR-OPTIONS"]);
  }
  if (!Number.isSafeInteger(requestedQuietZone) || requestedQuietZone < 4)
    return outcome("defect", ["DIAG-QR-OPTIONS"]);
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(payload);
  } catch {
    return outcome("invalid", ["DIAG-QR-UTF8"]);
  }
  if (!/^[\x20-\x7e]+$/u.test(text))
    return outcome("invalid", ["DIAG-QR-ASCII"]);
  try {
    const encoded = new Encoder({ level: "M", version: "Auto" }).encode(
      new Byte(text),
    );
    const quietZoneModules = Math.max(
      requestedQuietZone,
      Math.ceil(encoded.size / 16),
    );
    const edge = encoded.size + quietZoneModules * 2;
    const quietZoneMillimetres =
      (quietZoneModules * SYMBOL_SIZE_MILLIMETRES) / encoded.size;
    const widthMillimetres = SYMBOL_SIZE_MILLIMETRES + quietZoneMillimetres * 2;
    if (widthMillimetres > 40) return outcome("limit", ["DIAG-QR-DIMENSIONS"]);
    const modules = [];
    for (let y = 0; y < encoded.size; y += 1)
      for (let x = 0; x < encoded.size; x += 1)
        if (encoded.get(x, y) === 1) {
          modules.push(
            `M${x + quietZoneModules},${y + quietZoneModules}h1v1h-1z`,
          );
        }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${widthMillimetres}mm" height="${widthMillimetres}mm" viewBox="0 0 ${edge} ${edge}" role="img" aria-label="QR tributario"><path fill="#fff" d="M0,0h${edge}v${edge}H0z"/><path fill="#000" d="${modules.join("")}"/></svg>`;
    return Object.freeze({
      kind: "rendered",
      svg,
      errorCorrection: "M",
      size: encoded.size,
      symbolModules: encoded.size,
      level: "M",
      quietZoneModules,
      quietZoneMillimetres,
      symbolWidthMillimetres: SYMBOL_SIZE_MILLIMETRES,
      widthMillimetres,
    });
  } catch {
    return outcome("defect", ["DIAG-QR-PROVIDER"]);
  }
}

function outcome(kind, diagnostics) {
  return Object.freeze({ kind, diagnostics: Object.freeze([...diagnostics]) });
}
