# CLI

Estado: **normativo**

Binario: `noeos-verifactu`, paquete `@noeos/verifactu-cli`.

## Gramática pública 1.0

- `noeos-verifactu version [--json]`
- `noeos-verifactu capabilities [--json]`
- `noeos-verifactu applicability evaluate --input <file|->`
- `noeos-verifactu record alta build|verify --input <file|-> [--output <file>]`
- `noeos-verifactu record anulacion build|verify --input <file|-> [--output <file>]`
- `noeos-verifactu event build|verify --input <file|-> [--output <file>]`
- `noeos-verifactu fingerprint calculate|verify --input <file|->`
- `noeos-verifactu signature create|verify --input <file|-> --provider <descriptor>`
- `noeos-verifactu qr build|verify --input <file|-> [--output <file>]`
- `noeos-verifactu xml validate|inspect --input <file|->`
- `noeos-verifactu submission build --input <file|-> [--output <file>]`
- `noeos-verifactu submission inspect-response --input <file|->`
- `noeos-verifactu queue process|reconcile|status --store <descriptor>`
- `noeos-verifactu export --store <descriptor> --output <directory>`
- `noeos-verifactu sources verify`, `vectors verify`, `schema print <name>`

Todos los comandos aceptan `--edition`, `--format json|ndjson|human`, `--quiet` y `--timeout-ms` cuando sean semánticamente aplicables. No existen abreviaturas ambiguas. Configuración sensible se referencia mediante proveedor o descriptor; nunca se acepta clave privada, PIN o PKCS#12 en argumento, JSON o variable visible.

JSON es el default para resultados únicos y NDJSON para streams; `human` es presentación. stdout contiene exclusivamente resultado y stderr diagnóstico operativo saneado.

| Código | Significado                                     |
| -----: | ----------------------------------------------- |
|      0 | operación válida/completa                       |
|      1 | resultado inválido o rechazo funcional esperado |
|      2 | uso/configuración inválidos                     |
|      3 | resultado indeterminado                         |
|      4 | abortado/timeout                                |
|      5 | fallo I/O o transporte                          |
|      6 | contrato/edición incompatible                   |
|     70 | defecto interno                                 |

La escritura es atómica; un stream interrumpido deja manifiesto `complete:false`. No sobrescribe sin `--force`, rehúsa dispositivo/directorio/symlink inseguro y limita permisos de salida sensible.
