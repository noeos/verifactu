// SPDX-License-Identifier: Apache-2.0

import { createDiagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";

export type AeatEnvironment = "test" | "production";
export type AeatEndpointId =
  "verifactu" | "requerimiento" | "verifactu-sello" | "requerimiento-sello";

export interface AeatEndpoint {
  readonly id: AeatEndpointId;
  readonly environment: AeatEnvironment;
  readonly url: string;
  readonly soapAction: string;
}

const ENDPOINTS: readonly AeatEndpoint[] = Object.freeze([
  {
    id: "verifactu",
    environment: "test",
    url: "https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP",
    soapAction: "RegFactuSistemaFacturacion",
  },
  {
    id: "requerimiento",
    environment: "test",
    url: "https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/RequerimientoSOAP",
    soapAction: "RegFactuSistemaFacturacion",
  },
  {
    id: "verifactu-sello",
    environment: "test",
    url: "https://prewww10.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP",
    soapAction: "RegFactuSistemaFacturacion",
  },
  {
    id: "requerimiento-sello",
    environment: "test",
    url: "https://prewww10.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/RequerimientoSOAP",
    soapAction: "RegFactuSistemaFacturacion",
  },
  {
    id: "verifactu",
    environment: "production",
    url: "https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP",
    soapAction: "RegFactuSistemaFacturacion",
  },
  {
    id: "requerimiento",
    environment: "production",
    url: "https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/RequerimientoSOAP",
    soapAction: "RegFactuSistemaFacturacion",
  },
  {
    id: "verifactu-sello",
    environment: "production",
    url: "https://www10.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP",
    soapAction: "RegFactuSistemaFacturacion",
  },
  {
    id: "requerimiento-sello",
    environment: "production",
    url: "https://www10.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/RequerimientoSOAP",
    soapAction: "RegFactuSistemaFacturacion",
  },
]);

export function resolveAeatEndpoint(
  environment: AeatEnvironment,
  endpointId: AeatEndpointId,
): Result<AeatEndpoint> {
  const endpoint = ENDPOINTS.find(
    (item) => item.environment === environment && item.id === endpointId,
  );
  return endpoint === undefined
    ? failure("INVALID_INPUT", [
        createDiagnostic({
          code: "VF_TRANSPORT_ENDPOINT_INVALID",
          severity: "error",
          phase: "transport",
        }),
      ])
    : success(endpoint);
}

export function listAeatEndpoints(): readonly AeatEndpoint[] {
  return ENDPOINTS;
}
