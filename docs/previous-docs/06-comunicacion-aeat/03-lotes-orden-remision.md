# Lotes, orden y remisión

Estado: **normativo**

Un mensaje `RegFactuSistemaFacturacion` contiene una `Cabecera` y de 1 a 1.000 elementos `RegistroFactura`. Cada elemento elige exactamente un `RegistroAlta` o `RegistroAnulacion`; pueden mezclarse en el mismo lote y mantienen su orden. El XSD común sirve tanto a remisión voluntaria como a respuesta a requerimiento, pero se usan cabeceras, endpoints y reglas de negocio propios.

## Control de flujo

El tiempo inicial entre envíos VERI*FACTU es 60 segundos. Toda respuesta válida contiene `TiempoEsperaEnvio`; el siguiente envío del mismo obligado/remitente espera el valor devuelto o hasta acumular 1.000 registros, lo que ocurra antes, conforme a la especificación. El valor AEAT es autoridad dinámica: no se fija permanentemente a 60, no se ignora y se persiste con la respuesta.

No se usa la concurrencia para eludir el control mediante varias conexiones, procesos o credenciales. Un scheduler justo puede intercalar obligados independientes sin reordenar la cadena de ninguno.

## Invariantes

- Solo registros persistidos y asegurados entran en un lote.
- Se conserva orden de secuencia y relación con huella anterior.
- Un registro pertenece a una única identidad idempotente de remisión activa.
- Particionar un lote no modifica los bytes de sus registros.
- El lote conserva digest, cabecera, edición, endpoint lógico y lista exacta de miembros.
- Backpressure impide cargar colas completas en memoria.
- Resultado parcial se aplica por registro y no como éxito global.

Ante más de 1.000 pendientes, la partición es estable y reanudable. Una respuesta parcial confirma solo las líneas aceptadas o aceptadas con errores; las rechazadas conservan identidad, diagnóstico y vínculo al intento. No se reconstruye ni vuelve a encadenar un registro para reintentarlo.
