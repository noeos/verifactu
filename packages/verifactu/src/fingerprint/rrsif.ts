// SPDX-License-Identifier: Apache-2.0

import { createHash, timingSafeEqual } from "node:crypto";
import { createDiagnostic, type Diagnostic } from "../diagnostics/diagnostic.js";
import { invalid, valid, type ValidationResult } from "../diagnostics/result.js";
import {
  AeatDate,
  AeatDateTime,
  DecimalLexeme,
  Nif,
  OfficialText,
  RrsifFingerprint,
} from "../domain/values.js";
import { inspectExactObject } from "../validation/object-inspection.js";

export type InvoiceType = "F1" | "F2" | "F3" | "R1" | "R2" | "R3" | "R4" | "R5";
export type EventType = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10";

export type PreviousFingerprint =
  | { readonly kind: "genesis" }
  | { readonly kind: "previous"; readonly fingerprint: RrsifFingerprint };

export interface AltaFingerprintInput {
  readonly kind: "alta";
  readonly issuerNif: Nif;
  readonly invoiceNumber: OfficialText;
  readonly issueDate: AeatDate;
  readonly invoiceType: InvoiceType;
  readonly taxAmount: DecimalLexeme;
  readonly totalAmount: DecimalLexeme;
  readonly previous: PreviousFingerprint;
  readonly generatedAt: AeatDateTime;
}

export interface AnulacionFingerprintInput {
  readonly kind: "anulacion";
  readonly issuerNif: Nif;
  readonly invoiceNumber: OfficialText;
  readonly issueDate: AeatDate;
  readonly previous: PreviousFingerprint;
  readonly generatedAt: AeatDateTime;
}

export type ProducerFingerprintIdentity =
  | { readonly kind: "nif"; readonly nif: Nif }
  | { readonly kind: "other"; readonly id: OfficialText };

export interface EventFingerprintInput {
  readonly kind: "event";
  readonly producer: ProducerFingerprintIdentity;
  readonly systemId: OfficialText;
  readonly version: OfficialText;
  readonly installationNumber: OfficialText;
  readonly taxpayerNif: Nif;
  readonly eventType: EventType;
  readonly previous: PreviousFingerprint;
  readonly generatedAt: AeatDateTime;
}

export type FingerprintInput =
  AltaFingerprintInput | AnulacionFingerprintInput | EventFingerprintInput;

export interface FingerprintComputation {
  readonly fingerprint: RrsifFingerprint;
  readonly byteLength: number;
}

export function validateFingerprintInput(input: unknown): ValidationResult<FingerprintInput> {
  const kindObject = inspectExactObject(
    input,
    ["kind"],
    [
      "issuerNif",
      "invoiceNumber",
      "issueDate",
      "invoiceType",
      "taxAmount",
      "totalAmount",
      "previous",
      "generatedAt",
      "producer",
      "systemId",
      "version",
      "installationNumber",
      "taxpayerNif",
      "eventType",
    ],
  );
  if (!kindObject.ok) return inputInvalid(kindObject.path);
  const kind = kindObject.value["kind"];
  if (kind === "alta") return validateAlta(input);
  if (kind === "anulacion") return validateAnulacion(input);
  if (kind === "event") return validateEvent(input);
  return inputInvalid("/kind");
}

export function calculateRrsifFingerprint(input: FingerprintInput): FingerprintComputation {
  const preimage = buildRrsifPreimage(input);
  const bytes = Buffer.from(preimage, "utf8");
  const value = createHash("sha256").update(bytes).digest("hex").toUpperCase();
  const fingerprint = RrsifFingerprint.parse(value);
  if (fingerprint === undefined) throw new Error("unreachable SHA-256 encoding failure");
  return Object.freeze({ fingerprint, byteLength: bytes.length });
}

export function verifyRrsifFingerprint(
  input: FingerprintInput,
  expected: unknown,
): ValidationResult<FingerprintComputation> {
  const parsed = RrsifFingerprint.parse(expected);
  if (parsed === undefined) {
    return invalid([
      createDiagnostic({
        code: "VF_FINGERPRINT_FORMAT_INVALID",
        severity: "error",
        phase: "fingerprint",
        path: "/fingerprint",
      }),
    ]);
  }
  const computed = calculateRrsifFingerprint(input);
  const left = Buffer.from(computed.fingerprint.value, "hex");
  const right = Buffer.from(parsed.value, "hex");
  if (!timingSafeEqual(left, right)) {
    return invalid([
      createDiagnostic({
        code: "VF_FINGERPRINT_MISMATCH",
        severity: "error",
        phase: "fingerprint",
      }),
    ]);
  }
  return valid(computed);
}

