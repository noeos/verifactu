# Cierre de fases 6 y 7: persistencia, estados, outbox y transporte AEAT

Estado: **completadas técnicamente — 2026-09-05**

## Entregables verificables

- Puertos públicos de persistencia, outbox, transporte y observabilidad alineados con `docs/04-contratos/04-puertos-adaptadores.md`.
- Máquina de estados cerrada y negativa: solo se aceptan transiciones del grafo normativo; conflictos CAS y rollback producen diagnósticos estables.
- Commit lógico atómico con secuencia, registro, evidencia, transiciones y trabajo de salida; duplicados de outbox no mutan parcialmente el almacén.
- Leases recuperables y con fencing; expiración, worker obsoleto, límites y duplicados están cubiertos por pruebas negativas.
- Lotes de 1–1.000 registros, orden estable y cabecera explícita; el digest de solicitud se calcula sobre los bytes exactos que se conservan.
- Allowlist de los ocho endpoints documentados (test/producción, VERI*FACTU/requerimiento y variantes de sello), siempre HTTPS y sin URL suministrada por el llamador.
- SOAP 1.1 determinista, `SOAPAction` exacto, TLS/mTLS por proveedor opaco, timeout, cancelación, límite de respuesta y ausencia de reintentos ocultos.
- Respuestas globales y por línea preservadas; fault, HTTP no exitoso, respuesta truncada o pérdida tras escritura quedan indeterminados.
- Reintentos con backoff acotado, jitter inyectable y dead-letter al agotar intentos; la política no usa aleatoriedad implícita.
- CI incorpora pruebas de consumers, mutaciones de fronteras, benchmark de lote máximo y todos los gates previos del repositorio.

## Gates ejecutados para este cierre

`build`, `api:check`, `consumer:check`, `lint`, `typecheck`, `test` (41/41), `mutation:phase6-7`, `benchmark:phase6-7`, además de los gates completos de `npm run ci` y la auditoría de GitHub en la PR de esta fase.

Este cierre no afirma que se haya probado contra el portal AEAT real ni que el producto 1.0.0 esté publicado. Las pruebas externas, consumers, recuperación durable y expediente de release siguen siendo gates explícitos de las fases 9–11.
