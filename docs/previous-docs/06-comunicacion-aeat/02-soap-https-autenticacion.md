# SOAP, HTTPS y autenticación

Estado: **normativo**

El transporte usa SOAP 1.1 document/literal y UTF-8 conforme al WSDL 1.0 fijado. La autenticación mTLS presenta certificado electrónico cualificado reconocido. El envelope no lleva datos de autenticación inventados ni extensiones WS-* ajenas al contrato.

## Controles

- TLS con verificación completa de hostname y cadena; jamás `rejectUnauthorized=false` ni downgrade HTTP.
- Timeouts diferenciados para DNS, conexión, TLS, cabeceras, cuerpo y operación.
- Límites de petición, respuesta y redirects; redirects deshabilitados salvo fuente expresa.
- `Content-Type`, SOAPAction y envelope exactos.
- SOAP Fault parseado como respuesta estructurada, nunca como excepción perdida.
- Respuesta almacenada antes de clasificación final.
- La remisión puede efectuarla el obligado o un representante autorizado; la selección queda explícita en cabecera/configuración.
- Clave privada, PKCS#12, PIN, cabeceras de proxy y material de certificado no se registran ni serializan en errores.

El adapter no reintenta internamente. Devuelve observación única y completa al orquestador, que decide según política versionada.
