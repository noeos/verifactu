# Límites, alteraciones y negativos

Estado: **normativo**

Para cada longitud, cardinalidad, importe, fecha, lote y contador se prueban mínimo−1, mínimo, máximo y máximo+1. Strings incluyen ASCII, multibyte, combining characters, surrogate inválido, vacío y whitespace.

Cada campo comprometido se altera aisladamente y debe invalidar huella/firma/coherencia. Se prueban omisión, duplicación, reordenación, propiedad extra, tipo equivocado, catálogo desconocido, digest corto/largo, mayúsculas y encoding inválido.

Secuencias cubren génesis, hueco, repetición, fork, anterior incorrecto, rollback y mezcla de obligado/instalación/edición. Estados cubren transiciones ilegales, replay y crash en cada frontera durable.

Entradas hostiles no deben ejecutar getters, entidades, URLs, comandos ni producir asignación no acotada. Un negativo nunca se acepta por truncar diagnósticos.
