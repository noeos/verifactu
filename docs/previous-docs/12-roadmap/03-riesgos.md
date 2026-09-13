# Registro de riesgos

Estado: **normativo**

Escala: probabilidad/impacto `B`, `M`, `A`; residual objetivo tras controles.

| ID    | Riesgo                               | P/I | Propietario        | Trigger                       | Tratamiento y evidencia                                  | Residual |
| ----- | ------------------------------------ | --- | ------------------ | ----------------------------- | -------------------------------------------------------- | -------- |
| R-001 | cambio AEAT/normativo                | A/A | legal-regulatorio  | drift o nueva publicación     | edición inmutable, vigilancia diaria, impacto bloqueante | M/A      |
| R-002 | confundir factura, registro y B2B    | M/A | arquitectura       | API cruza frontera            | contratos y consumer tests                               | B/M      |
| R-003 | interpretación incorrecta            | M/A | legal-regulatorio  | fuente ambigua/contradictoria | jerarquía, ADR, caso y expediente                        | M/A      |
| R-004 | firma/XML vulnerable                 | M/A | seguridad          | vector/fuzz/advisory          | librería admitida, parser cerrado, fuzz                  | B/A      |
| R-005 | pérdida o fork por concurrencia      | M/A | estado             | CAS/crash falla               | transacción, outbox, fault injection                     | B/A      |
| R-006 | certificado comprometido             | M/A | host/signer        | exposición/revocación         | handle opaco, rotación, runbook                          | M/A      |
| R-007 | desconocido tratado como éxito       | M/A | remisión           | código/schema nuevo           | `unknown`/`indeterminate`, fail-closed                   | B/M      |
| R-008 | supply chain comprometida            | M/A | maintainers        | alerta/provenance rota        | pinning, SBOM, scans, build reproducible                 | M/A      |
| R-009 | backlog excede capacidad             | M/M | rendimiento        | SLO/gate incumplido           | budgets, streaming, backpressure, soak                   | B/M      |
| R-010 | host omite creación atómica          | M/A | integración        | consumer test falla           | puerto transaccional y kit obligatorio                   | M/A      |
| R-011 | afirmación pública excesiva          | M/A | release/legal      | copy sin evidencia            | auditoría de claims y declaración separada               | B/M      |
| R-012 | conocimiento concentrado             | M/M | maintainers        | bus factor 1                  | docs operables, referencia, drills                       | M/M      |
| R-013 | indisponibilidad prolongada AEAT     | A/M | remisión           | fallos repetidos              | cola durable, aviso, backoff/reconciliación              | B/M      |
| R-014 | fuente de tiempo manipulada          | M/A | host/dominio       | cronología regresiva          | clock port, checks y evento                              | M/M      |
| R-015 | aislamiento multiobligado defectuoso | M/A | estado/integración | cruce tenant                  | namespaces, autorización y tests                         | B/A      |

Los residuales `A` requieren aceptación explícita y motivada en el expediente de release; un riesgo legal, de integridad o de secreto con probabilidad residual mayor que baja bloquea publicación estable.
