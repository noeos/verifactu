import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { TextEncoder } from "node:util";
import { parseFiscalDate, type FiscalDate } from "../domain/date-time.js";
import { diagnostic } from "../domain/diagnostics.js";
import type { OperatingMode } from "../domain/mode-tenure.js";

export interface QrInvoiceFacts {
  readonly nif: string;
  readonly numserie: string;
  readonly fecha: FiscalDate;
  readonly importe: string;
}

export interface QrEditionProfile {
  readonly environment: "test" | "production";
  readonly mode: OperatingMode;
  readonly maximumPayloadBytes: number;
}

export interface QrPayload {
  readonly text: string;
  readonly bytes: Uint8Array;
  readonly legend: "VERI*FACTU" | "QR tributario";
}

const ASCII = /^[\x20-\x7e]*$/u;
const NIF = /^[A-Z0-9]{9}$/u;
const AMOUNT = /^\d{1,12}(?:\.\d{1,2})?$/u;
const PARAMETERS = ["nif", "numserie", "fecha", "importe"] as const;

export function buildQrPayload(
  profile: QrEditionProfile,
  facts: QrInvoiceFacts,
): OperationResult<QrPayload> {
  if (!validProfile(profile) || !validFacts(facts)) return qrFailure();
  const host =
    profile.environment === "test"
      ? "prewww2.aeat.es"
      : "www2.agenciatributaria.gob.es";
  const endpoint =
    profile.mode === "verifactu" ? "ValidarQR" : "ValidarQRNoVerifactu";
  const date = `${facts.fecha.slice(8, 10)}-${facts.fecha.slice(5, 7)}-${facts.fecha.slice(0, 4)}`;
  const values = [facts.nif, facts.numserie, date, facts.importe];
  const text = `https://${host}/wlpl/TIKE-CONT/${endpoint}?${PARAMETERS.map((name, index) => `${name}=${encodeURIComponent(values[index]!)}`).join("&")}`;
  const bytes = new TextEncoder().encode(text);
  if (bytes.byteLength > profile.maximumPayloadBytes) return qrFailure();
  return succeeded(
    Object.freeze({
      text,
      bytes,
      legend: profile.mode === "verifactu" ? "VERI*FACTU" : "QR tributario",
    }),
  );
}

export function parseQrPayload(
  profile: QrEditionProfile,
  text: string,
): OperationResult<QrInvoiceFacts> {
  if (!validProfile(profile) || !ASCII.test(text)) return qrFailure();
  const expected = buildQrPayload(profile, {
    nif: "89890001K",
    numserie: "X",
    fecha: "2024-01-01" as FiscalDate,
    importe: "1",
  });
  if (expected.status !== "succeeded") return qrFailure();
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return qrFailure();
  }
  const prefix = expected.value.text.slice(0, expected.value.text.indexOf("?"));
  if (
    `${url.origin}${url.pathname}` !== prefix ||
    [...url.searchParams.keys()].join(",") !== PARAMETERS.join(",")
  )
    return qrFailure();
  const values = PARAMETERS.map((name) => url.searchParams.get(name) ?? "");
  const nif = values[0]!;
  const numserie = values[1]!;
  const date = values[2]!;
  const importe = values[3]!;
  const parsedDate = parseFiscalDate(
    `${date.slice(6)}-${date.slice(3, 5)}-${date.slice(0, 2)}`,
  );
  if (
    parsedDate.status !== "succeeded" ||
    !validFacts({ nif, numserie, fecha: parsedDate.value, importe }) ||
    buildQrPayload(profile, { nif, numserie, fecha: parsedDate.value, importe })
      .status !== "succeeded"
  )
    return qrFailure();
  return succeeded(
    Object.freeze({ nif, numserie, fecha: parsedDate.value, importe }),
  );
}

function validProfile(value: QrEditionProfile): boolean {
  return (
    value.maximumPayloadBytes > 0 &&
    (value.environment === "test" || value.environment === "production") &&
    (value.mode === "verifactu" || value.mode === "non-verifactu")
  );
}
function validFacts(value: QrInvoiceFacts): boolean {
  return (
    NIF.test(value.nif) &&
    value.numserie.length > 0 &&
    value.numserie.length <= 60 &&
    ASCII.test(value.numserie) &&
    AMOUNT.test(value.importe) &&
    !value.importe.includes(",")
  );
}
function qrFailure(): OperationResult<never> {
  return failed("invalid", [
    diagnostic("DIAG-QR-INVALID", "input", "structure", "/qr"),
  ]);
}
