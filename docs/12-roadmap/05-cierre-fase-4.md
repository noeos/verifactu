# Cierre de fase 4: dominio, validación, huella y evidencia

Estado: **completada técnicamente — 2026-09-04**

Esta fase implementa el núcleo puro y determinista de la edición `aeat-rrsif-1.0@2026-09-03`. No incorpora todavía XML/XSD de serialización, firma, QR, persistencia ni transporte; esas fronteras permanecen en las fases 5–7 y no se simulan en este cierre.

## Entregables verificables

- Objetos nominales inmutables para NIF, fecha/fecha-hora AEAT, decimal lexeme, texto oficial, IDs opacos y huella RRSIF.
- Aplicabilidad trivalente (`applicable`, `notApplicable`, `indeterminate`) con abortado explícito y sin inferir hechos ausentes.
- Validación cerrada de registros de alta/anulación: propiedades desconocidas, getters, proxies, ciclos, símbolos, Unicode no válido, límites y combinaciones normativas reciben diagnóstico estructurado y orden estable.
- Reglas locales AEAT 1.2.2 de identidad, fechas, rectificativas, sustitución, operación, destinatarios, macrodato, emisor y anulación; las consultas externas quedan indeterminadas, nunca aprobadas implícitamente.
- Sumas de `CuotaTotal` e `ImporteTotal` con tolerancia oficial de ±10 euros y excepciones de régimen expresas como avisos.
- Huella RRSIF SHA-256 en mayúsculas, preimagen y orden exactos para alta, anulación y evento; comparación constante y lexemas decimales preservados.
- Perfil `es.noeos.verifactu.record@1.0.0` sobre `verification-engine`, con envelope binario versionado, campos etiquetados, límites, digest de vectores y copia defensiva de bytes.
- Catálogo de contratos generado con 530 declaraciones, 6 operaciones y 1.060 restricciones/facetas, doble digest y mapa de procedencia.
- API Extractor congelado en `packages/verifactu/etc/verifactu.api.md`; ESM y CommonJS exponen la misma superficie.
- Vectores versionados, referencia independiente Python, property/fuzz (semilla fija), mutaciones críticas y benchmark reproducible.

## Gates ejecutados

`format`, `lint`, `typecheck`, `test` (32/32), vectores Node+Python (3 huellas AEAT y evidencia), catálogo de reglas (15 reglas trazadas), API Extractor, consumers, mutaciones (9/9) y benchmark (mínimo local observado 75.802 registros/s frente a 10.000).

La aceptación técnica de esta fase no es una certificación legal del SIF integrado. Cualquier cambio de fuente, reglas, bytes, huella o perfil abre una nueva revisión y conserva la evidencia histórica.
