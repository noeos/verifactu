# Respuestas y errores AEAT

Estado: **normativo**

Se preservan bytes, timestamp de recepción, metadatos seguros y versión del parser. La clasificación se realiza contra catálogos de la edición.

## Estados oficiales y mapeo interno

| Nivel | Valor oficial | Significado interno |
|---|---|---|
| envío | `Correcto` | todas las líneas `Correcto` |
| envío | `ParcialmenteCorrecto` | existe `Incorrecto` o `AceptadoConErrores` junto a línea aceptada, o existe línea aceptada con errores |
| envío | `Incorrecto` | todas las líneas `Incorrecto`; no hay CSV |
| registro | `Correcto` | confirmado sin error comunicado |
| registro | `AceptadoConErrores` | confirmado por AEAT, requiere subsanación trazada cuando corresponda |
| registro | `Incorrecto` | no aceptado; requiere corregir y nueva remisión |

Cuando al menos una línea se acepta, la respuesta incluye CSV y datos de presentación. Cada `RespuestaLinea` conserva `IDFactura`, `Operacion`, `RefExterna`, estado, código/descripcion de error y, en duplicados, el bloque `RegistroDuplicado`. `TiempoEsperaEnvio` se aplica aunque el resultado funcional no sea totalmente correcto.

Clases internas adicionales: rechazo estructural `SOAP Fault`, transporte reintentable, respuesta malformada, resultado indeterminado tras posible entrega y código oficial desconocido.

HTTP, SOAP y estado funcional se evalúan por separado. Un `200` no implica aceptación. Una conexión cortada tras enviar deja resultado indeterminado hasta reconciliación.

Cada código oficial conserva código y descripción original junto a versión de catálogo, severidad, admisibilidad, acción y política de reintento. Un código nuevo se clasifica como `unknown`, se preserva y bloquea automatismos destructivos; nunca se transforma en aceptación.