export function buildRrsifPreimage(input: FingerprintInput): string {
  const previous = input.previous.kind === "genesis" ? "" : input.previous.fingerprint.value;
  if (input.kind === "alta") {
    return joinPairs([
      ["IDEmisorFactura", input.issuerNif.value],
      ["NumSerieFactura", input.invoiceNumber.value],
      ["FechaExpedicionFactura", input.issueDate.value],
      ["TipoFactura", input.invoiceType],
      ["CuotaTotal", input.taxAmount.value],
      ["ImporteTotal", input.totalAmount.value],
      ["Huella", previous],
      ["FechaHoraHusoGenRegistro", input.generatedAt.value],
    ]);
  }
  if (input.kind === "anulacion") {
    return joinPairs([
      ["IDEmisorFacturaAnulada", input.issuerNif.value],
      ["NumSerieFacturaAnulada", input.invoiceNumber.value],
      ["FechaExpedicionFacturaAnulada", input.issueDate.value],
      ["Huella", previous],
      ["FechaHoraHusoGenRegistro", input.generatedAt.value],
    ]);
  }
  return joinPairs([
    ["NIF", input.producer.kind === "nif" ? input.producer.nif.value : ""],
    ["ID", input.producer.kind === "other" ? input.producer.id.value : ""],
    ["IdSistemaInformatico", input.systemId.value],
    ["Version", input.version.value],
    ["NumeroInstalacion", input.installationNumber.value],
    ["NIF", input.taxpayerNif.value],
    ["TipoEvento", input.eventType],
    ["HuellaEvento", previous],
    ["FechaHoraHusoGenEvento", input.generatedAt.value],
  ]);
}

function validateAlta(input: unknown): ValidationResult<AltaFingerprintInput> {
  const object = inspectExactObject(input, [
    "kind",
    "issuerNif",
    "invoiceNumber",
    "issueDate",
    "invoiceType",
    "taxAmount",
    "totalAmount",
    "previous",
    "generatedAt",
  ]);
  if (!object.ok) return inputInvalid(object.path);
  const issuerNif = Nif.parse(object.value["issuerNif"]);
  const invoiceNumber = parseInvoiceNumber(object.value["invoiceNumber"]);
  const issueDate = AeatDate.parse(object.value["issueDate"]);
  const invoiceType = object.value["invoiceType"];
  const taxAmount = DecimalLexeme.parse(object.value["taxAmount"]);
  const totalAmount = DecimalLexeme.parse(object.value["totalAmount"]);
  const previous = parsePrevious(object.value["previous"]);
  const generatedAt = AeatDateTime.parse(object.value["generatedAt"]);
  if (
    issuerNif === undefined ||
    invoiceNumber === undefined ||
    issueDate === undefined ||
    !isInvoiceType(invoiceType) ||
    taxAmount === undefined ||
    totalAmount === undefined ||
    previous === undefined ||
    generatedAt === undefined
  ) {
    return inputInvalid("");
  }
  return valid(
    Object.freeze({
      kind: "alta",
      issuerNif,
      invoiceNumber,
      issueDate,
      invoiceType,
      taxAmount,
      totalAmount,
      previous,
      generatedAt,
    }),
  );
}

function validateAnulacion(input: unknown): ValidationResult<AnulacionFingerprintInput> {
  const object = inspectExactObject(input, [
    "kind",
    "issuerNif",
    "invoiceNumber",
    "issueDate",
    "previous",
    "generatedAt",
  ]);
  if (!object.ok) return inputInvalid(object.path);
  const issuerNif = Nif.parse(object.value["issuerNif"]);
  const invoiceNumber = parseInvoiceNumber(object.value["invoiceNumber"]);
  const issueDate = AeatDate.parse(object.value["issueDate"]);
  const previous = parsePrevious(object.value["previous"]);
  const generatedAt = AeatDateTime.parse(object.value["generatedAt"]);
  if (
    issuerNif === undefined ||
    invoiceNumber === undefined ||
    issueDate === undefined ||
    previous === undefined ||
    generatedAt === undefined
  ) {
    return inputInvalid("");
  }
  return valid(
    Object.freeze({
      kind: "anulacion",
      issuerNif,
      invoiceNumber,
      issueDate,
      previous,
      generatedAt,
    }),
  );
}

