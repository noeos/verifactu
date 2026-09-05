// SPDX-License-Identifier: Apache-2.0

export { editionInfo, getEdition, listEditions } from "./index.js";
export type { EditionId, EditionInfo, Result } from "./index.js";

/** Successor edition for XML/QR/XAdES material. The previous edition remains readable. */
export const PHASE5_EDITION_ID = "aeat-rrsif-1.0@2026-09-05" as const;
export const PHASE5_SOURCE_CATALOG = Object.freeze({
  signatureSpecification:
    "https://www.agenciatributaria.es/static_files/AEAT_Desarrolladores/EEDD/IVA/VERI-FACTU/Espec-Tecnicas/EspecTecGenerFirmaElectRfact.pdf",
  qrSpecification:
    "https://www.agenciatributaria.es/static_files/AEAT_Desarrolladores/EEDD/IVA/VERI-FACTU/DetalleEspecificacTecnCodigoQRfactura.pdf",
  aeatTechnicalPortal:
    "https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica.html",
  xadesStandard: "https://www.w3.org/TR/XAdES/",
  dssReference: "https://github.com/esig/dss/releases/tag/6.4",
});
