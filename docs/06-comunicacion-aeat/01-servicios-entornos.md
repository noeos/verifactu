# Servicios y entornos AEAT

Estado: **normativo**

Cada entorno tiene identidad tipada, endpoints oficiales, certificados aceptados, WSDL/XSD, finalidad y restricciones. La edición usa WSDL 1.1, SOAP 1.1 document/literal, HTTPS, XML UTF-8 y certificado cualificado reconocido.

| Servicio | Pruebas | Producción |
|---|---|---|
| WSDL | `https://prewww2.aeat.es/static_files/common/internet/dep/aplicaciones/es/aeat/tikeV1.0/cont/ws/SistemaFacturacion.wsdl` | `https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tikeV1.0/cont/ws/SistemaFacturacion.wsdl` |
| VERI*FACTU | `https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP` | `https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP` |
| requerimiento | `https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/RequerimientoSOAP` | `https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/RequerimientoSOAP` |
| VERI*FACTU sello | `https://prewww10.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP` | `https://www10.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP` |
| requerimiento sello | `https://prewww10.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/RequerimientoSOAP` | `https://www10.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/RequerimientoSOAP` |

El adaptador solo conecta a hosts, esquemas, puertos y TLS allowlisted por la edición. Un endpoint de desarrollo personalizado requiere una capacidad separada, marcada como no conforme, que no puede habilitarse accidentalmente en producción.

Las operaciones son `RegFactuSistemaFacturacion` y, solo para VERI*FACTU, `ConsultaFactuSistemaFacturacion`. El cotejo QR usa los endpoints REST/HTML separados definidos en el contrato QR; no se confunde con SOAP.

La selección de entorno se fija al crear el cliente y aparece en evidencia saneada. No se permite fallback automático de producción a pruebas ni viceversa. Ninguna importación, validación, lectura de QR o prueba unitaria realiza red implícita.
