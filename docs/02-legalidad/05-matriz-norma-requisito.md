# Matriz norma–requisito

Estado: **normativo**

La matriz canónica de producto está en [`../anexos/02-matriz-requisitos.md`](../anexos/02-matriz-requisitos.md). Su granularidad manual termina donde empiezan inventarios generados y verificables: cada elemento XSD y cada regla/código AEAT obtiene un sub-ID estable durante la importación, manteniendo referencia exacta a archivo, digest y ubicación.

## Correspondencia por autoridad

| Bloque de fuente                 | Requisitos maestros                                         |
| -------------------------------- | ----------------------------------------------------------- |
| LGT 29.2.j y RRSIF 1-8           | `LEG-*`, `STO-*`, `SEC-*`                                   |
| RRSIF 9-12                       | `REG-001..013`, `SIG-001`                                   |
| RRSIF 13-17                      | `OPS-002`, `MOD-*`, `NET-*`, `QR-*`                         |
| Orden 2-9                        | `MOD-001`, `REG-008..012`, `EVT-*`, `STO-*`                 |
| Orden 10-14                      | `REG-002..011`, `SIG-*`                                     |
| Orden 15-21                      | `OPS-002`, `MOD-002..003`, `NET-*`, `QR-*`                  |
| Anexo/XSD/WSDL                   | sub-IDs de campo, enum, cardinalidad, operación y respuesta |
| Validaciones 1.2.2               | `VAL-AEAT-<codigo>-1.2.2` enlazados a `REG-005`/`NET-004`   |
| Especificaciones huella/firma/QR | `REG-010..011`, `SIG-*`, `QR-*`                             |

## Cobertura mínima

- alcance subjetivo, objetivo y territorial;
- simultaneidad de factura y registro;
- alta y anulación;
- encadenamiento, huella y firma;
- eventos y conservación;
- accesibilidad, legibilidad y exportación;
- QR y leyenda;
- capacidad de remisión y modalidad VERI*FACTU;
- declaración responsable;
- colaboración, representación y certificados;
- plazos, transición y renuncia/cambio de modalidad;
- errores, subsanación y respuesta oficial.

La cobertura se mide sobre el inventario de fragmentos y contratos de la edición. No se permite marcar una norma completa como cubierta mediante una sola fila genérica. Los estados válidos del inventario son `implemented`, `not-applicable` con fundamento o `blocked`; solo los dos primeros pueden aparecer en una release y `not-applicable` se reevalúa ante drift.
