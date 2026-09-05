# Implementación de la fase 8: API, CLI y adapters

Estado: **implementada técnicamente — 2026-09-05**

La fase 8 entrega la frontera pública que consume una aplicación host. La biblioteca sigue siendo
determinista y no realiza I/O implícito: el host proporciona reloj, persistencia, transporte, firma
y certificados mediante puertos. La CLI es la única superficie que accede a stdin, stdout y
ficheros, con límites y escritura atómica.

## Componentes

- `packages/verifactu/src/api/` contiene `createVerifactu`, tipos públicos inmutables y el flujo de
  preparación, commit, verificación, QR, remisión, cola, reconciliación y exportación.
- `packages/cli/` contiene el ejecutable `verifactu`, parser estricto de JSON/NDJSON, límites de
  entrada y salida humana, JSON o NDJSON.
- `packages/adapter-kit/` contiene el contrato de conformance para `RecordStore` y `OutboxStore`.
  Sus escenarios son ejecutables contra cualquier adapter y fallan cerradamente.
- `packages/verifactu/src/vectors.ts` expone metadatos inmutables de los vectores versionados.

Las importaciones entre capas permanecen unidireccionales. La integración con
`verification-engine` se realiza exclusivamente mediante su fachada pública versionada; no se
accede a módulos internos ni se duplica su lógica criptográfica.

## Seguridad y rendimiento

Se congelan configuraciones y resultados, se copian los `Uint8Array`, se propagan cancelaciones y
se rechazan capacidades ausentes. Los bytes se procesan en streaming en exportación y NDJSON; los
límites de registros, lotes y documentos son los definidos por los contratos de las fases previas.
La CLI no sigue enlaces simbólicos al escribir y usa temporal más `rename` para salidas atómicas.
Una verificación sin datos suficientes devuelve `indeterminate`, nunca `valid`.

## Evidencia de cierre

Los gates reproducibles son `build`, `api:check`, `lint`, `typecheck`, `test`, `adapter:check`,
`consumer:check`, `pack:check`, formato, licencias, SBOM y el pipeline completo `npm run ci`.
La publicación npm y las pruebas contra el portal AEAT real no se declaran en esta fase: son gates
de las fases 9–11.
