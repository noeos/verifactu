# Eventos y observabilidad

Estado: **normativo de diseño**

Eventos mínimos: operación iniciada/completada/fallida, registro preparado/confirmado, firma solicitada, trabajo encolado, intento iniciado, respuesta clasificada, retry programado, reconciliación, drift regulatorio y diagnóstico emitido.

Cada evento contiene nombre, versión, fase, edición, modalidad, correlación opaca, duración y resultado. No incluye XML, NIF, nombre, dirección, importes, certificado completo, firma, hash de dato de baja entropía ni mensaje externo sin sanear.

El observer no forma parte de la transacción normativa. Sus fallos se aíslan y registran mediante canal seguro; no cambian bytes ni resultado, salvo que una política del host exija explícitamente observabilidad durable como precondición.

Métricas son agregadas y de cardinalidad acotada. No hay telemetría o red externa por defecto.
