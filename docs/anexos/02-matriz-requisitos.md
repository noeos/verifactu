# Matriz maestra de requisitos

Estado: **normativo**

Esta matriz es el índice de obligaciones atómicas de producto. Los detalles de campo se generan desde los contratos fijados y cada regla del catálogo AEAT 1.2.2 recibe sub-ID estable durante la importación (`VAL-AEAT-<codigo>-<revision>`), sin duplicar aquí cientos de filas mecánicas.

## Aplicabilidad y gobierno legal

| ID      | Requisito verificable                                                                               | Fuente                                 | Evidencia de cierre                   |
| ------- | --------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------- |
| LEG-001 | Resolver sujeto: IS, IRPF con actividad, IRNR con EP o atribución de rentas.                        | SRC-RRSIF art. 3                       | tabla de decisión completa            |
| LEG-002 | Excluir SII del art. 62.6 RIVA sin inferirlo por ausencia de datos.                                 | SRC-RRSIF art. 3.3                     | casos positivo/negativo/indeterminado |
| LEG-003 | Resolver territorio común y no afirmar compatibilidad foral.                                        | SRC-RRSIF art. 1                       | casos territorio y diagnóstico        |
| LEG-004 | Aplicar exclusiones objetivas y resoluciones/autorizaciones individualizadas.                       | SRC-RRSIF arts. 4-5; SRC-ORDEN art. 12 | tabla y campos de resolución          |
| LEG-005 | Tratar IVA, IGIC, IPSI y otros conforme a los catálogos sin asumir equivalencia fiscal.             | SRC-RRSIF art. 1; SRC-AEAT-CONTRACTS   | reglas por impuesto                   |
| LEG-006 | Mantener las fechas 2027 y regla específica de productores sin presentarlas como alcance funcional. | SRC-RRSIF DF 4.ª                       | prueba de metadatos regulatorios      |
| LEG-007 | Separar RRSIF de factura electrónica B2B, SII, TicketBAI/Batuz, FACe y PDF.                         | SRC-RRSIF; SRC-B2B-RD238               | tests de frontera/API ausente         |
| LEG-008 | Conservar fuente, edición, fecha de consulta y digest de artefactos ejecutables.                    | gobierno                               | manifest validado                     |
| LEG-009 | Bloquear afirmaciones afectadas por drift o contradicción no resuelta.                              | autoridad documental                   | prueba regulatory-watch               |
| LEG-010 | Cumplir atribución/reutilización sin relicenciar textos de terceros.                                | SRC-AEAT-REUSE/SRC-AEAT-MANUALS        | auditoría NOTICE/SBOM                 |

## Registros y cadena

| ID      | Requisito verificable                                                                         | Fuente                                    | Evidencia de cierre              |
| ------- | --------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------- |
| REG-001 | Crear alta automática simultánea o inmediatamente anterior a expedir la factura.              | SRC-RRSIF art. 9                          | integración transaccional        |
| REG-002 | Emitir XML UTF-8, `IDVersion=1.0`, orden, tipos y cardinalidades exactos.                     | SRC-ORDEN arts. 10-11; SRC-AEAT-CONTRACTS | XSD + golden bytes               |
| REG-003 | Identificar una factura por NIF emisor, serie+número y fecha de expedición.                   | SRC-AEAT-SERVICE                          | contract/property tests          |
| REG-004 | Expresar en euros todos los importes del registro, conservando trazabilidad de conversión.    | SRC-RRSIF art. 10.2                       | vectores multidivisa             |
| REG-005 | Validar cada condicional y catálogo de alta según AEAT 1.2.2.                                 | SRC-AEAT-VALID                            | tests generados por regla        |
| REG-006 | Crear anulación como registro nuevo sin mutar o borrar el alta.                               | SRC-RRSIF art. 11                         | secuencia y recovery test        |
| REG-007 | Restringir `SinRegistroPrevio`, `RechazoPrevio` y subsanación a su casuística.                | SRC-AEAT-SERVICE/VALID                    | tabla operativa completa         |
| REG-008 | Encadenar altas y anulaciones por obligado en orden cronológico de generación.                | SRC-ORDEN art. 7                          | concurrencia/fork tests          |
| REG-009 | Representar génesis con `PrimerRegistro=S`; posteriores incluyen identidad y huella previas.  | SRC-ORDEN art. 7; XSD                     | vectores génesis/sucesor         |
| REG-010 | Calcular `TipoHuella=01` y SHA-256 sobre la preimagen oficial exacta.                         | SRC-ORDEN art. 13; SRC-AEAT-HASH          | vectores AEAT + referencia       |
| REG-011 | Emitir la huella como 64 hexadecimales mayúsculos.                                            | SRC-AEAT-HASH                             | property/negative tests          |
| REG-012 | Detectar duplicado, fork, rollback, salto y cronología regresiva sin reparar silenciosamente. | SRC-ORDEN arts. 6-7                       | fault-injection                  |
| REG-013 | Separar materialmente huella RRSIF de digests de Verification Engine.                         | D-005                                     | tipos opacos + compile negatives |

