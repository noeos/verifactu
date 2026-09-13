# Implementación de las fases 6 y 7: persistencia, outbox y transporte

Estado: **completada técnicamente — 2026-09-05**

Este documento cierra la implementación de las fronteras locales y remotas definidas en la arquitectura. No declara por sí mismo la conformidad legal definitiva ni sustituye la validación contra los servicios de prueba de la AEAT prevista en las fases 9 y 10.

## Alcance entregado

- Modelo inmutable de estados de registro, transiciones permitidas, actor, intento, motivo y marca temporal.
- Cabeza de secuencia con compare-and-set, posición estricta, digest de enlace y detección de rollback.
- `RecordStore` como puerto de persistencia: lectura, commit atómico, transición CAS, escaneo acotado, checkpoint y verificación de frescura.
- Bundle de commit que conserva registro, cabeza, transiciones, evidencia y outbox como una única decisión lógica.
- `OutboxStore` con idempotencia por `workId`/digest, leases con token y fencing, expiración recuperable, estados terminales e inspección.
- Constructor de lotes limitado a 1.000 registros, orden de secuencia estable, copia defensiva de bytes, cabecera explícita y digest SHA-256 del cuerpo.
- Allowlist inmutable de endpoints AEAT de prueba y producción; el consumidor solo selecciona un identificador, nunca una URL arbitraria.
- SOAP 1.1 document/literal determinista, `SOAPAction` fijo, parser seguro y límites de respuesta.
- Transporte HTTPS Node sin redirecciones, sin reintentos internos, con mTLS proporcionado por un puerto de certificados opacos, timeout, abortado, límite de bytes y clasificación de posible entrega.
- Parser de respuesta que conserva estado global, resultado por línea, CSV, espera indicada y fault SOAP sin convertir HTTP 200 en éxito implícito.
- Procesador de cola con orden lease → submitting → envío → clasificación, indeterminación ante pérdida de respuesta, aplicación de estados por línea y política de reintentos determinista con backoff y dead-letter.

## Invariantes de seguridad y legalidad

1. La URL, el método y la acción SOAP se derivan de un endpoint versionado; no se acepta SSRF por entrada de usuario.
2. El digest declarado debe coincidir con los bytes enviados; la identidad del certificado debe coincidir con el proveedor TLS.
3. Una conexión cortada después de escribir bytes nunca se reintenta automáticamente como si no hubiese entrega: queda `indeterminate` para reconciliación.
4. Una respuesta parcial conserva cada código y descripción recibidos; una línea ausente no se marca favorablemente.
5. Las respuestas SOAP se parsean con el mismo límite y rechazo de DTD, entidades, CDATA, instrucciones y datos no XML que el codec seguro del proyecto.
6. Los leases se validan por token, fencing y expiración. Un worker antiguo no puede completar ni liberar trabajo de otro worker.
7. Toda decisión de estado y transporte es reproducible desde bytes, reloj inyectado, política y contratos versionados; no existe estado mutable de módulo.

## Evidencia y gates

La evidencia de esta fase se mantiene en los tests de unidad y seguridad, los contratos de puertos, el informe API Extractor, el benchmark de lote máximo y los checks de mutación de límites de estado, reintento y endpoint. Los gates de CI incluyen además formato, lint, typecheck, consumidores ESM/CommonJS, empaquetado, reproducibilidad, SBOM y auditoría de gobierno.

Los adaptadores de memoria son únicamente fixtures deterministas para contratos y fault injection. Un adaptador de producción debe implementar las mismas garantías en una transacción real, incluyendo durable commit, aislamiento, recuperación y conservación conforme a `docs/07-arquitectura/05-persistencia-atomicidad-outbox.md`.
