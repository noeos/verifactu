# Colas, indisponibilidad y recuperación

Estado: **normativo de diseño**

La outbox se confirma en la misma unidad durable que el registro. Un worker reclama trabajo mediante lease acotado, renueva de forma segura y permite recuperación tras caída.

La indisponibilidad AEAT no impide conservar correctamente un registro ya emitido cuando la modalidad permita su remisión posterior, pero queda visible como pendiente y se procesa con prioridad y orden.

## Recuperación

- detectar leases abandonados;
- verificar digest antes de reenviar;
- reanudar desde estado durable, no memoria;
- separar poison messages sin perder secuencia;
- aplicar circuit breaker sin descartar trabajo;
- proporcionar exportación y diagnóstico operativo;
- reconciliar respuestas recibidas durante un crash.

Saturación, cuota de almacenamiento o corrupción son fallos explícitos. No se acepta seguir expidiendo indefinidamente sin capacidad durable.