## Modalidades, eventos y conservación

| ID      | Requisito verificable                                                                                       | Fuente                             | Evidencia de cierre       |
| ------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------- |
| MOD-001 | Mantener modalidad por obligado y no mezclar estados en una misma cadena operativa.                         | SRC-ORDEN arts. 2, 17              | state-machine tests       |
| MOD-002 | Permitir iniciar VERI*FACTU en cualquier momento y mantenerlo hasta el 31 de diciembre del año.             | SRC-ORDEN art. 17                  | reloj/calendario tests    |
| MOD-003 | Comunicar renuncia con `FechaFinVeriFactu` y hacerla efectiva conforme a la regla anual.                    | SRC-ORDEN art. 17; XSD             | transición end-to-end     |
| EVT-001 | En NO VERI*FACTU registrar inicio, fin, verificaciones, anomalías, restauraciones, exportaciones y resumen. | SRC-ORDEN art. 9                   | un test por tipo AEAT     |
| EVT-002 | Generar resumen por cada seis horas operativas, incluso vacío, y antes de apagado.                          | SRC-ORDEN art. 9.2                 | reloj falso + crash tests |
| EVT-003 | Encadenar, hashear, firmar y conservar eventos como flujo independiente.                                    | SRC-ORDEN arts. 9, 13-14           | vectores y recovery       |
| EVT-004 | Usar estructura y códigos exactos de `EventosSIF.xsd`.                                                      | SRC-AEAT-CONTRACTS                 | XSD + catálogo generado   |
| STO-001 | Persistir append-only registro, bytes, huella, vínculo, estado y outbox en una frontera atómica.            | SRC-RRSIF art. 8                   | crash matrix              |
| STO-002 | Permitir acceso, consulta y exportación fiel, segura, legible y estructuralmente válida.                    | SRC-RRSIF art. 8; SRC-ORDEN art. 8 | round-trip/export tests   |
| STO-003 | Conservar registros durante el plazo tributario aplicable sin imponer un plazo universal erróneo.           | SRC-RRSIF art. 8                   | policy tests              |
| STO-004 | Disociar acceso tributario de información confidencial no patrimonial.                                      | SRC-RRSIF art. 8.4                 | authorization tests       |

## Firma, QR e interoperabilidad AEAT

| ID      | Requisito verificable                                                                               | Fuente                              | Evidencia de cierre              |
| ------- | --------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------- |
| SIG-001 | Firmar altas, anulaciones y eventos NO VERI*FACTU; aplicar exactamente la excepción VERI*FACTU.     | SRC-ORDEN arts. 3, 14               | matriz modalidades               |
| SIG-002 | Generar XAdES Enveloped EPES sobre el nodo de registro, no sobre contenedores.                      | SRC-AEAT-SIGN                       | vectores AEAT/interoperabilidad  |
| SIG-003 | Usar política AGE, RSA/SHA-256 y clave Noeos ≥2048 bits.                                            | SRC-AEAT-SIGN                       | lint criptográfico               |
| SIG-004 | Validar certificado cualificado, titular/representación y vigencia con resultado trivalente.        | SRC-ORDEN art. 14; SRC-AEAT-SIGN    | fixtures certificado/OCSP        |
| SIG-005 | Rechazar wrapping, referencias externas/duplicadas, algoritmos o transforms no permitidos.          | threat model/SRC-AEAT-SIGN          | suite adversarial                |
| QR-001  | Construir URL con `nif`, `numserie`, `fecha`, `importe` y endpoint exacto por modalidad/entorno.    | SRC-AEAT-QR                         | golden URLs                      |
| QR-002  | Percent-encodear valores, limitar `numserie` a ASCII 32-126/60 y no añadir tracking ni `formato`.   | SRC-AEAT-QR                         | reserved-character tests         |
| QR-003  | Renderizar ISO 18004 nivel M, 30-40 mm, zona quieta ≥2 mm y texto obligatorio.                      | SRC-ORDEN art. 21; SRC-AEAT-QR      | medición + decoder independiente |
| QR-004  | Incluir leyenda VERI*FACTU solo en esa modalidad y URL independiente en factura electrónica.        | SRC-ORDEN art. 20                   | layout/contract tests            |
| NET-001 | Emitir SOAP 1.1 document/literal UTF-8 por HTTPS/mTLS a endpoint allowlisted.                       | SRC-AEAT-SERVICE/WSDL               | mock-wire + sandbox              |
| NET-002 | Admitir 1-1.000 altas/anulaciones mezcladas sin reordenarlas.                                       | SRC-AEAT-CONTRACTS/SERVICE          | límites 0/1/1000/1001            |
| NET-003 | Respetar `TiempoEsperaEnvio`, inicialmente 60 s, y persistir cada actualización.                    | SRC-ORDEN art. 16; SRC-AEAT-SERVICE | scheduler tests                  |
| NET-004 | Interpretar respuesta global y cada línea de forma independiente.                                   | SRC-AEAT-CONTRACTS                  | mixed-response tests             |
| NET-005 | Conservar CSV cuando exista, presentación, duplicado, error y respuesta bruta.                      | SRC-AEAT-CONTRACTS                  | round-trip evidence              |
| NET-006 | Distinguir SOAP Fault, error de transporte, rechazo funcional e indeterminado tras posible entrega. | SRC-AEAT-SERVICE                    | fault-injection                  |
| NET-007 | Reintentar solo errores clasificados, con idempotencia, backoff acotado y reconciliación.           | diseño operativo                    | duplicate/timeout tests          |
| NET-008 | Soportar remisión por requerimiento NO VERI*FACTU con cabecera/endpoint propios.                    | SRC-ORDEN art. 18; SRC-AEAT-SERVICE | sandbox + fixtures               |
| NET-009 | Ofrecer consulta de presentados únicamente para VERI*FACTU.                                         | SRC-AEAT-SERVICE                    | capability tests                 |

