# Flujos y fronteras de confianza

Estado: **normativo**

## Expedición

`host no confiable → validación → reglas RRSIF → bytes/huella → firma si aplica → persistencia atómica → QR/confirmación`

## Remisión

`outbox durable → verificación de digest → lote/XML → transporte autenticado → persistencia de respuesta → clasificación → transición/retry`

## Verificación

`bytes/evidencia potencialmente hostiles → límites → parser seguro → esquema → reglas → criptografía → resultado estructurado`

Fronteras: consumidor, adapter de almacenamiento, proveedor de clave, sistema operativo, red, AEAT, fuente oficial, CI y paquete publicado. Cada una se considera comprometible y tiene validación en ambos sentidos.

Los bytes de entrada no se consideran confiables por haber sido producidos anteriormente por Noeos. Restauración, importación y respuesta oficial atraviesan la misma validación estricta.
