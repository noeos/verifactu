# Evidencia de rendimiento de la fase 9

Estado: **en ejecución — 2026-09-05**

Los benchmarks son deterministas, registran semilla, commit, toolchain, warm-up, muestras,
latencias p50/p95/p99, memoria y regresión frente a baseline. Los smoke gates se ejecutan en PR y
los presupuestos oficiales en `main` y releases.

Se mantienen los presupuestos P-01 a P-12 de `09-rendimiento/01-presupuestos.md`, incluidos
streaming de 1 GiB, diez millones de registros, backpressure y cancelación ≤100 ms.
