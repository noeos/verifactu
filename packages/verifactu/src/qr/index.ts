// SPDX-License-Identifier: Apache-2.0

import * as QRCode from "qrcode";
import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";

export type QrEnvironment = "production" | "test";

export interface QrInvoiceData {
  readonly nif: string;
  readonly invoiceNumber: string;
  readonly issueDate: string;
  readonly total: string;
  readonly environment?: QrEnvironment;
}

export interface QrCode {
  readonly payload: string;
  readonly svg: string;
  readonly modules: number;
  readonly correctionLevel: "M";
  readonly millimetres: number;
  readonly quietZoneMillimetres: number;
}

const ENDPOINTS = Object.freeze({
  production: "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR",
  test: "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR",
});

export function buildQrPayload(input: QrInvoiceData): Result<string> {
  if (!/^[A-Z0-9]{9}$/u.test(input.nif)) return invalidQr("nif");
  if (
    input.invoiceNumber.length < 1 ||
    input.invoiceNumber.length > 60 ||
    !/^[\x20-\x7E]+$/u.test(input.invoiceNumber)
  )
    return invalidQr("invoiceNumber");
  if (!/^\d{2}-\d{2}-\d{4}$/u.test(input.issueDate)) return invalidQr("issueDate");
  if (!/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/u.test(input.total)) return invalidQr("total");
  const environment = input.environment ?? "production";
  const endpoint = ENDPOINTS[environment];
  const query = new URLSearchParams();
  query.set("nif", input.nif);
  query.set("numserie", input.invoiceNumber);
  query.set("fecha", input.issueDate);
  query.set("importe", input.total);
  return success(`${endpoint}?${query.toString()}`);
}

export function renderQr(
  input: QrInvoiceData,
  options: { readonly millimetres?: number; readonly quietZoneMillimetres?: number } = {},
): Result<QrCode> {
  const payload = buildQrPayload(input);
  if (!payload.ok) return payload;
  const millimetres = options.millimetres ?? 35;
  const quietZoneMillimetres = options.quietZoneMillimetres ?? 6;
  if (millimetres < 30 || millimetres > 40 || quietZoneMillimetres < 2)
    return invalidQr("rendering");
  const qr = QRCode.create(payload.value, { errorCorrectionLevel: "M" });
  const modules = qr.modules.size;
  const cells = qr.modules.data;
  const size = modules + quietZoneMillimetres * 2;
  let paths = "";
  for (let row = 0; row < modules; row += 1) {
    for (let column = 0; column < modules; column += 1) {
      if (cells[row * modules + column] === 1)
        paths += `M${String(column + quietZoneMillimetres)},${String(row + quietZoneMillimetres)}h1v1h-1z`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${String(size)} ${String(size)}" width="${String(millimetres)}mm" height="${String(millimetres)}mm" role="img" aria-label="Código QR VERI*FACTU"><path d="${paths}" fill="#000"/></svg>`;
  return success(
    Object.freeze({
      payload: payload.value,
      svg,
      modules,
      correctionLevel: "M",
      millimetres,
      quietZoneMillimetres,
    }),
  );
}

function invalidQr(path: string): Result<never> {
  return failure("INVALID_INPUT", [
    createDiagnostic({ code: "VF_QR_INPUT_INVALID", severity: "error", phase: "input", path }),
  ]);
}
