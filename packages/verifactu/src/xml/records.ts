// SPDX-License-Identifier: Apache-2.0

import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";
import type { ValidatedBillingRecord } from "../validation/record.js";
import { serializeXml, type XmlElement, type XmlNode } from "./codec.js";

/** Serializes the validated record payload in AEAT field order. Signature is deliberately a later child. */
export function serializeBillingRecord(
  record: ValidatedBillingRecord,
  signal?: AbortSignal,
): Result<Uint8Array> {
  if (signal?.aborted === true) {
    return failure("ABORTED", [
      createDiagnostic({ code: "VF_INPUT_ABORTED", severity: "error", phase: "input" }),
    ]);
  }
  const root = record.kind === "alta" ? altaElement(record) : anulacionElement(record);
  return success(new TextEncoder().encode(serializeXml(root)));
}

function altaElement(
  record: Extract<ValidatedBillingRecord, { readonly kind: "alta" }>,
): XmlElement {
  const fingerprint = record.fingerprint;
  return element("RegistroAlta", [
    element("IDFactura", [
      element("IDEmisorFactura", [text(fingerprint.issuerNif.value)]),
      element("NumSerieFactura", [text(fingerprint.invoiceNumber.value)]),
      element("FechaExpedicionFactura", [text(fingerprint.issueDate.value)]),
    ]),
    element("TipoFactura", [text(fingerprint.invoiceType)]),
    element("CuotaTotal", [text(fingerprint.taxAmount.value)]),
    element("ImporteTotal", [text(fingerprint.totalAmount.value)]),
    element("Huella", [
      text(
        record.fingerprint.previous.kind === "genesis"
          ? ""
          : record.fingerprint.previous.fingerprint.value,
      ),
    ]),
    element("FechaHoraHusoGenRegistro", [text(fingerprint.generatedAt.value)]),
  ]);
}

function anulacionElement(
  record: Extract<ValidatedBillingRecord, { readonly kind: "anulacion" }>,
): XmlElement {
  const fingerprint = record.fingerprint;
  return element("RegistroAnulacion", [
    element("IDFactura", [
      element("IDEmisorFactura", [text(fingerprint.issuerNif.value)]),
      element("NumSerieFactura", [text(fingerprint.invoiceNumber.value)]),
      element("FechaExpedicionFactura", [text(fingerprint.issueDate.value)]),
    ]),
    element("Huella", [
      text(fingerprint.previous.kind === "genesis" ? "" : fingerprint.previous.fingerprint.value),
    ]),
    element("FechaHoraHusoGenRegistro", [text(fingerprint.generatedAt.value)]),
  ]);
}

function element(name: string, children: readonly XmlNode[]): XmlElement {
  return Object.freeze({ name, attributes: Object.freeze({}), children: Object.freeze(children) });
}

function text(value: string): string {
  return value;
}
