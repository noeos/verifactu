# Estrategia de pruebas

Estado: **normativo**

## Niveles

- unit: validadores, tipos, catálogos y funciones puras;
- contract: API, esquemas, bytes, códigos y estados;
- integration: engine, adapters, firma, XML y almacenamiento;
- e2e: CLI, ficheros, procesos, crash y recuperación;
- compatibility: tarballs publicados y ediciones históricas;
- security: fronteras, parsers, claves, red y supply chain;
- property/fuzz/mutation: invariantes y resistencia;
- performance/stress: presupuestos y recursos;
- external: portal AEAT.

Todo requisito en alcance tiene al menos una prueba positiva y una negativa cuando sea falsable. Reglas condicionales cubren cada rama y frontera. Los tests no comparten estado, red o reloj implícitos.

Datos siempre sintéticos. Snapshots solo se usan para bytes contractuales revisados; no para ocultar cambios masivos.
