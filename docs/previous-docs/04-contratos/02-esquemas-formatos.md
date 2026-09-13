# Esquemas y formatos

Estado: **normativo de diseño**

## Oficiales

XSD y WSDL se conservan byte a byte. XML emitido debe satisfacer esquema y reglas adicionales de la edición; validar solo XSD no basta. Namespace, orden, ausencia/presencia, whitespace, encoding y representación decimal/fecha son contractuales.

## Noeos

JSON Schema Draft 2020-12 describirá configuración, órdenes, diagnósticos, estados, evidencia, manifiestos y resultados CLI. Objetos contractuales rechazan propiedades adicionales. NDJSON se reserva para secuencias y evidencia operacional.

Cada documento contiene identificador de esquema, edición regulatoria y versión de protocolo. JSON se decodifica como UTF-8 estricto con detección de claves duplicadas. XML se procesa sin DTD ni entidades externas.

Los esquemas generados se comparan con sus fuentes canónicas en CI; una diferencia no regenerada bloquea.
