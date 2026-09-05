# Kit de conformance de adapters

Estado: **cerrado — 2026-09-05**

`@noeos/verifactu-adapter-kit` ejecuta escenarios deterministas sobre un `RecordStore` y un
`OutboxStore`: commit de registro y rechazo de duplicado, aislamiento de bytes y fencing de lease
obsoleto antes de completar trabajo. Cada escenario se marca `passed`, `failed` o
`not-applicable`; un adapter entregado con todos los puertos requeridos debe obtener `passed`.

El kit no conoce SQL, filesystem, red ni secretos y no impone una implementación. El workspace lo
ejecuta en `adapter:check` con los adapters de memoria para detectar regresiones del contrato.
