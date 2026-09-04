# Vectores de conformidad

Estado: **normativo de diseño**

El manifiesto versionado enumerará cada vector con ID, requisito, fuente, categoría, archivo, SHA-256, SHA-512, licencia y resultado esperado.

Categorías mínimas: serialización, alta, anulación, evento, huella, enlace, firma, QR, XML, lote, respuesta, error y casos inválidos.

Los vectores oficiales se preservan sin alteración. Los derivados identifican transformación y no se presentan como oficiales. Casos negativos cambian una sola propiedad para demostrar qué regla detecta el fallo.

Una implementación de referencia independiente reproducirá huella, contenido QR y verificaciones deterministas sin importar código de producción. CI compara referencia, biblioteca, CLI y bytes publicados. Un vector que no pueda reproducirse bloquea la edición.
