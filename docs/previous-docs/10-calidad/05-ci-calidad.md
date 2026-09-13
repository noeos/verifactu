# CI y calidad

Estado: **normativo**

Checks obligatorios de PR:

- políticas, DCO, documentación, links, IDs y trazabilidad;
- toolchain, formato, lint y TypeScript estricto;
- generación y sincronía de contratos;
- unit, contract, integration, e2e y property;
- consumidores ESM, CommonJS, TypeScript y CLI;
- reproducibilidad y package allowlist;
- dependency review, CodeQL, secret scan, OSV, audit y licencias;
- conformidad de fuentes, esquemas, vectores y referencia.

## Workflows y contextos

- `ci.yml`: `Required · quality and policy`, matriz de runtimes y `Required · package reproducibility`.
- `conformance.yml`: `Required · regulatory sources and traceability` y `Required · RRSIF conformance`.
- `security.yml`: dependency review, CodeQL, secret scan, OSV y npm audit/license inventory.
- `performance.yml`: smoke informativo y presupuesto oficial gobernado.
- `scorecard.yml`: OpenSSF Scorecard con SARIF.
- `release-candidate.yml`, `release.yml` y `release-verification.yml`: evidencia, publicación protegida y verificación externa al job emisor.

Cada workflow fija `concurrency`, `timeout-minutes`, permisos mínimos, Actions por SHA y shell explícito. Los PR de forks no reciben secretos ni tokens con escritura.

Matriz: Node 22 mínimo/último y Node 24 primario en Ubuntu; Node 24 en Windows y macOS. Node current es informativo.

Coverage mínimo: líneas y funciones 98 %, ramas 95 %, medido por paquete. Tests flaky bloquean; no se reintentan hasta verde sin conservar el primer fallo. Jobs cancelados o no ejecutados no cuentan como éxito.
