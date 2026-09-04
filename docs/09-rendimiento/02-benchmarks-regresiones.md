# Benchmarks y regresiones

Estado: **normativo**

Cada escenario tendrá generador sintético determinista, seed, digest, warm-up, al menos 10 muestras y entorno completo. Latencias usan al menos 10.000 operaciones cuando sea viable. Se registran p50/p95/p99/máximo, mediana de throughput, intervalo bootstrap 95 %, RSS/heap/external y GC.

El orden de escenarios se aleatoriza de forma reproducible. No se descartan outliers salvo regla previa; una máquina inestable invalida la corrida. Correctness se ejecuta antes y después.

## Regresión

- >5 % con señal estadística: warning y análisis obligatorio.
- >10 %: bloqueo.
- >5 % de memoria: análisis; >10 %: bloqueo.
- Incumplir gate absoluto bloquea release estable.
- Cambiar bytes o resultado para mejorar cifras es defecto.

PR ejecuta smoke; `main` y release ejecutan suite oficial en runner dedicado. Windows/macOS/arm64 detectan anomalías sin comparar cifras entre hardware.
