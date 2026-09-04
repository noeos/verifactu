# Concurrencia y streaming

Estado: **normativo**

Las operaciones de una secuencia son estrictamente seriales. Secuencias independientes pueden procesarse en paralelo bajo límites de CPU, memoria, firma y transporte.

Streaming mantiene como máximo registro actual, estado de parser, diagnósticos acotados y ventana explícita. `onEvidence` y escritores aplican backpressure. No se emite resumen final antes de completar fuente y sinks.

Cancelación se observa entre unidades seguras. La operación síncrona actual termina o falla; no deja medio registro. El iterador y recursos externos se cierran incluso ante abort, error de sink o parser.

Una carrera por cabeza produce conflicto reintentable desde estado durable, no bifurcación. Los locks tienen alcance y timeout; no se usan locks globales de proceso como garantía interproceso.

Límites de concurrencia son configuración validada y aparecen en evidencia de rendimiento, no cambian semántica.
