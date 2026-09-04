# Presupuestos de rendimiento

Estado: **normativo**

Corrección y seguridad nunca se sacrifican por velocidad. Los objetivos son gates en un runner Linux x64 dedicado, 4 vCPU, 8 GiB, Node 24 primario, build release y árbol limpio.

| ID | Escenario | Gate de release 1.0 |
|---|---|---:|
| P-01 | validar, serializar y calcular huella de registro típico ~1 KiB | ≥10.000 registros/s |
| P-02 | latencia individual P-01 | p95 ≤1 ms; p99 ≤2 ms |
| P-03 | generar contenido QR | ≥20.000/s |
| P-04 | validar XML/XSD típico | ≥2.000/s |
| P-05 | firma con provider software de referencia | ≥500/s |
| P-06 | construir/parsear lote oficial máximo, sin red/firma externa | p95 ≤500 ms |
| P-07 | stream total 1 GiB | RSS incremental ≤256 MiB |
| P-08 | stream de 10 millones de registros ligeros | pendiente interna ≤2 registros; RSS sin pendiente positiva >1 MiB/millón |
| P-09 | CLI `version` | p95 ≤250 ms |
| P-10 | primer registro NDJSON | p95 ≤750 ms |
| P-11 | cancelación entre registros | ≤100 ms |
| P-12 | overhead de transporte, excluidos red/AEAT/provider | p95 ≤50 ms |

El registro típico del fixture mide entre 900 y 1.100 bytes y el lote máximo contiene 1.000 registros. Providers hardware/remotos publican su propia serie; no se extrapola P-05 ni se incluye latencia de red en P-12.

Complejidad: registro O(bytes), cadena/stream O(total bytes), memoria O(registro máximo + buffers acotados + política explícita). Idempotencia y validación no se omiten para superar gates.
