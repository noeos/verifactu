// SPDX-License-Identifier: Apache-2.0

import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";
import { parseSecureXml, serializeXml, type XmlElement, type XmlNode } from "../xml/codec.js";

export interface SoapRequest {
  readonly bytes: Uint8Array;
  readonly contentType: "text/xml; charset=utf-8";
  readonly soapAction: string;
}

export function buildSoapRequest(payload: XmlElement, soapAction: string): Result<SoapRequest> {
  if (
    soapAction.length < 1 ||
    soapAction.length > 128 ||
    !/^[A-Za-z][A-Za-z0-9._:-]{0,127}$/u.test(soapAction)
  )
    return failure("INVALID_INPUT", [
      createDiagnostic({
        code: "VF_INPUT_VALUE_INVALID",
        severity: "error",
        phase: "transport",
        path: "/soapAction",
      }),
    ]);
  const envelope: XmlElement = Object.freeze({
    name: "soapenv:Envelope",
    attributes: Object.freeze({ "xmlns:soapenv": "http://schemas.xmlsoap.org/soap/envelope/" }),
    children: Object.freeze([element("soapenv:Header", []), element("soapenv:Body", [payload])]),
  });
  return success(
    Object.freeze({
      bytes: new TextEncoder().encode(serializeXml(envelope)),
      contentType: "text/xml; charset=utf-8",
      soapAction,
    }),
  );
}

export function parseSoapEnvelope(input: Uint8Array): Result<XmlElement> {
  const parsed = parseSecureXml(input);
  if (!parsed.ok)
    return failure("INVALID_INPUT", [
      createDiagnostic({
        code: "VF_TRANSPORT_RESPONSE_INVALID",
        severity: "error",
        phase: "transport",
      }),
    ]);
  if (!localName(parsed.value.name).endsWith("Envelope"))
    return failure("INVALID_INPUT", [
      createDiagnostic({
        code: "VF_TRANSPORT_RESPONSE_INVALID",
        severity: "error",
        phase: "transport",
        path: "/Envelope",
      }),
    ]);
  return success(parsed.value);
}

function element(name: string, children: readonly XmlNode[]): XmlElement {
  return Object.freeze({ name, attributes: Object.freeze({}), children: Object.freeze(children) });
}
function localName(name: string): string {
  return name.slice(name.lastIndexOf(":") + 1);
}
