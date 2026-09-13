# Property testing, fuzzing y mutación

Estado: **normativo**

Propiedades: determinismo, inmutabilidad, round-trip donde esté definido, invariancia por chunking, cambio de huella al cambiar campo comprometido, idempotencia, monotonicidad de secuencia y equivalencia batch/stream.

Fuzz targets: JSON, XML, XSD boundary, huella, QR, firma, respuestas SOAP, estados, outbox y CLI NDJSON. Corpus incluye oficiales, límites y regresiones. Seeds y tiempo se registran; crashes minimizados se convierten en fixtures.

Mutantes críticos: eliminar validación, cambiar orden/campo de huella, aceptar firma inválida, confundir modalidad, omitir commit/outbox, avanzar cabeza incorrecta, aceptar respuesta desconocida, desactivar límite o redacción.

Gate: 100 % de mutantes críticos y ≥95 % global eliminados. Un mutante equivalente exige demostración y revisión, no exclusión automática.
