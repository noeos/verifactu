// SPDX-License-Identifier: Apache-2.0

import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";
import type { XmlElement } from "../xml/codec.js";
import { parseSoapEnvelope } from "./soap.js";

export type AeatSubmissionStatus = "Correcto" | "ParcialmenteCorrecto" | "Incorrecto";
export type AeatLineStatus = "Correcto" | "AceptadoConErrores" | "Incorrecto";

export interface AeatResponseLine {
  readonly invoiceId: string;
  readonly operation: string;
  readonly externalReference: string | undefined;
  readonly status: AeatLineStatus;
  readonly code: string | undefined;
  readonly description: string | undefined;
}

export interface AeatSubmissionResponse {
  readonly status: AeatSubmissionStatus;
  readonly waitSeconds: number | undefined;
  readonly csv: string | undefined;
  readonly lines: readonly AeatResponseLine[];
  readonly soapFault: boolean;
}

const LINE_STATUSES = new Set<string>(["Correcto", "AceptadoConErrores", "Incorrecto"]);
const SUBMISSION_STATUSES = new Set<string>(["Correcto", "ParcialmenteCorrecto", "Incorrecto"]);

export function parseAeatResponse(input: Uint8Array): Result<AeatSubmissionResponse> {
  const envelope = parseSoapEnvelope(input);
  if (!envelope.ok) return envelope;
  const fault = find(envelope.value, "Fault");
  if (fault !== undefined)
    return success({
      status: "Incorrecto",
      waitSeconds: undefined,
      csv: undefined,
      lines: [],
      soapFault: true,
    });
  const body = find(envelope.value, "Body");
  const status = body === undefined ? undefined : textOf(find(body, "Estado"));
  if (status === undefined || !isSubmissionStatus(status))
    return failure("INVALID_INPUT", [
      createDiagnostic({
        code: "VF_TRANSPORT_RESPONSE_INVALID",
        severity: "error",
        phase: "transport",
      }),
    ]);
  const waitRaw = body === undefined ? undefined : textOf(find(body, "TiempoEsperaEnvio"));
  const waitSeconds = waitRaw === undefined ? undefined : Number(waitRaw);
  if (
    waitSeconds !== undefined &&
    (!Number.isInteger(waitSeconds) || waitSeconds < 0 || waitSeconds > 86_400)
  )
    return failure("INVALID_INPUT", [
      createDiagnostic({
        code: "VF_TRANSPORT_RESPONSE_INVALID",
        severity: "error",
        phase: "transport",
        path: "/TiempoEsperaEnvio",
      }),
    ]);
  const lines = (body === undefined ? [] : findAll(body, "RespuestaLinea")).map(parseLine);
  if (lines.some((line) => line === undefined))
    return failure("INVALID_INPUT", [
      createDiagnostic({
        code: "VF_TRANSPORT_RESPONSE_INVALID",
        severity: "error",
        phase: "transport",
      }),
    ]);
  return success(
    Object.freeze({
      status,
      waitSeconds,
      csv: body === undefined ? undefined : textOf(find(body, "CSV")),
      lines: Object.freeze(lines.filter((line): line is AeatResponseLine => line !== undefined)),
      soapFault: false,
    }),
  );
}

function parseLine(node: XmlElement): AeatResponseLine | undefined {
  const status = textOf(find(node, "EstadoRegistro"));
  if (status === undefined || !isLineStatus(status)) return undefined;
  return Object.freeze({
    invoiceId: textOf(find(node, "IDFactura")) ?? "",
    operation: textOf(find(node, "Operacion")) ?? "",
    externalReference: textOf(find(node, "RefExterna")),
    status,
    code: textOf(find(node, "CodigoErrorRegistro")),
    description: textOf(find(node, "DescripcionErrorRegistro")),
  });
}

function find(root: XmlElement, name: string): XmlElement | undefined {
  return (
    [root, ...root.children.filter((child): child is XmlElement => typeof child !== "string")].find(
      (node) => localName(node.name) === name,
    ) ??
    root.children
      .filter((child): child is XmlElement => typeof child !== "string")
      .map((child) => find(child, name))
      .find((value) => value !== undefined)
  );
}
function findAll(root: XmlElement, name: string): XmlElement[] {
  const values: XmlElement[] = [];
  if (localName(root.name) === name) values.push(root);
  for (const child of root.children)
    if (typeof child !== "string") values.push(...findAll(child, name));
  return values;
}
function textOf(root: XmlElement | undefined): string | undefined {
  if (root === undefined) return undefined;
  return (
    root.children.filter((child): child is string => typeof child === "string").join("") ||
    root.children
      .filter((child): child is XmlElement => typeof child !== "string")
      .map((child) => textOf(child) ?? "")
      .join("") ||
    undefined
  );
}
function localName(name: string): string {
  return name.slice(name.lastIndexOf(":") + 1);
}
function isSubmissionStatus(value: string): value is AeatSubmissionStatus {
  return SUBMISSION_STATUSES.has(value);
}
function isLineStatus(value: string): value is AeatLineStatus {
  return LINE_STATUSES.has(value);
}
