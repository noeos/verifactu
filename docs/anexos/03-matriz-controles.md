# Matriz maestra de controles

Estado: **normativo**

| Control | Amenaza                     | Mecanismo / fallo seguro                                                   | Propietario       | Frecuencia y evidencia        | Residual                                   |
| ------- | --------------------------- | -------------------------------------------------------------------------- | ----------------- | ----------------------------- | ------------------------------------------ |
| CTL-001 | entrada ambigua             | parser estricto, esquema y reglas; rechazar                                | dominio           | cada PR: negativos/property   | reglas oficiales erróneas                  |
| CTL-002 | alteración                  | huella, firma y evidencia separadas; invalidar                             | criptografía      | cada PR: vectores/mutación    | host comprometido antes del commit         |
| CTL-003 | omisión/fork                | CAS de head + transacción + outbox; abortar conflicto                      | estado            | cada PR: carreras/crash       | storage malicioso coordinado               |
| CTL-004 | rollback                    | checkpoint/freshness externo y verificación completa                       | integración       | release + recovery drill      | pérdida simultánea de todas las anclas     |
| CTL-005 | replay/duplicado            | identidad durable, intento idempotente y bytes inmutables                  | remisión          | cada PR: retries/duplicados   | ambigüedad remota hasta reconciliar        |
| CTL-006 | XXE/expansión               | DTD/entidades/red desactivados y límites; rechazar                         | XML               | cada PR + fuzz continuo       | vulnerabilidad de parser                   |
| CTL-007 | signature wrapping          | IDs únicos, referencia local exacta y nodo esperado; invalidar             | firma             | cada PR: corpus adversarial   | fallo de librería                          |
| CTL-008 | endpoint falso              | entorno tipado, allowlist, TLS/hostname; no conectar                       | transporte        | cada PR: adapter negatives    | CA/host comprometidos                      |
| CTL-009 | SSRF/redirect               | sin URL de entrada, redirects off y DNS/IP policy del host                 | transporte        | cada PR                       | proxy externo mal configurado              |
| CTL-010 | robo de clave               | handle opaco, mínimo privilegio, zeroization best-effort, HSM-ready        | signer/host       | release: conformance signer   | compromiso del proceso/host                |
| CTL-011 | certificado inválido        | cadena, vigencia, revocación y titular; `indeterminate` si falta evidencia | certificados      | cada release + fixtures       | indisponibilidad de revocación             |
| CTL-012 | fuga de datos               | redacción estructural, telemetría off, fixtures sintéticos; fallar cerrado | observabilidad    | cada PR: log-capture          | logs del host fuera de alcance             |
| CTL-013 | agotamiento                 | límites de bytes/nodos/profundidad/tiempo y backpressure                   | plataforma        | cada PR + benchmark/fuzz      | DoS al host compartido                     |
| CTL-014 | dependencia comprometida    | lock exacto, review, Scorecard/OSV/CodeQL y allowlist                      | maintainers       | cada PR/diario                | zero-day                                   |
| CTL-015 | Action comprometida         | Actions por SHA, permisos mínimos, sin scripts de fork privilegiados       | maintainers       | auditoría cada PR             | cuenta upstream comprometida antes del pin |
| CTL-016 | fuente mutable              | snapshot, doble digest, revisión de drift; bloquear edición                | legal/regulatorio | diario y pre-release          | cambio oficial no publicado                |
| CTL-017 | build sustituido            | build limpio reproducible, SBOM y provenance                               | release           | cada RC/release               | no determinismo de toolchain externo       |
| CTL-018 | release/cuenta comprometida | tag/commit firmados, OIDC npm, environments y verify post-release          | release           | cada release                  | compromiso simultáneo GitHub/npm           |
| CTL-019 | secreto en repo             | push protection, gitleaks, revisión binarios; bloquear                     | maintainers       | cada push/diario              | secreto en historial previo no detectado   |
| CTL-020 | backup corrupto             | cifrado, digest, restauración ensayada y evento normativo                  | host/integración  | por release + calendario host | pérdida de clave de backup                 |
| CTL-021 | reloj incorrecto            | clock port, monotonicidad de cadena y diagnóstico; no autocorregir         | dominio/host      | cada PR + operación           | fuente de tiempo host manipulada           |
| CTL-022 | confusión multiobligado     | aislamiento de storage, claves, colas, cadena y UI contractual             | integración       | cada PR: tenant-isolation     | fallo del adaptador host                   |

Un riesgo residual que exceda el apetito de release se convierte en bloqueante; no se “acepta” implícitamente por figurar en esta tabla.
