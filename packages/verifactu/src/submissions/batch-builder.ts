// SPDX-License-Identifier: Apache-2.0

import { createHash } from "node:crypto";
import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";
import { parseSecureXml, serializeXml, type XmlElement, type XmlNode } from "../xml/codec.js";
import type { StoredRecord } from "../state/model.js";
import type { AeatEndpointId } from "../transport/endpoints.js";
import { MAX_BATCH_RECORDS, type SubmissionBatch } from "./model.js";

export interface SubmissionHeader {
  readonly obligadoNif: string;
  readonly idVersion: string;
  readonly nombreSistemaInformatico: string;
  readonly idSistemaInformatico: string;
  readonly version: string;
  readonly numeroInstalacion: string;
  readonly tipoUsoPosibleMultiOT: "S" | "N";
  readonly tipoUsoPosibleSoloVerifactu: "S" | "N";
}

export function buildSubmissionBatch(input: {
  readonly batchId: string;
  readonly environment: "test" | "production";
  readonly endpointId: AeatEndpointId;
  readonly records: readonly StoredRecord[];
  readonly createdAt: string;
  readonly header: SubmissionHeader;
}): Result<SubmissionBatch> {
  if (input.records.length < 1 || input.records.length > MAX_BATCH_RECORDS)
    return failure("INVALID_INPUT", [
      createDiagnostic({
        code: "VF_INPUT_LIMIT_EXCEEDED",
        severity: "error",
        phase: "limits",
        path: "/records",
      }),
    ]);
  if (
    input.records.some(
      (record, index) =>
        record.position !== index ||
        record.contextId !== input.header.obligadoNif ||
        record.bytes.byteLength === 0,
    )
  )
    return failure("INVALID_INPUT", [
      createDiagnostic({
        code: "VF_INPUT_VALUE_INVALID",
        severity: "error",
        phase: "record",
        path: "/records",
      }),
    ]);
  if (!/^[A-Z0-9]{9}$/u.test(input.header.obligadoNif))
    return failure("INVALID_INPUT", [
      createDiagnostic({
        code: "VF_INPUT_VALUE_INVALID",
        severity: "error",
        phase: "record",
        path: "/header/obligadoNif",
      }),
    ]);
  const roots: XmlElement[] = [];
  for (const record of input.records) {
    const parsed = parseSecureXml(record.bytes);
    if (!parsed.ok) return parsed;
    roots.push(parsed.value);
  }
  const bodyRoot: XmlElement = Object.freeze({
    name: "RegFactuSistemaFacturacion",
    attributes: Object.freeze({
      xmlns:
        "https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tikeV1.0/cont/ws/",
    }),
    children: Object.freeze([
      element("Cabecera", [
        element("ObligadoEmision", [element("NIF", [text(input.header.obligadoNif)])]),
        element("IDVersion", [text(input.header.idVersion)]),
        element("SistemaInformatico", [
          element("NombreSistemaInformatico", [text(input.header.nombreSistemaInformatico)]),
          element("IdSistemaInformatico", [text(input.header.idSistemaInformatico)]),
          element("Version", [text(input.header.version)]),
          element("NumeroInstalacion", [text(input.header.numeroInstalacion)]),
          element("TipoUsoPosibleMultiOT", [text(input.header.tipoUsoPosibleMultiOT)]),
          element("TipoUsoPosibleSoloVerifactu", [text(input.header.tipoUsoPosibleSoloVerifactu)]),
        ]),
      ]),
      ...roots.map((root) => element("RegistroFactura", [root])),
    ]),
  });
  const body = new TextEncoder().encode(serializeXml(bodyRoot));
  const requestDigest = createHash("sha256").update(body).digest("hex");
  return success(
    Object.freeze({
      batchId: input.batchId,
      environment: input.environment,
      endpointId: input.endpointId,
      recordIds: Object.freeze(input.records.map((record) => record.recordId)),
      records: Object.freeze(input.records.map(cloneRecord)),
      body,
      requestDigest,
      createdAt: input.createdAt,
    }),
  );
}

function element(name: string, children: readonly XmlNode[]): XmlElement {
  return Object.freeze({ name, attributes: Object.freeze({}), children: Object.freeze(children) });
}
function text(value: string): string {
  return value;
}
function cloneRecord(record: StoredRecord): StoredRecord {
  return Object.freeze({ ...record, bytes: new Uint8Array(record.bytes) });
}
