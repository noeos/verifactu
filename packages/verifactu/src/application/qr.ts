import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { TextEncoder } from "node:util";
import { parseFiscalDate, type FiscalDate } from "../domain/date-time.js";
import { diagnostic } from "../domain/diagnostics.js";
import type { EditionId } from "../domain/identities.js";
import type { OperatingMode } from "../domain/mode-tenure.js";
import type { DigestComputer } from "./fingerprint.js";

export interface QrInvoiceFacts {
  readonly nif: string;
  readonly numserie: string;
  readonly fecha: FiscalDate;
  readonly importe: string;
}

export interface QrEditionProfile {
  readonly profileId: "aeat.qr@0.5.0";
  readonly editionId: EditionId;
  readonly environment: "test" | "production";
  readonly mode: OperatingMode;
  readonly maximumPayloadBytes: number;
}

export interface QrPayload {
  readonly profileId: string;
  readonly editionId: EditionId;
  readonly facts: QrInvoiceFacts;
  readonly text: string;
  readonly bytes: Uint8Array;
  readonly artifactDigest: string;
  readonly label: "QR tributario:";
  readonly legend: "VERI*FACTU" | "QR tributario";
}

const ASCII = /^[\x20-\x7e]*$/u;
const NIF = /^[A-Z0-9]{9}$/u;
const AMOUNT = /^-?\d{1,12}(?:\.\d{1,2})?$/u;
const PARAMETERS = ["nif", "numserie", "fecha", "importe"] as const;
const AEAT_QR_PROFILE_ID = "aeat.qr@0.5.0";
const AEAT_QR_EDITION_ID = "rrsif-2026-09-21-authoritative-candidate";
const MAXIMUM_QR_PAYLOAD_BYTES = 512;

export function buildQrPayload(
  profile: QrEditionProfile,
  facts: QrInvoiceFacts,
  digest: DigestComputer,
): OperationResult<QrPayload> {
  try {
    if (!validProfile(profile) || !validFacts(facts)) return qrFailure();
    const normalizedFacts = Object.freeze({ ...facts });
    const text = canonicalQrText(profile, normalizedFacts);
    const bytes = new TextEncoder().encode(text);
    if (bytes.byteLength > profile.maximumPayloadBytes) return qrFailure();
    const immutableBytes = Uint8Array.from(bytes);
    const digestBytes = digest("SHA-256", Uint8Array.from(immutableBytes));
    if (digestBytes.length !== 32) return qrFailure();
    const artifactDigest = hex(digestBytes);
    return succeeded(
      Object.freeze({
        profileId: profile.profileId,
        editionId: profile.editionId,
        text,
        facts: normalizedFacts,
        get bytes() {
          return Uint8Array.from(immutableBytes);
        },
        artifactDigest,
        label: "QR tributario:",
        legend: profile.mode === "verifactu" ? "VERI*FACTU" : "QR tributario",
      }),
    );
  } catch {
    return qrFailure();
  }
}

export function parseQrPayload(
  profile: QrEditionProfile,
  text: string,
): OperationResult<QrInvoiceFacts> {
  try {
    if (!validProfile(profile) || typeof text !== "string" || !ASCII.test(text))
      return qrFailure();
    let url: URL;
    try {
      url = new URL(text);
    } catch {
      return qrFailure();
    }
    const prefix = urlPrefix(profile);
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
      !validFacts({ nif, numserie, fecha: parsedDate.value, importe })
    )
      return qrFailure();
    const normalizedFacts = {
      nif,
      numserie,
      fecha: parsedDate.value,
      importe,
    };
    if (
      !validFacts(normalizedFacts) ||
      canonicalQrText(profile, normalizedFacts) !== text
    )
      return qrFailure();
    return succeeded(Object.freeze(normalizedFacts));
  } catch {
    return qrFailure();
  }
}

function validProfile(value: QrEditionProfile): value is QrEditionProfile {
  return (
    value !== null &&
    typeof value === "object" &&
    value.profileId === AEAT_QR_PROFILE_ID &&
    value.editionId === AEAT_QR_EDITION_ID &&
    Number.isSafeInteger(value.maximumPayloadBytes) &&
    value.maximumPayloadBytes > 0 &&
    value.maximumPayloadBytes <= MAXIMUM_QR_PAYLOAD_BYTES &&
    (value.environment === "test" || value.environment === "production") &&
    (value.mode === "verifactu" || value.mode === "non-verifactu")
  );
}
function validFacts(value: QrInvoiceFacts): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.nif === "string" &&
    NIF.test(value.nif) &&
    typeof value.numserie === "string" &&
    value.numserie.length > 0 &&
    value.numserie.length <= 60 &&
    ASCII.test(value.numserie) &&
    typeof value.fecha === "string" &&
    parseFiscalDate(value.fecha).status === "succeeded" &&
    typeof value.importe === "string" &&
    AMOUNT.test(value.importe) &&
    !value.importe.includes(",")
  );
}

function encodeQueryComponent(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/gu,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}
function canonicalQrText(
  profile: QrEditionProfile,
  facts: QrInvoiceFacts,
): string {
  const date = `${facts.fecha.slice(8, 10)}-${facts.fecha.slice(5, 7)}-${facts.fecha.slice(0, 4)}`;
  const values = [facts.nif, facts.numserie, date, facts.importe];
  return `${urlPrefix(profile)}?${PARAMETERS.map((name, index) => `${name}=${encodeQueryComponent(values[index]!)}`).join("&")}`;
}
function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function urlPrefix(profile: QrEditionProfile): string {
  const host =
    profile.environment === "test"
      ? "prewww2.aeat.es"
      : "www2.agenciatributaria.gob.es";
  const endpoint =
    profile.mode === "verifactu" ? "ValidarQR" : "ValidarQRNoVerifactu";
  return `https://${host}/wlpl/TIKE-CONT/${endpoint}`;
}
function qrFailure(): OperationResult<never> {
  return failed("invalid", [
    diagnostic("DIAG-QR-INVALID", "input", "structure", "/qr"),
  ]);
}
