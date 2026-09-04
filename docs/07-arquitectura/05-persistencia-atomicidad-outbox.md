# Persistencia, atomicidad y outbox

Estado: **normativo**

`verifactu` define semántica, no una base de datos compartida. `RecordStore` debe proporcionar transacciones serializables por secuencia, compare-and-set de cabeza, unicidad de identidad e idempotencia, almacenamiento byte a byte y detección de rollback.

La confirmación atómica contiene registro, nueva cabeza, evidencia, evento requerido y trabajo outbox. Si una parte falla, ninguna se publica como confirmada.

El host que coordina factura y registro debe integrar su transacción o protocolo de emisión con este commit. No se acepta compensar borrando una factura/registros ya expuestos.

Outbox separa commit local de red. Cada item conserva request digest, miembros, estado, intentos, lease y resultado. Purga y archivo solo ocurren bajo política de conservación verificada.

El kit de conformidad simula carreras, crash en cada frontera, duplicados, pérdida de conexión, disco lleno, restauración antigua y corrupción.
