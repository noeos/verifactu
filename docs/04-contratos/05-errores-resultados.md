# Errores y resultados

Estado: **normativo de diseño**

Resultados de validación: `valid`, `invalid`, `indeterminate`, `aborted`. Operaciones mutables usan éxito o fallo con diagnósticos y estado durable conocido.

## Principios

- `invalid`: evidencia suficiente de incumplimiento del contrato evaluado.
- `indeterminate`: evidencia insuficiente, fuente desconocida, respuesta no clasificable o dependencia no verificable.
- `aborted`: cancelación observada en un límite seguro; no implica rollback salvo evidencia.
- error interno: fallo no previsto, saneado y con exit code propio.

Los códigos AEAT se conservan literalmente en un campo acotado y se mapean a categorías internas versionadas sin cambiar su significado. Un código nuevo no cae en una categoría favorable.

Orden de diagnósticos, severidad y exit codes será determinista. La truncación por límite emite su propio diagnóstico y no oculta que existen más fallos.
