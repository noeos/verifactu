---
id: ROADMAP-DOC-0020
title: P3-B pre-P4 assurance gate
status: approved
authority: normative
owner: assurance-owner
created: 2026-09-19
last-reviewed: 2026-09-19
dependencies: [ROADMAP-DOC-0013, QA-DOC-0019]
historical-inputs: [REV-056, REV-057, REV-063, REV-074, REV-079, REV-084]
---

# P3-B — compuerta de aseguramiento antes de P4

P3-B es una fase obligatoria entre el cierre de P3 y el primer commit de
implementación de P4. Su objetivo es demostrar que la base P1–P3 está lista
para construir producto con calidad verificable desde el primer día.

P3-B no concede cumplimiento fiscal, aceptación AEAT ni release. Comprueba que
las autoridades, contratos, herramientas, controles y mecanismos de evidencia
son completos y ejecutables para permitir P4 sin repetir el fallo histórico
documentado en `HIST-QUALITY-REBASELINE-001`.

## Salidas obligatorias

| Área           | Salida mínima                                                        | Criterio de aprobación                                                         |
| -------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Identidad      | SHA, árbol, padres, firma SSH y DCO                                  | Coinciden en todos los informes y PR protegido.                                |
| Documentación  | Corpus indexado, precedencia, ADR, REV y handoff                     | Cero referencias huérfanas, contradicciones sin decisión o estados ambiguos.   |
| Toolchain      | Node, npm, Python, TypeScript, validadores y digests                 | Todos los perfiles admitidos se reproducen y no hay engine mismatch.           |
| CI             | Required contexts, cierre, eventos, permisos y matriz OS/runtime     | Todos pasan en el head final; negativos fallan por su razón esperada.          |
| Fuentes        | Adquisición, licencia, digest, edición y cadena de importación       | Fuentes completas, bloqueos explícitos y regeneración byte-identical.          |
| Contratos      | Esquemas, catálogos, bindings, generadores y oráculos independientes | Cada requisito P1–P3 tiene contrato, productor, consumidor y prueba.           |
| Seguridad      | Threat model, XML, límites, red, secretos, privacidad y fuzz         | Cada control tiene prueba positiva y negativa; no hay finding crítico abierto. |
| Calidad        | Unit, contract, property, fuzz, parser, generator y seeded faults    | Denominadores exactos, umbrales definidos y cero skips/retries ocultos.        |
| Supply chain   | Lock, Actions, licencias, SBOM, provenance y reproducibilidad        | Admission, dual SBOM y dos clean builds reconciliados.                         |
| Compatibilidad | Perfiles de toolchain y sistemas declarados                          | Cada celda pasa o está explícitamente bloqueada con responsable.               |
| Evidencia      | Raw reports, schemas, digests, comando y entorno                     | Artefactos retenidos y ligados al mismo sujeto/árbol.                          |

## Regla cuantitativa

Antes de cualquier implementación P4 debe existir un `quality baseline
manifest` que declare población exacta de fuentes y tests, líneas, funciones,
ramas, ramas críticas, población mutante, estados excluidos, property/fuzz/
fault/recovery/compatibility/performance cases, umbrales globales y por
componente, catálogo crítico y exclusiones con propietario, revisor, motivo y
fecha de expiración.

Una métrica no disponible es `blocked`. Un porcentaje de otra población no
puede satisfacer el criterio. Los umbrales no se rebajan durante la ejecución;
cualquier cambio requiere decisión registrada, impacto y nueva aprobación.

## Campaña P3-B

Debe ejecutarse desde clean state: corpus y grafo de claims; árbol, imports,
IDs, toolchain, formato, lint, tipos y generación; fixtures negativos de task
graph, CI, supply chain, regulatory y documentos; regeneración byte-identical;
matriz Node/npm/Python/TypeScript en los sistemas declarados; XML/parser/resource/
secret/network/redaction/property/fuzz del alcance P1–P3; lock/licencias/Actions,
SBOM, provenance, reproducibilidad y auditoría de REV-001..084.

P3-B no ejecuta aún cobertura de código P4 inexistente. Debe dejar preparado el
instrumentador, formato de reportes, política de mutación y contrato de
umbrales para que P4 los use desde su primer commit.

## Cierre

P3-B solo puede cerrarse mediante PR protegido firmado+DCO cuando todas las
celdas aplicables pasan, los bloqueos externos tienen dueño y fecha, y ningún
bloqueo afecta la autorización de comenzar P4. El cierre actualiza handoff,
dashboard, riesgos, claim/evidence graph y changelog. La ausencia de P3-B
impide iniciar P4.
