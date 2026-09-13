# Catálogos, reglas y diagnósticos

Estado: **normativo**

Los catálogos oficiales se conservan por edición con código, etiqueta, vigencia, fuente y relaciones. No se representan como strings abiertos cuando el conjunto sea cerrado.

Las reglas tienen ID, versión, fase, entradas, resultado y requisitos. El orden será determinista: forma, aplicabilidad, campos, relaciones, cálculo, seguridad, persistencia y comunicación.

## Diagnósticos

Un diagnóstico contiene código estable, severidad, fase, `messageKey`, ruta segura, registro/posición cuando proceda, detalle estructurado no sensible, código oficial original y causa encadenada saneada.

Familias mínimas: entrada, aplicabilidad, registro, catálogo, huella, cadena, firma, certificado, QR, XML, persistencia, estado, transporte, AEAT, límites, seguridad, configuración y compatibilidad.

Los mensajes humanos pueden traducirse; códigos, significado, orden y exit code son contrato. Nunca se transforma una excepción desconocida en aceptación.