function validateEvent(input: unknown): ValidationResult<EventFingerprintInput> {
  const object = inspectExactObject(input, [
    "kind",
    "producer",
    "systemId",
    "version",
    "installationNumber",
    "taxpayerNif",
    "eventType",
    "previous",
    "generatedAt",
  ]);
  if (!object.ok) return inputInvalid(object.path);
  const producer = parseProducer(object.value["producer"]);
  const systemId = parseSystemId(object.value["systemId"]);
  const version = OfficialText.parse(object.value["version"], 1, 50);
  const installationNumber = OfficialText.parse(object.value["installationNumber"], 1, 100);
  const taxpayerNif = Nif.parse(object.value["taxpayerNif"]);
  const eventType = object.value["eventType"];
  const previous = parsePrevious(object.value["previous"]);
  const generatedAt = AeatDateTime.parse(object.value["generatedAt"]);
  if (
    producer === undefined ||
    systemId === undefined ||
    version === undefined ||
    installationNumber === undefined ||
    taxpayerNif === undefined ||
    !isEventType(eventType) ||
    previous === undefined ||
    generatedAt === undefined
  ) {
    return inputInvalid("");
  }
  return valid(
    Object.freeze({
      kind: "event",
      producer,
      systemId,
      version,
      installationNumber,
      taxpayerNif,
      eventType,
      previous,
      generatedAt,
    }),
  );
}

function parsePrevious(input: unknown): PreviousFingerprint | undefined {
  const object = inspectExactObject(input, ["kind"], ["fingerprint"]);
  if (!object.ok) return undefined;
  if (object.value["kind"] === "genesis" && !("fingerprint" in object.value)) {
    return Object.freeze({ kind: "genesis" });
  }
  if (object.value["kind"] !== "previous") return undefined;
  const fingerprint = RrsifFingerprint.parse(object.value["fingerprint"]);
  return fingerprint === undefined ? undefined : Object.freeze({ kind: "previous", fingerprint });
}

function parseProducer(input: unknown): ProducerFingerprintIdentity | undefined {
  const object = inspectExactObject(input, ["kind"], ["nif", "id"]);
  if (!object.ok) return undefined;
  if (object.value["kind"] === "nif") {
    const nif = Nif.parse(object.value["nif"]);
    return nif === undefined || "id" in object.value
      ? undefined
      : Object.freeze({ kind: "nif", nif });
  }
  if (object.value["kind"] === "other") {
    const id = OfficialText.parse(object.value["id"], 1, 20);
    return id === undefined || "nif" in object.value
      ? undefined
      : Object.freeze({ kind: "other", id });
  }
  return undefined;
}

function parseInvoiceNumber(input: unknown): OfficialText | undefined {
  const value = OfficialText.parse(input, 1, 60);
  return value !== undefined && /^[\x20-\x7e]+$/u.test(value.value) && !/["'<>=]/u.test(value.value)
    ? value
    : undefined;
}

function parseSystemId(input: unknown): OfficialText | undefined {
  const value = OfficialText.parse(input, 2, 2);
  return value !== undefined && /^[A-Z0-9]{2}$/u.test(value.value) ? value : undefined;
}

function joinPairs(pairs: readonly (readonly [string, string])[]): string {
  return pairs.map(([name, value]) => `${name}=${value.trim()}`).join("&");
}

function isInvoiceType(value: unknown): value is InvoiceType {
  return (
    value === "F1" ||
    value === "F2" ||
    value === "F3" ||
    value === "R1" ||
    value === "R2" ||
    value === "R3" ||
    value === "R4" ||
    value === "R5"
  );
}

function isEventType(value: unknown): value is EventType {
  return (
    value === "01" ||
    value === "02" ||
    value === "03" ||
    value === "04" ||
    value === "05" ||
    value === "06" ||
    value === "07" ||
    value === "08" ||
    value === "09" ||
    value === "10"
  );
}

function inputInvalid<T>(path: string): ValidationResult<T> {
  const diagnostics: Diagnostic[] = [
    createDiagnostic({
      code: "VF_INPUT_VALUE_INVALID",
      severity: "error",
      phase: "input",
      ...(path.length === 0 ? {} : { path }),
    }),
  ];
  return invalid(diagnostics);
}