## Producto, seguridad, calidad y entrega

| ID      | Requisito verificable                                                                                       | Fuente                               | Evidencia de cierre     |
| ------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------- |
| CON-001 | Exponer biblioteca ESM TypeScript y CLI con resultados estructurados equivalentes.                          | D-003                                | API/CLI contract tests  |
| CON-002 | No realizar red, reloj, aleatoriedad o filesystem implícitos desde el núcleo.                               | arquitectura                         | deterministic tests     |
| CON-003 | Integrar `@noeos/verification-engine` solo por API pública y perfil versionado.                             | D-004                                | tarball consumer        |
| CON-004 | Mantener compatibilidad SemVer de tipos, JSON, CLI, errores y evidencia.                                    | contrato de versiones                | compatibility fixtures  |
| SEC-001 | Rechazar DTD, entidades externas, expansión, profundidad, tamaño y referencias XML peligrosas.              | threat model                         | fuzz/security tests     |
| SEC-002 | No exponer claves privadas, credenciales o datos fiscales en logs/errores.                                  | privacy/key policy                   | e2e redaction tests     |
| SEC-003 | Verificar TLS/hostname, limitar redirects y separar producción/pruebas.                                     | transport policy                     | integration negatives   |
| SEC-004 | Fijar Actions por SHA, permisos mínimos, provenance, SBOM y escaneo de secretos/dependencias.               | supply-chain policy                  | auditoría automática    |
| PER-001 | Superar P-01..P-12 en hardware/perfil fijado sin relajar validación.                                        | presupuestos                         | benchmark firmado       |
| QUA-001 | Trazar cada requisito a código, test y evidencia; cero huérfanos regulatorios.                              | quality policy                       | checker de trazabilidad |
| QUA-002 | Alcanzar cobertura 98/95 y 100 % de mutantes críticos.                                                      | quality policy                       | reportes CI             |
| QUA-003 | Validar contratos oficiales, referencia independiente, fuzz, properties, fallos y tarball instalado.        | quality policy                       | required checks         |
| OPS-001 | Publicar únicamente release completa `1.0.0` desde tag firmado, OIDC, provenance y artifacts reproducibles. | release policy                       | expediente release      |
| OPS-002 | Incluir declaración responsable individualizada por versión y conservar todas las versiones.                | SRC-RRSIF art. 13; SRC-ORDEN art. 15 | artifact + auditoría    |
| OPS-003 | No usar “certificado”, “homologado” o “conforme” sin alcance y evidencia demostrables.                      | legal/product policy                 | release copy audit      |

## Regla de exhaustividad

La matriz no resume ni sustituye los XSD o el catálogo de validaciones. La importación genera un inventario de cada nodo, enum y regla; CI exige que todo elemento esté clasificado como `implemented`, `not-applicable` con fundamento o `blocked`. No existe categoría `later`, y un `blocked` impide el release afectado.
