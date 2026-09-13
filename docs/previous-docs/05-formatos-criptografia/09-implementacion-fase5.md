# Implementación de fase 5: XML, QR, firma y certificados

## Alcance cerrado

La edición sucesora `aeat-rrsif-1.0@2026-09-05` incorpora las fronteras de XML seguro, generación de QR y los puertos de certificado y firma. La edición `aeat-rrsif-1.0@2026-09-03` permanece inmutable y verificable para no invalidar contratos ni evidencias ya emitidos.

El módulo XML utiliza un modelo de elementos inmutable, serialización UTF-8 determinista y límites explícitos de tamaño, profundidad, nodos y texto. DTD, entidades externas, XInclude, CDATA, instrucciones de procesamiento y namespaces no declarados se rechazan antes de aceptar el documento. La validación XSD completa queda en el adaptador de contratos generado, nunca en un parser con red o acceso al sistema de archivos.

El QR construye exclusivamente los cuatro parámetros AEAT en el orden normativo (`nif`, `numserie`, `fecha`, `importe`), aplica percent-encoding de URL, valida límites de la especificación y genera ISO/IEC 18004 mediante corrección M, zona de silencio configurable y tamaño físico de 30--40 mm.

Las claves privadas no forman parte del modelo de datos. `CertificateHandle` únicamente expone metadatos públicos y una operación de firma controlada; `createDssBackend` conecta el proceso DSS 6.4 (o un HSM equivalente) sin introducir claves ni procesos en el dominio. Los adaptadores son responsables de XAdES-EPES, validación de cadena, listas de confianza y revocación. El perfil fija la política AEAT (OID `2.16.724.1.3.1.1.2.1.9`) y rechaza firmas estructuralmente incompletas.

## Referencias y reproducibilidad

Las fuentes sucesoras se registran en `regulatory/phase5-sources.json`. El trabajo de importación de release debe descargar cada URL HTTPS, fijar SHA-256/SHA-512, conservar el binario en un snapshot inmutable y actualizar el contrato generado únicamente tras revisión. Nunca se permite sustituir un documento oficial por una copia no autenticada.

## Límites de responsabilidad

Esta fase no añade persistencia, transporte AEAT ni política de reintentos. Esas capacidades siguen siendo fases posteriores y sólo pueden consumir estas interfaces públicas, sin acceder a internals ni al motor de Verification Engine.
