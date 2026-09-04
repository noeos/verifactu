# Puertos y adaptadores

Estado: **normativo**

Puertos obligatorios según capacidad:

- `RecordStore`: transacción, cabeza de secuencia, registros, eventos y rollback detection.
- `OutboxStore`: trabajo durable, lease, intento y reconciliación.
- `Signer`: firma por handle opaco y metadatos verificables.
- `CertificateProvider`: selección y cadena pública, nunca exportación privada.
- `Clock`: instante y calidad declarados.
- `AeatTransport`: petición HTTPS/SOAP y respuesta byte a byte.
- `Observer`: eventos estructurados ya redactados.

Cada puerto declara atomicidad, idempotencia, concurrencia, límites, timeout, cancelación, errores y obligaciones de cierre. Un adapter con excepción o respuesta malformada se aísla y clasifica.

## Semántica mínima

| Puerto                | Operaciones contractuales                                                           | Garantía que el kit exige                                         |
| --------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `RecordStore`         | `readHead`, `commit(expectedHead, bundle)`, `scan`, `checkpoint`, `verifyFreshness` | serializable por secuencia, CAS, unicidad, bytes inmutables       |
| `OutboxStore`         | `enqueue` dentro del commit, `lease`, `complete`, `release`, `inspect`              | lease con fencing token, reanudación y entrega al menos una vez   |
| `Signer`              | `describe`, `sign(nodeBytes, profile, signal)`                                      | clave no exportable, resultado ligado a profile/certificado       |
| `CertificateProvider` | `select`, `chain`, `statusAt`                                                       | identidad/titular explícitos y estado trivalente                  |
| `Clock`               | `now`, `monotonicNow`, `quality`                                                    | zona explícita, monotonicidad para durations, instante inyectable |
| `AeatTransport`       | `send(request, endpointId, signal)`                                                 | una observación de red, sin retry, bytes/metadata acotados        |
| `Observer`            | `emit(redactedEvent)`                                                               | no puede alterar resultado ni recibir secretos                    |

`commit` recibe un bundle indivisible con registro/evento, cabeza nueva, evidencia y outbox. La implementación del puerto declara si puede coordinarse con la transacción de factura del host; si no puede, el kit marca esa arquitectura como insuficiente para afirmar simultaneidad end-to-end.

Los leases usan token de fencing creciente; un worker vencido no puede confirmar. `AeatTransport` devuelve si se escribieron cero, algunos o todos los bytes cuando el runtime lo permite, pero cualquiera de los dos últimos casos sin respuesta permanece indeterminado.

El paquete publica un kit de conformidad que cualquier implementación debe superar. La aprobación de un adaptador se vincula a nombre, versión, plataforma y digest del informe; no se hereda entre versiones. Se incluyen adaptadores de memoria solo para tests/ejemplos y quedan rotulados como no aptos para custodia productiva.
