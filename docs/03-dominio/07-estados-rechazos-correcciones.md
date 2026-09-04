# Estados, rechazos y correcciones

Estado: **normativo**

## Estados internos mínimos

`prepared`, `secured`, `persisted`, `queued`, `submitting`, `accepted`, `accepted-with-errors`, `rejected`, `retryable`, `correction-required`, `cancelled` e `indeterminate`.

Solo existen transiciones demostradas por el flujo oficial. Estado de transporte, estado AEAT y validez local son dimensiones separadas; un HTTP exitoso no implica aceptación y un timeout no implica rechazo.

## Reglas

- La identidad idempotente se asigna antes del primer efecto externo.
- Un reintento reutiliza los mismos bytes.
- Una respuesta desconocida conserva petición y respuesta y queda indeterminada.
- Rechazo y aceptación con errores mantienen códigos originales y clasificación versionada.
- Subsanación y anulación crean acciones regladas; nunca mutan evidencia aceptada.
- Una consulta o reconciliación resuelve incertidumbre antes de crear una operación incompatible.

## Transiciones autorizadas

`prepared -> secured -> persisted -> queued -> submitting` es el camino local. Desde `submitting`, una respuesta válida lleva cada línea a `accepted`, `accepted-with-errors` o `rejected`; fallo inequívocamente anterior al envío lleva a `retryable`; entrega posible sin respuesta lleva a `indeterminate`. Reconciliación puede mover `indeterminate` a un estado AEAT demostrado. `accepted-with-errors` lleva a `correction-required` sin deshacer aceptación. Anulación confirmada marca la factura lógica `cancelled`, pero conserva alta y estados históricos.

No existen transiciones de `accepted` a `prepared`, de `rejected` a `accepted` sin nuevo intento/respuesta, ni de `indeterminate` a éxito por timeout. Cada transición persiste precondición, observación, instante, intento y actor/proceso; compare-and-set evita carreras.
