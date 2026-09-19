# Revisión maestra y guía de corrección de VeriFactu — fases 1 a 9

Estado: **revisión técnica terminada; remediación en curso**.

Las secciones 1–19 conservan la línea base del review de 2026-09-07. La sección 20 registra la corrección posterior; las evidencias de la base no se presentan como resultados del código modificado.

Fecha de corte: **2026-09-07**. Repositorio: `noeos/verifactu`. Base examinada: `6e939aaa99383b7f1806e49bd2b826bd5a119b4e`, rama `main`, inicialmente limpia. Dependencia contractual: `@noeos/verification-engine@1.0.1`; repositorio de referencia examinado en `7df31cfb3ccc538c0ceab468e944172ed2480c95`.

Este documento es el único entregable añadido al repositorio por esta revisión. No aplica correcciones, no cambia GitHub, no publica paquetes y no cierra las fases 10 u 11. Las pruebas exploratorias usaron datos sintéticos y adaptadores en memoria; no se enviaron registros a AEAT.

## 1. Dictamen y límites de la evidencia

**La implementación actual no acredita el cierre funcional y de aseguramiento de las fases 1 a 9.** Existen defectos reproducidos que permiten confirmar bytes ajenos al registro, presentar una comprobación de hash como verificación de cadena, aceptar registros sin respuesta individual y devolver éxitos de verificaciones que no se ejecutan. Hay funcionalidades normativas anteriores a la fase 10 que solo están representadas mediante interfaces, inventarios o caminos incompletos.

La corrección requiere reconstruir conexiones entre componentes, además de arreglar funciones individuales. El recorrido que debe quedar demostrado es:

`entrada → modelo fiscal completo → reglas y XSD → huella oficial → XML definitivo → firma cuando corresponda → evidencia interna → transacción del host y outbox → envío de los mismos bytes → respuesta individual → estado durable → verificación y exportación`.

El motor genérico no convierte un XML incorrecto en fiscalmente correcto: prueba propiedades sobre el material que recibe. VeriFactu debe demostrar que ese material corresponde al registro, modalidad, obligado, instalación, edición y secuencia correctos. La aplicación de facturación conserva la responsabilidad de su transacción de negocio; no se debe introducir una base de datos compartida ni trasladar normativa fiscal al motor.

### 1.1 Qué se examinó

- Los 116 documentos de `docs` de VeriFactu, los 57 de Verification Engine y los tres PDF fundacionales de Noeos leídos durante la toma de contexto. Los PDF explican el origen; no sustituyen contratos actuales ni evidencia de ejecución.
- Código fuente de biblioteca, CLI y adapter kit; puertos, modelos, formatos, generadores, catálogos, snapshots, vectores, pruebas, scripts, manifiestos, lockfile y configuración de compilación, lint, formato y empaquetado.
- Los ocho workflows de VeriFactu, sus jobs y dependencias, protecciones efectivas de GitHub, entornos, permisos accesibles, alertas, ejecuciones y superficies auxiliares.
- Contratos públicos del motor y sus controles, para distinguir qué reutilizar y qué corresponde resolver aquí.
- Diecinueve observaciones de reproducción sobre el TypeScript actual, compilado **en memoria** con TypeScript 5.9.3 y Node **24.19.0**. Este Node no es el primario fijado, 24.20.0: estas reproducciones son evidencia diagnóstica, no sustituyen la matriz oficial ni un benchmark homologado.

No se ha ejecutado un nuevo `npm run ci`, una auditoría criptográfica externa, una validación con certificados de producción ni la fase 10 de portal AEAT. Las cifras de las suites existentes proceden de los logs consultados. No se afirma que revisar código pueda demostrar la inexistencia de todo defecto: se establece un inventario de hallazgos y una obligación verificable de cierre, incluyendo las superficies inaccesibles.

### 1.2 Clasificación

| Marca | Significado                                                                                                                               |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| C-R   | Defecto confirmado por inspección y reproducción local.                                                                                   |
| C-I   | Defecto o carencia confirmado por el código, contrato o configuración efectiva; no se atribuye una reproducción que no se haya ejecutado. |
| V     | Verificación pendiente de evidencia, permisos o infraestructura; no equivale a conformidad ni a vulnerabilidad confirmada.                |
| P0    | Bloquea integridad, corrección fiscal o confianza en un resultado esencial. Resolver antes de considerar apto el sistema.                 |
| P1    | Funcionalidad, seguridad, recuperación o control obligatorio incompleto. Bloquea el cierre del alcance afectado.                          |
| P2    | Coherencia, mantenibilidad o evidencia operativa; sigue requiriendo tratamiento explícito.                                                |

Las prioridades son del proyecto, no puntuaciones CVSS. Los hallazgos relacionados no deben contarse como incidentes independientes: sus IDs permiten asignar correcciones y comprobar que ninguna condición se pierde.

El registro contiene **84 hallazgos: 33 P0, 50 P1 y 1 P2**. Algunas fichas agrupan defectos relacionados o una obligación de verificación pendiente; el número no representa 84 vulnerabilidades explotables ni una cuenta de errores independientes.

### 1.3 Evidencia de CI y GitHub en el corte

| Evidencia                                                                                         | Resultado observado                                                                                                                                                        | Interpretación correcta                                                                |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [CI 33949212779](https://github.com/noeos/verifactu/actions/runs/33949212779)                     | Siete jobs completados con éxito; quality job `101260691504`; 48 pruebas aprobadas en el log revisado.                                                                     | El código satisface los checks actuales; varios checks no prueban su garantía nominal. |
| [Security 33949212778](https://github.com/noeos/verifactu/actions/runs/33949212778)               | Ejecución satisfactoria.                                                                                                                                                   | Separar éxito del scanner, alcance analizado y alertas.                                |
| [Conformance 33949212858](https://github.com/noeos/verifactu/actions/runs/33949212858)            | Éxito en el HEAD examinado.                                                                                                                                                | Inventario y vectores de huella no prueban XML/XAdES/SOAP completos.                   |
| [Conformance programado 34020376699](https://github.com/noeos/verifactu/actions/runs/34020376699) | Éxito el 2026-09-06.                                                                                                                                                       | La vigilancia actual cubre las fuentes que realmente importa.                          |
| [Performance 33949212814](https://github.com/noeos/verifactu/actions/runs/33949212814)            | Éxito.                                                                                                                                                                     | No demuestra P-01..P-12; véase REV-058.                                                |
| [Scorecard 33949274311](https://github.com/noeos/verifactu/actions/runs/33949274311)              | Workflow verde; tres alertas abiertas.                                                                                                                                     | No equivale a Scorecard 10/10 ni a ausencia de alertas.                                |
| Alertas                                                                                           | Scorecard: `MaintainedID` #4, `CodeReviewID` #5, `CIIBestPracticesID` #6. Sin alertas abiertas de CodeQL observadas; Dependabot y secret scanning devuelven listas vacías. | Conservar herramientas, severidades y fechas; no ocultar señales para lograr un verde. |
| Artefactos de CI 33949212779                                                                      | `total_count: 0`.                                                                                                                                                          | No hay un paquete descargable de evidencia en ese run.                                 |
| Publicaciones VeriFactu                                                                           | Ninguna release; tres paquetes `0.0.0-development`, privados.                                                                                                              | Estado coherente con no haber ejecutado la fase 11.                                    |
| PR abiertas en la última consulta                                                                 | #1 typescript-eslint, #15 globals, #16 @types/qrcode.                                                                                                                      | Las actualizaciones siguen requiriendo revisión de admisión y evidencias.              |

### 1.4 Índice de los 84 hallazgos

| ID                  | Prioridad | Hallazgo                                                                                                 |
| ------------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| [REV-001](#rev-001) | P0        | El modelo de registro no puede expresar el contrato fiscal completo                                      |
| [REV-002](#rev-002) | P0        | Quince reglas catalogadas no constituyen la cobertura completa de validaciones AEAT                      |
| [REV-003](#rev-003) | P1        | Los desgloses y sus totales no forman parte de la preparación                                            |
| [REV-004](#rev-004) | P1        | La edición anunciada para fase 5 y sus fuentes no tienen la misma trazabilidad que la edición ejecutable |
| [REV-005](#rev-005) | P1        | Los checks de contratos no validan los esquemas que declaran usar                                        |
| [REV-006](#rev-006) | P1        | Importación offline, persistencia y vigilancia regulatoria tienen huecos                                 |
| [REV-007](#rev-007) | P0        | El XML incluye la huella anterior como huella del registro nuevo                                         |
| [REV-008](#rev-008) | P0        | No hay validación XSD efectiva y los XML emitidos no cumplen el esquema fijado                           |
| [REV-009](#rev-009) | P1        | Los límites XML se aplican después de construir el DOM y no son una política cerrada                     |
| [REV-010](#rev-010) | P0        | `canonicalizeXml` no implementa un algoritmo C14N de firma                                               |
| [REV-011](#rev-011) | P1        | El serializador XML pierde semántica en atributos y admite caracteres no válidos                         |
| [REV-012](#rev-012) | P0        | La comprobación XAdES estructural acepta una firma inexistente criptográficamente                        |
| [REV-013](#rev-013) | P1        | El backend DSS es un puente de callbacks, sin evidencia de interoperabilidad local                       |
| [REV-014](#rev-014) | P1        | Certificado «usable» se deduce de fechas y un booleano declarado                                         |
| [REV-015](#rev-015) | P0        | `commit` confía en bytes y metadatos arbitrarios del signer                                              |
| [REV-016](#rev-016) | P0        | Un artefacto fabricado o modificado puede confirmarse                                                    |
| [REV-017](#rev-017) | P0        | Aislamiento de contexto e identidad no es uniforme                                                       |
| [REV-018](#rev-018) | P0        | La preparación no vincula el registro al head confirmado ni a su cronología                              |
| [REV-019](#rev-019) | P0        | Evidencia preparada y bytes confirmados pueden referirse a materiales distintos                          |
| [REV-020](#rev-020) | P0        | `verifyRecord` no verifica correctamente su propia salida ni los bytes                                   |
| [REV-021](#rev-021) | P0        | `verifyChain` es una comparación de hashes por registro, no una verificación de cadena                   |
| [REV-022](#rev-022) | P0        | Los eventos NO VERI*FACTU no tienen su ciclo normativo implementado                                      |
| [REV-023](#rev-023) | P0        | La modalidad es una etiqueta de configuración, sin las transiciones normativas                           |
| [REV-024](#rev-024) | P1        | Reconciliación y consulta no resuelven entregas indeterminadas                                           |
| [REV-025](#rev-025) | P1        | Exportación no acredita completitud, fidelidad ni alcance de acceso                                      |
| [REV-026](#rev-026) | P1        | Observers pueden interrumpir operaciones y contradecir el resultado durable                              |
| [REV-027](#rev-027) | P1        | Validación runtime, límites y cancelación de la API son incompletos                                      |
| [REV-028](#rev-028) | P0        | La frontera atómica no conecta la factura del host con registro y outbox                                 |
| [REV-029](#rev-029) | P0        | CAS, génesis y avance de head aceptan estados incoherentes                                               |
| [REV-030](#rev-030) | P0        | Freshness no comprueba identidad, digest ni anclaje externo                                              |
| [REV-031](#rev-031) | P1        | El contador de intentos de outbox no avanza                                                              |
| [REV-032](#rev-032) | P0        | Un lease vencido de trabajo `submitting` vuelve a ser enviable sin reconciliar                           |
| [REV-033](#rev-033) | P1        | El tiempo y la validación del lease no reflejan la duración real del procesamiento                       |
| [REV-034](#rev-034) | P0        | Los reintentos dejan estados de registros que el siguiente intento no admite                             |
| [REV-035](#rev-035) | P0        | Se informa de finalización aunque fallen las escrituras de resultados                                    |
| [REV-036](#rev-036) | P1        | Idempotencia y máquina de estados necesitan invariantes de identidad completos                           |
| [REV-037](#rev-037) | P0        | El lote enviado no es el mensaje SOAP definido por el WSDL                                               |
| [REV-038](#rev-038) | P0        | La allowlist de endpoints es mutable a través de la API pública                                          |
| [REV-039](#rev-039) | P0        | El parser de respuesta no sigue la estructura ni las identidades oficiales                               |
| [REV-040](#rev-040) | P0        | La ausencia de una línea puede convertirse en aceptación del registro                                    |
| [REV-041](#rev-041) | P1        | No se respeta ni persiste `TiempoEsperaEnvio`                                                            |
| [REV-042](#rev-042) | P0        | Pérdida de respuesta tras posible entrega puede generar retry ciego                                      |
| [REV-043](#rev-043) | P1        | El adapter HTTPS tiene carreras de cancelación, ownership y límites incompletos                          |
| [REV-044](#rev-044) | P1        | La política TLS no está probada en la frontera del provider                                              |
| [REV-045](#rev-045) | P1        | QR no distingue modalidad y su representación gráfica es incorrecta                                      |
| [REV-046](#rev-046) | P1        | El contenido QR admite fechas imposibles y rechaza importes negativos                                    |
| [REV-047](#rev-047) | P1        | La gramática rechaza los comandos de construcción/verificación documentados                              |
| [REV-048](#rev-048) | P1        | Los DTO de artefactos no son serializables ni permiten round-trip                                        |
| [REV-049](#rev-049) | P0        | `vectors verify` y `sources verify` anuncian comprobaciones que no ejecutan                              |
| [REV-050](#rev-050) | P1        | Los comandos con providers y stores no tienen camino de ejecución                                        |
| [REV-051](#rev-051) | P1        | La CLI no procesa NDJSON como stream ni cancela las operaciones                                          |
| [REV-052](#rev-052) | P1        | El parser JSON convierte números inseguros y no valida Unicode escapado                                  |
| [REV-053](#rev-053) | P1        | La escritura «sin sobrescribir» tiene una carrera entre comprobación y rename                            |
| [REV-054](#rev-054) | P1        | Los writers no manejan toda la semántica de escritura y error                                            |
| [REV-055](#rev-055) | P1        | Opciones, versión, ayuda y códigos de salida no cumplen el contrato                                      |
| [REV-056](#rev-056) | P0        | La cobertura obligatoria mide únicamente el archivo de exports                                           |
| [REV-057](#rev-057) | P0        | Los scripts denominados «mutación» no ejecutan mutantes de código                                        |
| [REV-058](#rev-058) | P0        | El job de presupuestos no mide ni impone P-01..P-12                                                      |
| [REV-059](#rev-059) | P1        | El fuzzing puede tragarse defectos y cubre pocos objetivos semánticos                                    |
| [REV-060](#rev-060) | P0        | Stress y recovery no prueban streaming ni reinicio durable                                               |
| [REV-061](#rev-061) | P0        | El adapter kit aprueba sin adapters y ensaya invariantes insuficientes                                   |
| [REV-062](#rev-062) | P1        | Las pruebas existentes replican supuestos erróneos y faltan oráculos independientes                      |
| [REV-063](#rev-063) | P0        | Trazabilidad y cierres documentales no están unidos a evidencia ejecutada                                |
| [REV-064](#rev-064) | P1        | Los controles de seguridad buscan palabras en vez de demostrar las fronteras                             |
| [REV-065](#rev-065) | P1        | `pack:check` no examina el contenido de los tarballs                                                     |
| [REV-066](#rev-066) | P1        | «Clean consumers» importa archivos del workspace, no paquetes instalados                                 |
| [REV-067](#rev-067) | P1        | Reproducibilidad solo compara dos empaquetados del mismo build y omite adapter kit                       |
| [REV-068](#rev-068) | P1        | Los archivos llamados SBOM no cumplen las estructuras anunciadas                                         |
| [REV-069](#rev-069) | P1        | El control de licencias no analiza dependencias ni atribución distribuida                                |
| [REV-070](#rev-070) | P1        | El inventario de dependencias está desactualizado y las políticas no detectan el drift                   |
| [REV-071](#rev-071) | P1        | La verificación de toolchain de referencia no ejecuta Python y el wrapper npm no verifica todo           |
| [REV-072](#rev-072) | P2        | Organización de módulos, exports y build dificultan aislar garantías y costes                            |
| [REV-073](#rev-073) | P1        | DCO y gobierno no comprueban todas las condiciones que anuncian                                          |
| [REV-074](#rev-074) | P1        | Claims y documentación de cierre necesitan reconciliación con la implementación                          |
| [REV-075](#rev-075) | P1        | GitHub no exige pinning SHA aunque la política local lo declara                                          |
| [REV-076](#rev-076) | P1        | El auditor GitHub omite campos y puede declarar verificada una configuración distinta                    |
| [REV-077](#rev-077) | P1        | Las revisiones obligatorias son inoperables con la composición actual                                    |
| [REV-078](#rev-078) | P1        | Las excepciones de tags y entorno productivo deben tratarse como privilegios reales                      |
| [REV-079](#rev-079) | P1        | CI no conserva un expediente verificable y hay diferencias entre gates locales y jobs                    |
| [REV-080](#rev-080) | P1        | Scorecard verde no significa 100% de controles ni alertas cerradas                                       |
| [REV-081](#rev-081) | P1        | Parte de la organización y de las políticas heredadas no es verificable con el acceso actual             |
| [REV-082](#rev-082) | P1        | Los workflows de release son scaffolding y deben permanecer bloqueados hasta sus fases                   |
| [REV-083](#rev-083) | P1        | Conservación, retención legal y restauración no tienen contrato de conformidad ejecutable                |
| [REV-084](#rev-084) | P1        | El tipo público de edición no se puede obtener mediante el flujo público normal                          |

## 2. Hallazgos de dominio, fuentes y XML

<a id="rev-001"></a>

### REV-001 — El modelo de registro no puede expresar el contrato fiscal completo

**P0 · C-I · fases 3–5, 8.** Evidencia: `packages/verifactu/src/validation/record.ts`, tipos `ValidatedAltaRecord`, `AltaBusinessFacts`, `ALTA_KEYS`; `xml/records.ts`; `api/types.ts`. El alta representa huella y booleanos como `thirdPartyDetails` o un `recipientCount`, pero no los destinatarios, desgloses ni todos los datos de sistema, emisor y operación que exige el XSD. Se pueden afirmar hechos sin aportar el contenido que los acredita; las claves exactas impiden aportar numerosos campos necesarios.

**Corrección:** definir DTO de entrada completo y modelo validado por edición para alta, anulación y evento. Representar los bloques condicionales como uniones discriminadas con datos reales; derivar presencia y recuentos, no aceptarlos como sustitutos. Mantener identificadores fiscales separados de IDs opacos. Generar tipos estructurales desde el catálogo y escribir las reglas semánticas explícitamente.

**Cierre:** casos positivos y negativos para cada elemento, elección, cardinalidad y condición del XSD; un alta realista debe atravesar la API sin perder ningún campo. **Riesgo:** cambio amplio de API/DTO y fixtures; versionar el contrato de desarrollo y conservar lectores de artefactos previos cuando existan consumidores. Depende de REV-002, 008 y 063.

<a id="rev-002"></a>

### REV-002 — Quince reglas catalogadas no constituyen la cobertura completa de validaciones AEAT

**P0 · C-I · fases 3–4.** Evidencia: `regulatory/rules/aeat-1.2.2.json`, `scripts/check-rule-catalog.mjs`, `validation/record.ts`. El checker exige al menos 15 IDs y existencia de ficheros de tests; no demuestra que estén todas las reglas oficiales ni que se ejecuten sus condiciones. `isRegimeCode` acepta cualquier par de dígitos; no comprueba el catálogo ni las combinaciones por impuesto.

**Corrección:** inventariar todas las reglas de la edición fijada con localizador de fuente, entrada, predicado, resultado y código; clasificar cada una como implementada, no aplicable con fundamento o bloqueada. Resolver enums y combinaciones desde catálogos cerrados. Enlazar cada regla con tests identificables, no solo con un archivo compartido. No inferir incumplimiento únicamente del número 15: la carencia se acredita por la ausencia de correspondencia exhaustiva y de implementación.

**Cierre:** checker bidireccional detecta regla omitida, desconocida, duplicada y sin prueba positiva/negativa; casos por impuesto y límites. **Riesgo:** endurecer puede rechazar entradas antes aceptadas; distinguir defectos de la implementación de cambios oficiales de edición.

<a id="rev-003"></a>

### REV-003 — Los desgloses y sus totales no forman parte de la preparación

**P1 · C-I · fases 4–5, 8.** Evidencia: `validation/totals.ts`, `api/create-verifactu.ts:prepare`, XSD `SuministroInformacion.xsd:1261`. Existe `validateBreakdownTotals`, pero preparar un alta no lo invoca y el modelo no transporta el desglose. Su límite genérico es 1.000 líneas, mientras el XSD fijado permite 12 `DetalleDesglose` por bloque.

**Corrección:** integrar desglose, tributos, cuotas y recargos en el modelo oficial; aplicar su cardinalidad y comprobar los totales dentro del pipeline. Mantener decimal textual y aritmética `bigint`. Aplicar tolerancias, excepciones y gravedad exactamente según la regla fijada: no convertir automáticamente las advertencias actuales en errores. Documentar euros y responsabilidad del host sobre conversión, sin introducir tipos de cambio externos implícitos.

**Cierre:** 0/1/12/13 detalles, importes negativos, escalas, tolerancia ±frontera, regímenes mixtos y conversión explícita; ninguna suma en coma flotante. **Riesgo:** confundir una validación tolerada por AEAT con exactitud contable o cambiar lexemas que participan en la huella.

<a id="rev-004"></a>

### REV-004 — La edición anunciada para fase 5 y sus fuentes no tienen la misma trazabilidad que la edición ejecutable

**P1 · C-I · fases 1, 3, 5.** Evidencia: `editions.ts` publica `PHASE5_EDITION_ID=...2026-09-05`; `regulatory/phase5-sources.json` enumera PDF, estándar y DSS; `generated/edition.ts` y el perfil interno solo admiten `...2026-09-03`. El catálogo sucesor contiene URLs y fechas, pero no bytes y digests verificados por el importador de ocho WSDL/XSD.

**Corrección:** decidir si esos documentos son referencias de la edición existente o una edición nueva. En el primer caso, eliminar la falsa capacidad sucesora; en el segundo, generar y admitir un bundle completo independiente. Fijar procedencia, revisión y digest de firma, QR y validaciones; documentar la distribución legal de cada fuente. Derivar IDs desde un registro único de ediciones.

**Cierre:** `listEditions`, `getEdition`, capacidades, API, CLI, contratos y perfil coinciden; toda fuente que determina comportamiento tiene evidencia de selección. **Riesgo:** cambiar un ID de edición altera evidencia y compatibilidad; nunca reescribir registros existentes ni actualizar snapshots automáticamente.

<a id="rev-005"></a>

### REV-005 — Los checks de contratos no validan los esquemas que declaran usar

**P1 · C-I · fase 3.** Evidencia: `check-regulatory-manifest.mjs` solo inspecciona algunos campos; `check-contracts.mjs` verifica hashes listados, no exhaustividad ni JSON Schema; `contracts/.../schemas/contract-manifest.schema.json` y manifiesto generado no tienen completa concordancia, incluida `generatedBy`.

**Corrección:** validar manifiestos con AJV fijado y schemas cerrados; imponer claves, tipos, tamaños, IDs, edición, rutas relativas seguras y lista exacta de archivos. Resolver referencias localmente. Verificar hashes del bundle y del generador. Comprobar que catálogos, source map y manifiestos se refieren a los mismos objetos; un checksum actualizado junto al archivo no prueba corrección semántica.

**Cierre:** alterar `generatedBy`, vaciar `files`, añadir archivo no inventariado, escapar un directorio o introducir `$ref` remoto hace fallar el control correspondiente. **Riesgo:** corregir primero schemas/generador y después regenerar; no modificar miles de entradas manualmente ni admitir propiedades adicionales para esconder discrepancias.

<a id="rev-006"></a>

### REV-006 — Importación offline, persistencia y vigilancia regulatoria tienen huecos

**P1 · C-I · fases 2–3, 9.** Evidencia: `scripts/import-regulatory.mjs`: la rama offline calcula digests pero no llama a `assertDigest`; `writeVerifiedSnapshot` usa `writeFile` directo; se actualizan archivos secuencialmente. El workflow de drift puede conservar la procedencia antigua si un digest nuevo provoca excepción antes de escribir el informe.

**Corrección:** separar verificación offline sin escritura, descarga de candidato y promoción revisada. Comparar tamaño y ambos digests también offline; validar todo el conjunto en un temporal y publicarlo atómicamente. Rechazar symlinks y rutas no regulares en la frontera de escritura. Producir informe de drift con esperado/observado, fuente y causa incluso cuando falle, sin sustituir edición activa. Cubrir también PDF y demás fuentes ejecutables. Cerrar/cancelar cuerpos HTTP al rechazar redirects o respuestas.

**Cierre:** corrupción offline falla; corte en cada escritura no deja edición mixta; cambio remoto queda registrado con digest nuevo y bloquea las afirmaciones afectadas. **Riesgo:** vigilancia no es actualización automática; los fixtures de red deben ser locales y no depender del portal.

<a id="rev-007"></a>

### REV-007 — El XML incluye la huella anterior como huella del registro nuevo

**P0 · C-R · fase 5.** Evidencia: `xml/records.ts:altaElement/anulacionElement`, `api/create-verifactu.ts:eventXml`. Se escribe `previous.fingerprint` en `Huella` o `HuellaEvento`; en génesis queda vacío. La reproducción de un alta preparada devolvió `<Huella></Huella>` aunque `prepared.fingerprint` contiene el digest calculado.

**Corrección:** calcular la huella oficial sobre la preimagen definida y pasarla explícitamente al serializador como huella del registro actual. Representar el anterior exclusivamente dentro de `Encadenamiento`, con su identidad completa; génesis usa la estructura oficial `PrimerRegistro`. Separar los tipos `CurrentOfficialFingerprint` y referencia anterior, o un constructor equivalente que impida intercambiarlos.

**Cierre:** golden XML para alta, anulación y evento en génesis/sucesor; extraer la huella emitida y recomputarla independientemente; mutante que intercambia ambas huellas debe morir. **Riesgo:** cambia bytes y evidencia; los artefactos previamente emitidos requieren diagnóstico explícito, no corrección silenciosa de históricos.

<a id="rev-008"></a>

### REV-008 — No hay validación XSD efectiva y los XML emitidos no cumplen el esquema fijado

**P0 · C-I · fases 3, 5, 7–8.** Evidencia: `xml/records.ts` emite raíces sin namespace y sin campos obligatorios; la anulación usa nombres de alta; `submissions/batch-builder.ts` sitúa datos en cabecera que pertenecen al registro. `parseSecureXml` solo comprueba estructura XML, y `xml validate` lo presenta como validación.

**Corrección:** implementar un validador XSD real admitido, con imports resueltos exclusivamente desde el bundle fijado; incluir la clausura de dependencias XMLDSig cuando sea necesaria. Generar serializadores con namespaces, orden, `choice`, restricciones y cardinalidades exactos. Aplicarlo antes de confirmar, enviar o declarar válido un registro. Distinguir inspección XML de conformidad XSD en nombres y resultados.

**Cierre:** validador independiente rechaza los ejemplos actuales incompletos y acepta fixtures completos; probar namespace incorrecto, elemento obligatorio ausente, orden cambiado y cada elección inválida. **Riesgo:** el backend XSD y su coste deben admitirse y medirse; no usar acceso remoto a schemas durante operaciones normales.

<a id="rev-009"></a>

### REV-009 — Los límites XML se aplican después de construir el DOM y no son una política cerrada

**P1 · C-I · fases 5, 9.** Evidencia: `xml/codec.ts:parseSecureXml/fromDom`. Se detecta DTD/entidad pero igualmente se llama al parser. Profundidad, nodos y texto se cuentan después de construir el DOM; `parserErrors` no está acotado. Las opciones se mezclan sin validar números finitos ni máximos duros. `freezeElement` vuelve a recorrer subárboles ya procesados.

**Corrección:** rechazar construcciones prohibidas antes del parser; usar parsing incremental con presupuestos durante lectura, o backend que los imponga antes de asignar estructuras. Acotar atributos, nombres, textos, diagnósticos y bytes totales. Validar límites en una fábrica central con hard caps y congelar cada nodo una sola vez. La serialización pública también debe detectar ciclos, profundidad y tamaño.

**Cierre:** payloads justo antes/en/después del límite; árboles anchos y profundos, DTD, atributos masivos, `NaN`/`Infinity`, ciclos y cancelación; registrar tiempo/RSS máximos. **Riesgo:** rechazar demasiado XML válido; separar restricciones normativas de endurecimiento explícito del producto.

<a id="rev-010"></a>

### REV-010 — `canonicalizeXml` no implementa un algoritmo C14N de firma

**P0 · C-I · fase 5.** Evidencia: `xml/codec.ts:canonicalizeXml/serializeNode`; elimina la declaración y reutiliza el serializador propio. Ordena nombres de atributos con `localeCompare` sin locale; no resuelve namespaces, atributos heredados ni reglas del algoritmo declarado en XMLDSig.

**Corrección:** separar serialización determinista de canonicalización criptográfica. Admitir una implementación contrastada de los algoritmos requeridos por el perfil AEAT y validar URIs/transformaciones exactas. Para serialización ordinaria, fijar un orden no dependiente de locale cuando el contrato lo permita; para C14N, seguir el estándar, no simplemente ordenar QName. Referencia: [W3C Canonical XML](https://www.w3.org/TR/xml-c14n11/); la versión concreta debe proceder del perfil de firma, no elegirse por este enlace.

**Cierre:** corpus diferencial con un segundo backend, namespaces heredados, prefijos equivalentes, atributos con distinto namespace y referencias a subárboles; iguales bytes en la matriz soportada. **Riesgo:** una reserialización después de firmar puede invalidar la firma; conservar bytes finales y no normalizar Unicode por conveniencia.

<a id="rev-011"></a>

### REV-011 — El serializador XML pierde semántica en atributos y admite caracteres no válidos

**P1 · C-R · fases 5, 9.** Evidencia: `xml/codec.ts:escapeAttribute/hasForbiddenControl`. La tabulación no se escapa; se reprodujo `a\tb → a b` al serializar y parsear. El filtro de controles no valida por completo caracteres XML ni pares sustitutos. `NAME` admite QName estructuralmente incorrectos, por ejemplo múltiples dos puntos, sin validar su resolución.

**Corrección:** validar caracteres según la versión XML fijada y Unicode bien formado; escapar tabulación de atributo como `&#x9;`, junto con CR/LF según el contexto. Usar modelo namespace-aware con nombres locales/prefijos resueltos, no una regex como validador completo. Rechazar entradas hostiles antes de ejecutar getters o recorrer ciclos.

**Cierre:** round-trip para tab, CR, LF, entidades y caracteres límite; rechazo de sustitutos aislados, U+FFFE/U+FFFF y QName no válido. **Riesgo:** los lexemas oficiales y los textos normalizados por XML no son intercambiables; probar su relación con huella y firma.

## 3. Firma, certificados, API e integridad

<a id="rev-012"></a>

### REV-012 — La comprobación XAdES estructural acepta una firma inexistente criptográficamente

**P0 · C-R · fases 5, 9.** Evidencia: `signatures/index.ts:validateXadesEnvelope` y `tests/unit/phase5.unit.test.ts`. Un XML sin namespaces XMLDSig/XAdES, con `DigestValue=abc`, sin `SignatureValue` y con texto de política concatenado devuelve éxito. El nombre del helper reconoce una comprobación de envoltura, pero esa comprobación no satisface el verificador normativo.

**Corrección:** mantener, si resulta útil, una inspección estructural con resultado inequívoco; implementar verificación criptográfica completa mediante el backend admitido. Resolver el nodo esperado por referencia local única, verificar digests, SignedProperties, SignedInfo, SignatureValue, política, algoritmos, transforms y certificado. Prohibir referencias externas y wrapping. Conectar este verificador con la API y la confirmación NO VERI*FACTU.

**Cierre:** el ejemplo actual solo puede pasar inspección parcial, nunca verificación; pruebas de firma válida y cada alteración independiente, incluida firma válida de otro nodo. **Riesgo:** `recordSha256` calculado sobre el XML completo no debe interpretarse como validación de su firma.

<a id="rev-013"></a>

### REV-013 — El backend DSS es un puente de callbacks, sin evidencia de interoperabilidad local

**P1 · C-I/V · fase 5.** Evidencia: `createDssBackend` devuelve `{id:'dss-6.4', sign: bridge.sign, verify: bridge.verify}`. La separación de claves es correcta, pero el literal no verifica versión, capacidades ni comportamiento de DSS. No se encontró un proceso/backend de referencia ejecutado con fixtures criptográficos completos.

**Corrección:** definir handshake de capacidades/versiones y contrato de errores del puente. Preparar un backend de referencia para pruebas aisladas, fijar distribución y checksum, revisar licencia y generar firmas sintéticas verificadas por un segundo implementador. No incorporar claves privadas ni lanzar procesos desde el núcleo; ubicar integración y fixture en adapters/harness.

**Cierre:** una firma producida y verificada realmente, por modalidad y tipo de registro; negativa por versión/provider incompatible, timeout y respuesta malformada. **Riesgo:** no convertir la dependencia opcional del host en dependencia obligatoria de todo consumidor ni afirmar interoperabilidad AEAT externa antes de fase 10.

<a id="rev-014"></a>

### REV-014 — Certificado «usable» se deduce de fechas y un booleano declarado

**P1 · C-I · fases 5, 8.** Evidencia: `certificates/index.ts:describeCertificate/assertCertificateUsable`; `qualified` procede del llamante. No se prueba cadena, revocación, uso de clave, algoritmo/tamaño, titularidad o representación. Las fechas se exponen en el texto de Node, no en un DTO temporal normalizado.

**Corrección:** separar descriptor informativo de evidencia de confianza emitida por un provider admitido. Validar cadena, políticas y usos, RSA/tamaño exigidos, sujeto/representación, vigencia y revocación a un instante explícito. Modelar `valid/invalid/indeterminate`; ausencia de OCSP/CRL o prueba de representación no es validación positiva. Normalizar tiempos sin alterar el instante ni usar reloj implícito.

**Cierre:** certificados sintéticos expirados, aún no válidos, cadena ajena, revocados, clave corta, uso incorrecto, sujeto equivocado y revocación inaccesible. **Riesgo:** red de confianza pertenece al provider; cache, caducidad y evidencia deben ser explícitas. No atribuir al helper descriptivo una capacidad de PKI que no pretende implementar.

<a id="rev-015"></a>

### REV-015 — `commit` confía en bytes y metadatos arbitrarios del signer

**P0 · C-I · fases 5–6, 8.** Evidencia: `api/create-verifactu.ts:commit` solo exige `signed.ok`, copia `signed.value.xml` y no contrasta `signedRecordId`, `certificateId`, `profile`, `recordSha256` ni el contenido firmado. `SignerPort` no proporciona por sí mismo la validación independiente.

**Corrección:** copiar la entrada antes de cruzar el puerto; validar la salida contra un schema cerrado y presupuesto; comprobar el registro, política, referencia y provider esperados y verificar la firma resultante. Reextraer el contenido fiscal y compararlo con el modelo/huella autorizados. Persistir únicamente el resultado final verificado. Revisar cancelación después del `await` del signer y antes de persistir.

**Cierre:** signer que cambia NIF, ID, importe o nodo, devuelve bytes vacíos/ajenos, resultado de otro certificado o firma inválida provoca fallo sin commit. **Riesgo:** la verificación adicional tiene coste; medirlo sin eliminarla para cumplir rendimiento. Un provider de confianza sigue siendo una frontera con errores posibles.

<a id="rev-016"></a>

### REV-016 — Un artefacto fabricado o modificado puede confirmarse

**P0 · C-R · fases 6, 8–9.** Evidencia: `api/create-verifactu.ts:commit`; `PreparedArtifact` es un objeto estructural con `Uint8Array` mutable. Se reprodujo sustituir bytes por `<arbitrary/>` y huella por 64 `A`; `commit` devolvió éxito y estado `queued`.

**Corrección:** definir un artefacto preparado opaco con bytes privados y copia defensiva al exponerlos, o una entrada serializable cuya integridad se revalide completamente al confirmar. Comprobar edición, modalidad, sujeto, instalación, secuencia, tipo, identidad, huella, bytes y evidencia como conjunto. La marca TypeScript o `Object.freeze` superficial no sustituye verificación runtime. Rechazar entradas desconocidas con `Result`, sin efectos parciales.

**Cierre:** alterar individualmente todos los campos, usar artefacto de otra instancia y mutar el buffer mientras espera el signer/store no puede producir un commit incoherente. **Riesgo:** diferenciar exportación pública de modelo interno; no hacer imposible la recuperación legítima de artefactos persistidos.

<a id="rev-017"></a>

### REV-017 — Aislamiento de contexto e identidad no es uniforme

**P0 · C-I · fases 4, 6, 8.** Evidencia: `isConfig` exige strings no vacíos pero no `OpaqueId`; `verifyChain` y `export` permiten scopes arbitrarios; `MemoryRecordStore.sequenceKey` concatena con NUL; `read/transition` identifican registros solo por `recordId`. IDs con NUL pueden colisionar si llegan a los puertos de bajo nivel; no hay prueba integral de autorización multiobligado.

**Corrección:** fijar alcance de cada instancia y capability del adapter. Rechazar desvíos de contexto salvo una API administrativa explícita autorizada por el host. Validar IDs opacos, usar claves compuestas no ambiguas y definir unicidad de recordId por scope o global mediante contrato. Incluir obligado, instalación y modalidad donde determinen la secuencia. No añadir autorización ficticia basada solo en que coincidan strings.

**Cierre:** matriz cruzada de dos obligados, instalaciones, cadenas y credenciales; lecturas, exportaciones, transiciones y envíos no cruzan fronteras. **Riesgo:** migración de claves/índices y compatibilidad de adapters existentes; el host conserva la autenticación de usuarios.

<a id="rev-018"></a>

### REV-018 — La preparación no vincula el registro al head confirmado ni a su cronología

**P0 · C-I · fases 4, 6, 8.** Evidencia: `prepare` acepta `previous` del llamante; `commitSecuredRecord` hace `nextHead(expectedHead, record.linkDigest)` sin demostrar que el XML use ese anterior ni su identidad. `prepareAnulacion` acepta un modelo `alta` y etiqueta el artefacto como anulación: reproducido.

**Corrección:** rechazar discriminantes cruzados; incorporar al artefacto el head/base contra el que se preparó, incluida identidad fiscal del registro anterior. En confirmación verificar coincidencia y CAS; ante conflicto, reconstruir y volver a firmar con un nuevo artefacto, nunca cambiar bytes de uno enviado. Validar instante de generación monotónico según contrato y secuencias separadas de eventos.

**Cierre:** dos preparaciones concurrentes sobre la misma cabeza: una confirma y la otra falla claramente; anterior falso, cronología regresiva, tipo cruzado y génesis repetida se rechazan. **Riesgo:** distinguir reinicio legítimo, edición e instalación de un reinicio artificial de cadena.

<a id="rev-019"></a>

### REV-019 — Evidencia preparada y bytes confirmados pueden referirse a materiales distintos

**P0 · C-I · fases 4–6, 8.** Evidencia: `prepare` calcula `createInternalRecordEvidence` sobre XML sin firma; `commit` puede firmarlo y guarda un nuevo envelope mediante `encodeInternalEvidenceSubject`, pero devuelve el `artifact` original. Además, el bundle guarda bytes de subject, no demuestra por sí mismo persistencia de la evidencia generada por el motor.

**Corrección:** definir dos etapas inequívocas: material preparado y material definitivo. Crear/verificar la evidencia interna final sobre los bytes que realmente se conservan y devolverla en `CommittedArtifact`. Persistir subject, evidence, perfil, versión, algoritmo y los anclajes necesarios mediante contrato cerrado. Evitar recalcular una «evidencia» de otra etapa bajo el mismo campo. Usar exclusivamente API pública del motor.

**Cierre:** firma que añade contenido legítimo cambia el subject final y sus digests; lectura posterior verifica exactamente ese subject; alteración de contexto, edición o bytes falla. **Riesgo:** no modificar el perfil 1.0.0 bajo el mismo identificador si cambia su semántica; versionar y conservar lectores.

<a id="rev-020"></a>

### REV-020 — `verifyRecord` no verifica correctamente su propia salida ni los bytes

**P0 · C-R · fases 5, 8.** Evidencia: `api/create-verifactu.ts:verifyRecord`, aproximadamente línea 186. Se vuelve a pasar `validated.fingerprint`, que contiene value objects, al validador de DTO de strings: el artefacto recién preparado devuelve `invalid`. El camino no compara el XML con el modelo; bytes solos devuelven `indeterminate`, y eventos no tienen la misma forma anidada.

**Corrección:** construir un único verificador de registro por edición a partir de bytes/DTO de intercambio explícito: XML seguro, XSD, modelo, reglas, huella, firma aplicable, evidencia y expectativas. Un artefacto opaco puede aportar caché verificable, no saltarse el vínculo con bytes. Diferenciar dato inválido de evidencia externa insuficiente y cancelación.

**Cierre:** `prepare → verify` válido; `commit → read → verify` válido; cada campo y byte alterado detectado; alta/anulación/evento y ambas modalidades. **Riesgo:** evitar que la solución simplemente desempaquete `.value` y siga verificando un modelo desconectado del artefacto.

<a id="rev-021"></a>

### REV-021 — `verifyChain` es una comparación de hashes por registro, no una verificación de cadena

**P0 · C-R · fases 4, 6, 8.** Evidencia: `api/create-verifactu.ts:208`. Solo compara SHA-256 de `record.bytes` con `recordDigest`. El artefacto arbitrario confirmado en REV-016 apareció `valid`. No comprueba posición, anterior, duplicados, huecos, orden, huella fiscal, firma, evidencia ni ancla final. Sin store finaliza vacío.

**Corrección:** definir modo completo/fragmento, expectativas de inicio/fin y resumen de completitud. Verificar cada registro y enlaces oficiales; comprobar también cadena de evidencia interna cuando se declare esa garantía. Exigir ancla externa y recuento para afirmar integridad completa; sin ellas declarar alcance limitado/indeterminado. Tratar store ausente y fin truncado como resultado explícito.

**Cierre:** borrar, duplicar, intercambiar, insertar, truncar, sustituir bytes+digest y usar un ancla ajena no puede producir una cadena completa válida. **Riesgo:** reutilizar correctamente el motor sin confundir sus enlaces con la cadena RRSIF; O(n) y buffers acotados.

<a id="rev-022"></a>

### REV-022 — Los eventos NO VERI*FACTU no tienen su ciclo normativo implementado

**P0 · C-I · fases 4–6, 8.** Evidencia: `api/create-verifactu.ts:prepareEvent/eventXml`, `ports/index.ts`; contrato `docs/03-dominio/05-registros-eventos.md`. Se serializan datos de huella en un XML mínimo. No existe un mecanismo durable para resúmenes de seis horas operativas, cierre/reinicio, eventos de anomalía, exportación y restauración, ni enlace automático con esas operaciones.

**Corrección:** modelar todos los eventos del catálogo oficial y sus bloques específicos; implementar un servicio de eventos con reloj explícito, estado operativo durable e idempotencia. El host debe invocar inicio, suspensión, cierre y restauración mediante un contrato verificable. Persistir evento, head y avance del período atómicamente; generar el resumen vencido antes de reanudar. Firmar y verificar la secuencia de eventos separadamente.

**Cierre:** cada código oficial tiene fixture XSD y prueba; seis horas sin actividad, varias interrupciones, reloj regresivo, fallo de firma/commit y reinicio no omiten ni duplican el resumen. **Riesgo:** no introducir timers implícitos en el núcleo ni confundir eventos de observabilidad con registros fiscales.

<a id="rev-023"></a>

### REV-023 — La modalidad es una etiqueta de configuración, sin las transiciones normativas

**P0 · C-I · fases 4, 6, 8.** Evidencia: `VerifactuConfig.mode`, `commit` y grafo `state/transitions.ts`. No hay estado anual por obligado, transición/renuncia con `FechaFinVeriFactu` ni prueba de separación entre remisión voluntaria y requerimiento. `commitSecuredRecord` deja todos los registros `queued`, también los NO VERI*FACTU sin remisión ordinaria.

**Corrección:** definir máquina de modalidad por obligado y período, con decisión/calendario explícitos y persistencia CAS; vincular capacidades de firma, eventos, QR, consulta y remisión a esa máquina. Distinguir conservación local de trabajo pendiente de envío. Exponer el requerimiento con sus metadatos oficiales y autorización del host. Corregir estados sin alterar registros históricos.

**Cierre:** cambio de modalidad dentro del año, fin de año, renuncia, múltiples instalaciones, evento en modalidad indebida, requerimiento y consulta no autorizada. **Riesgo:** reglas temporales requieren trazabilidad oficial; no basarse en el día del equipo ni convertir la fase 10 en lugar de implementar esta funcionalidad pendiente.

<a id="rev-024"></a>

### REV-024 — Reconciliación y consulta no resuelven entregas indeterminadas

**P1 · C-I · fases 7–8.** Evidencia: `api/create-verifactu.ts:reconcile` devuelve resuelto si ya existe un work `completed` con respuesta parseable; en el resto, indeterminado. No hay consulta de presentados, paginación, adjudicación de duplicados ni transacción que aplique la resolución.

**Corrección:** implementar reconciliación a partir de evidencia persistida y, cuando proceda, consulta AEAT explícita para VERI*FACTU; validar operación/capacidad, identidad y edición. Conservar ambigüedad si no existe prueba suficiente. Resolver de forma idempotente estado de lote y registros mediante fencing/CAS. No reenviar como forma de averiguar si llegó.

**Cierre:** entrega sin respuesta, respuesta recuperada, duplicado coincidente/discrepante, consulta paginada, registro no encontrado y fallo tras persistir resolución. **Riesgo:** ausencia en una consulta puede no probar no entrega; fijar la regla exacta según servicio, sin declarar resuelto por simple éxito de parsing.

<a id="rev-025"></a>

### REV-025 — Exportación no acredita completitud, fidelidad ni alcance de acceso

**P1 · C-I · fases 6, 8–9.** Evidencia: `api/create-verifactu.ts:export`. Produce líneas con ID, estado, posición y bytes base64; omite metadatos de edición/contexto, evidencia, anclas y manifiesto. Ausencia de store o aborto terminan silenciosamente; un límite produce un fragmento sin indicarlo.

**Corrección:** definir formato de exportación versionado, manifiesto inicial/final con alcance, recuento, digests/anclas, edición y `complete`; mantener bytes originales. Ofrecer paginación/reanudación explícita y exportación fiscal legible según contrato. Autorizar scope en el host/adapter y registrar el evento NO VERI*FACTU aplicable. Reportar error del iterador/cancelación sin presentar éxito.

**Cierre:** round-trip independiente, stream truncado, error tras N registros, límite, permisos cruzados y restauración; nunca `complete:true` sin verificar el final. **Riesgo:** el manifiesto también contiene metadatos sensibles; aplicar permisos y retención adecuados, no exportar credenciales ni datos comerciales ajenos al registro.

<a id="rev-026"></a>

### REV-026 — Observers pueden interrumpir operaciones y contradecir el resultado durable

**P1 · C-I · fases 6–9.** Evidencia: `application/commit-record.ts` emite tras el commit sin aislamiento; `process-queue.ts` emite antes/después del envío sin `try/catch`. Un observer que lanza puede hacer fallar al llamante después de persistir, o dejar trabajo `submitting` sin enviar. El facade no pasa su observer al commit. Faltan modalidad/duración y se usa `edition:'runtime'` o el estado AEAT como edición.

**Corrección:** centralizar emisión segura con contrato acotado y datos saneados; aislar fallos del observer por defecto. Si el host exige auditoría durable, representarla como precondición/transacción distinta y explícita. Definir catálogo, edición real, modalidad, correlación opaca y duraciones del reloj de medición inyectado. Propagar el observer de manera consistente.

**Cierre:** observer que lanza no cambia bytes ni resultado operativo; captura de logs comprueba que no aparecen NIF, XML, mensajes externos ni secretos. **Riesgo:** evitar que el canal de fallos del observer llame recursivamente al mismo observer o produzca cardinalidad ilimitada.

<a id="rev-027"></a>

### REV-027 — Validación runtime, límites y cancelación de la API son incompletos

**P1 · C-I · fases 8–9.** Evidencia: `isConfig` accede directamente a propiedades; métodos públicos tipados no validan todos sus inputs; `config.limits` se copia pero no gobierna el pipeline; `Date(0)` sustituye un reloj ausente en commit. Validación abortada/indeterminada se convierte a menudo en `INVALID_INPUT`; hay `await` sin revisión posterior de señal.

**Corrección:** usar validadores estrictos en cada frontera pública, incluidos tipos, descriptors, proxies, buffers compartidos y hard caps; distinguir objetos de datos de providers de confianza. Exigir reloj para operaciones que registran un instante real. Preservar los estados de resultado y verificar cancelación antes de cada efecto. Normalizar excepciones de adapters según su contrato sin ocultar defectos internos como entradas inválidas.

**Cierre:** entradas JS sin TypeScript, getter que lanza, proxy, `null`, límite no finito, reloj inválido, aborto durante provider/scan/commit; ninguna excepción ordinaria escapa ni se pierde un resultado durable. **Riesgo:** no prometer cancelar una transacción ya confirmada; devolver su recibo o estado recuperable.

## 4. Persistencia, estados, concurrencia y outbox

<a id="rev-028"></a>

### REV-028 — La frontera atómica no conecta la factura del host con registro y outbox

**P0 · C-I · fases 6, 8.** Evidencia: `RecordStore.commit`, `RecordCommitBundle`, `api/create-verifactu.ts:commit` envía `outbox: []`; `MemoryRecordStore.committedOutbox` conserva bundles en un array separado de `MemoryOutboxStore`. No existe una ruta demostrada `prepare → commit → processQueue` que encole automáticamente el registro.

**Corrección:** acordar un puerto de unidad de trabajo o contrato de callback transaccional que el host implemente sobre su misma transacción de factura. El commit debe incluir bytes finales, heads, evidencia, transiciones, eventos e intención durable de remisión cuando aplique. Para batching posterior, persistir una intención atómica por registro y materializar el lote con CAS/IDs estables; no es obligatorio enviar un lote de un registro. Diseñar explícitamente la unión entre store y outbox.

**Cierre:** crash antes/después de cada escritura y confirmación de factura demuestra todo-o-nada; todo registro VERI*FACTU confirmado tiene intención de envío recuperable. **Riesgo:** no meter la base de datos comercial en la biblioteca ni usar dos commits independientes como sustituto de atomicidad.

<a id="rev-029"></a>

### REV-029 — CAS, génesis y avance de head aceptan estados incoherentes

**P0 · C-I · fase 6.** Evidencia: `memory-record-store.ts:commit` solo compara el esperado si ya hay head; acepta un supuesto head no génesis en store vacío. No comprueba todos los campos del head nuevo. `state/heads.ts:nextHead` usa `Number.isInteger`, sin límite seguro ni relación posición-versión.

**Corrección:** validar génesis canónica cuando no existe head, identidad/posición/versión/digest completos cuando existe y avance exacto. Rechazar números no seguros y overflow; usar comparación atómica real en adapters durables. Validar bundle y sus referencias antes de mutar cualquier estructura. El recibo del store debe coincidir con la operación solicitada.

**Cierre:** falso head inicial, salto, versión regresiva, digest inconsistente, contextos cruzados, límites `MAX_SAFE_INTEGER` y carreras con dos writers. **Riesgo:** endurecer rompe el fixture del adapter kit, que inicia en posición 0 sin head; corregir el fixture, no relajar el contrato.

<a id="rev-030"></a>

### REV-030 — Freshness no comprueba identidad, digest ni anclaje externo

**P0 · C-R · fase 6.** Evidencia: `state/heads.ts:assertFreshness` y `MemoryRecordStore.verifyFreshness` solo comparan posición/versión. Se reprodujo aceptar dos heads de distintos contextos y distintos digests en la misma posición. El checkpoint del adapter vive en el mismo proceso y no constituye ancla independiente.

**Corrección:** exigir misma identidad de cadena y digest igual en la misma posición; para avances, verificar extensión desde el checkpoint. Diseñar puerto de anclas externas con autenticidad y persistencia independiente del storage evaluado. Si falta ancla, declarar la garantía limitada; no inventar protección contra rollback coordinado.

**Cierre:** cambiar digest manteniendo contadores, sustituir contexto, restaurar copia vieja, rollback conjunto de datos+checkpoint y pérdida del ancla. **Riesgo:** una firma/hashing del checkpoint almacenado junto a datos no evita que ambos se restauren a una versión válida antigua.

<a id="rev-031"></a>

### REV-031 — El contador de intentos de outbox no avanza

**P1 · C-R · fases 6–7.** Evidencia: `MemoryOutboxStore.markSubmitting/updateLeased/release`; `attempt` se inicializa a 0 y nunca se actualiza. Se reprodujo pasar a `submitting` conservando `attempt:0`. El backoff/exhaustión se calcula con ese valor; `StoredRecord.attempt` puede divergir.

**Corrección:** definir qué cuenta como intento y asignar un ID monotónico al comenzar uno, dentro de la transición CAS. Incrementar y persistir exactamente una vez, compartir el valor en trabajo, registros y observaciones. La decisión de retry no debe ser el único lugar donde existe el siguiente número.

**Cierre:** secuencia de fallos supera maxAttempts y llega a dead-letter una sola vez; reinicio y worker duplicado no reinician ni duplican el contador. **Riesgo:** decidir si fallo anterior a conexión consume intento; documentarlo y mantenerlo igual en todos los adapters.

<a id="rev-032"></a>

### REV-032 — Un lease vencido de trabajo `submitting` vuelve a ser enviable sin reconciliar

**P0 · C-R · fases 6–7, 9.** Evidencia: `MemoryOutboxStore.lease` convierte cualquier lease expirado en elegible; se reprodujo que un segundo worker toma un trabajo `submitting` tras vencer. Puede haber entrega remota del intento anterior.

**Corrección:** distinguir lease vencido antes de envío de entrega posible. Recuperar `submitting` con evidencia insuficiente como `indeterminate`, mantener request/attempt inmutables y pasar por reconciliación. Aplicar fencing a todas las escrituras de resultado, no solo a la toma de lease. Incluir generación durable del token tras reinicios.

**Cierre:** worker A envía y queda suspendido, vence lease, B recupera, A responde tarde: ningún reenvío ciego ni escritura de A modifica el intento nuevo. **Riesgo:** priorizar seguridad ante ambigüedad puede requerir intervención; esa condición debe ser observable y recuperable, no descartada.

<a id="rev-033"></a>

### REV-033 — El tiempo y la validación del lease no reflejan la duración real del procesamiento

**P1 · C-I · fases 6–7.** Evidencia: `processQueueOnce` toma `now` una sola vez y lo reutiliza para todos los trabajos y finalizaciones. `checked` permite que fecha inválida eluda comparaciones con `NaN`; límites y owner no se validan exhaustivamente. No hay renovación de lease para operaciones largas.

**Corrección:** obtener instante explícito antes de cada transición, validar fechas canónicas y números seguros, owner y estado permitido. Usar tiempo transaccional del storage o una política documentada de skew; renovación con fencing cuando la operación lo requiera. No arrendar más trabajos de los que puedan iniciarse dentro de su plazo; paginar adquisición.

**Cierre:** lote con primer envío lento, lease vencido antes del segundo, reloj adelantado/regresivo, `NaN`, fracciones y propietario incorrecto. **Riesgo:** un reloj local no es autoridad suficiente entre hosts; definir responsabilidad del adapter durable y margen de seguridad.

<a id="rev-034"></a>

### REV-034 — Los reintentos dejan estados de registros que el siguiente intento no admite

**P0 · C-I · fases 6–7.** Evidencia: `processQueueOnce` mueve registros de `queued` a `submitting`; si `send` falla, libera outbox pero no los devuelve por el camino `retryable → queued`. `moveRecords` vuelve a exigir `queued`. Si un registro del lote falla al transicionar, los anteriores quedan movidos.

**Corrección:** diseñar transiciones coordinadas de intento y registros: reserva atómica del lote, resultado seguro no enviado, entrega posible y respuesta. Definir estado recuperable para cada interrupción y una operación CAS de lote; no corregir estados uno a uno ignorando fallos. Conservar trazabilidad de las transiciones y distinguir reenviar mismos bytes de crear registro de subsanación.

**Cierre:** fallo en primer/último registro, error antes de red, segundo intento exitoso y crash después de reservar; sin registros atascados ni doble envío. **Riesgo:** ampliar el puerto requiere migración de adapters y tratamiento de estados antiguos, sin edición destructiva del registro fiscal.

<a id="rev-035"></a>

### REV-035 — Se informa de finalización aunque fallen las escrituras de resultados

**P0 · C-I · fases 6–7.** Evidencia: `applyResponseStates` ignora `Result` de `store.transition`; varias llamadas a `outbox.complete/release` se ignoran; `completed` aumenta incondicionalmente. La respuesta del lote puede quedar completada sin que lo estén sus registros o al revés.

**Corrección:** persistir primero evidencia de respuesta e identidad del intento y aplicar clasificación mediante una transacción o journal idempotente recuperable. Comprobar cada recibo/fencing y devolver resultado que refleje la persistencia real. No contabilizar éxito antes del commit. Si falla la aplicación, conservar respuesta y una tarea local de reaplicación; no reenviar a AEAT.

**Cierre:** inyectar fallo en cada transición/finalización y reejecutar tras reinicio: mismo resultado final, respuesta preservada y una única entrega. **Riesgo:** respuesta remota aceptada no se puede deshacer; el rollback local debe referirse solo a su aplicación, no a la realidad externa.

<a id="rev-036"></a>

### REV-036 — Idempotencia y máquina de estados necesitan invariantes de identidad completos

**P1 · C-I · fases 6–8.** Evidencia: `MemoryOutboxStore.enqueue` acepta workId repetido si coincide un digest declarado, sin recalcular bytes ni comparar destino/certificado/recordIds; devuelve clones de la solicitud, no necesariamente el work existente. `transitionRecord` solo valida la arista; el store no valida actor, ID, fecha y attempt de la transición ni conserva un journal completo de cambios posteriores.

**Corrección:** definir clave de idempotencia por scope y operación, request digest calculado, metadatos comprometidos y recibo original. Validar toda transición y persistir un journal append-only. Diferenciar solicitud idéntica de colisión; nunca modificar bytes de un registro por subsanación/anulación. El modelo de pruebas debe aplicar las mismas invariantes que un adapter conforme.

**Cierre:** mismo ID con otro destino, certificado, bytes o factura falla; repetición idéntica recupera recibo estable; transiciones ilegales y actor/recordId ajenos se rechazan. **Riesgo:** hashes no sustituyen claves de unicidad ni autorización; decidir explícitamente si IDs son globales o scoped.

## 5. SOAP, AEAT, transporte y QR

<a id="rev-037"></a>

### REV-037 — El lote enviado no es el mensaje SOAP definido por el WSDL

**P0 · C-I · fases 5, 7.** Evidencia: `submissions/batch-builder.ts` devuelve un cuerpo `RegFactuSistemaFacturacion` sin Envelope, con namespace `...tikeV1.0/cont/ws/` que no coincide con el targetNamespace del XSD. `processQueueOnce` transmite esos bytes directamente. `transport/endpoints.ts` fija SOAPAction al nombre de operación, mientras `SistemaFacturacion.wsdl:44,53,65` declara `soapAction=""`; `buildSoapRequest` rechaza action vacío.

**Corrección:** derivar binding, operación, action y namespaces desde el WSDL fijado. Separar payload de operación y mensaje wire; construir Envelope exactamente una vez y calcular requestDigest sobre los bytes finales que se enviarán y persistirán. Permitir action vacío en el binding que lo exige, con representación HTTP revisada. Modelar cabecera, sistema y requerimiento en sus posiciones oficiales.

**Cierre:** servidor local captura cabeceras y bytes; compara fixtures oficiales, valida payload XSD y prueba 1/1.000 registros mixtos sin reordenación. **Riesgo:** envolver o canonicalizar XML firmado puede afectar namespaces; verificar firma después de construir el mensaje y mantener bytes de registros conservados.

<a id="rev-038"></a>

### REV-038 — La allowlist de endpoints es mutable a través de la API pública

**P0 · C-R · fases 7, 9.** Evidencia: `transport/endpoints.ts` congela el array, no sus objetos; `listAeatEndpoints` y `resolveAeatEndpoint` devuelven referencias internas. Se reprodujo modificar `url` mediante la lista y observarla cambiada en la resolución posterior. No se hizo ninguna conexión.

**Corrección:** congelar profundamente las entradas en construcción o devolver copias inmutables; resolver internamente por ID sobre constantes inaccesibles. Antes de conectar, exigir HTTPS, host/puerto/path admitidos y ausencia de credenciales/fragmento. Separar inyección de transporte de pruebas de la allowlist de producción.

**Cierre:** intentos de mutación no cambian resoluciones ni otros consumidores; URL arbitraria, HTTP, puerto alternativo, homógrafo y redirect fallan antes de conexión. **Riesgo:** el escenario confirmado requiere código llamante en el mismo proceso; no se afirma un exploit remoto por sí solo. Sigue rompiendo la garantía de configuración estable.

<a id="rev-039"></a>

### REV-039 — El parser de respuesta no sigue la estructura ni las identidades oficiales

**P0 · C-R/C-I · fase 7.** Evidencia: `transport/response.ts:42` busca `Estado`; el XSD fija `EstadoEnvio`. Se reprodujo rechazo del campo oficial. `parseSoapEnvelope` acepta nombres que terminan en `Envelope` sin namespace; búsquedas recursivas por localName permiten múltiples/nodos ajenos. `IDFactura` se convierte a texto concatenado y `Operacion` a string sin estructura.

**Corrección:** parsear SOAP namespace-aware con un único Body y payload esperado; validar respuesta por operación y edición. Representar IDFactura como terna tipada y conservar datos de presentación, CSV, duplicado, códigos y metadatos del intento. Validar cardinalidad, códigos y campos obligatorios con fuente oficial; lo desconocido no se asimila a una respuesta conocida.

**Cierre:** fixture completo del XSD, Envelope ajeno, Body duplicado, estados contradictorios, IDFactura parcial, operación desconocida, respuestas consulta/requerimiento y Fault. **Riesgo:** cambiar solo `Estado` por `EstadoEnvio` no arregla la clasificación ni el matching; véase REV-040.

<a id="rev-040"></a>

### REV-040 — La ausencia de una línea puede convertirse en aceptación del registro

**P0 · C-R · fase 7.** Evidencia: `application/process-queue.ts:applyResponseStates/statusToState` usa estado global si no encuentra `line.invoiceId === recordId`. Una respuesta sintética global `Correcto`, sin líneas, dejó el registro `accepted` y el reporte `completed:1`. El parser actual y el identificador opaco agravan la discrepancia.

**Corrección:** correlacionar por identidad fiscal completa, operación e intento persistidos; detectar líneas ausentes, extrañas, duplicadas y contradictorias. Clasificar cada registro exclusivamente con su evidencia suficiente. Estado global sirve como coherencia de lote, no como sustituto de línea. Conservar indeterminado/parcial y respuesta original; no aceptar códigos desconocidos por analogía.

**Cierre:** matriz global × líneas para todos los estados, cero líneas, una ausente entre 1.000, ID repetido y duplicado con distinta huella; ningún registro sin evidencia aparece aceptado. **Riesgo:** los casos oficiales de duplicado necesitan sus reglas específicas, no una regla simplista «duplicado=éxito».

<a id="rev-041"></a>

### REV-041 — No se respeta ni persiste `TiempoEsperaEnvio`

**P1 · C-I · fases 6–7.** Evidencia: el parser lee `waitSeconds`, pero `processQueueOnce` no lo utiliza y no hay estado de planificación por obligado/servicio. El retry genérico no implementa la espera inicial de 60 segundos ni las reglas del lote máximo.

**Corrección:** incorporar estado durable `nextAllowedSubmissionAt` y último tiempo válido por ámbito oficial; coordinarlo entre workers. Aplicar espera inicial y excepción del lote máximo exactamente según la fuente fijada. Separar rate limit normativo de backoff por fallo y tomar el máximo de restricciones aplicables. Validar el valor recibido contra el contrato, no un tope arbitrario sin trazabilidad.

**Cierre:** reloj falso con 59/60 segundos, respuesta que modifica espera, reinicio, dos workers, backlog de 999/1.000 y errores simultáneos. **Riesgo:** no medir solo desde comienzo local ni permitir que una respuesta tardía de intento viejo reduzca una restricción nueva.

<a id="rev-042"></a>

### REV-042 — Pérdida de respuesta tras posible entrega puede generar retry ciego

**P0 · C-I · fases 7, 9.** Evidencia: `node-https-transport.ts` devuelve `failure` por exceso de respuesta o error de stream después de enviar; `processQueueOnce` reintenta cualquier `!observation.ok`. `bytesWritten` solo se fija en el callback de escritura completa; una escritura parcial puede clasificarse como no enviada.

**Corrección:** devolver una observación de transporte que conserve siempre el grado de entrega: probado no enviado, entrega posible, respuesta completa. Desde que sea posible haber enviado bytes, fallo/timeout/aborto deja indeterminado salvo prueba protocolaria suficiente. Registrar el intento antes de iniciar red. Retry solo para causas clasificadas y seguras; después de posible entrega, reconciliar mismos bytes/identidad.

**Cierre:** TLS falla antes de enviar, socket corta durante escritura, respuesta truncada, límite excedido, HTTP no 2xx, timeout y aborto en cada frontera. **Riesgo:** `bytesWritten` de un socket no demuestra recepción ni aceptación remota; no prometer exactly-once sobre HTTP.

<a id="rev-043"></a>

### REV-043 — El adapter HTTPS tiene carreras de cancelación, ownership y límites incompletos

**P1 · C-I · fases 7, 9.** Evidencia: `node-https-transport.ts:send` comprueba señal antes de `await tls.agent`, pero añade el listener después sin recheck. Calcula digest antes del `await` y copia bytes para escribir después: el buffer puede cambiar. No limita el request y `maxResponseBytes` carece de máximo duro. Errores síncronos del request o de `now()` pueden escapar del ciclo normal de finalización.

**Corrección:** copiar y validar el request completo al entrar; usar una función de finalización exactamente una vez que cierre timer/listeners/streams. Revalidar señal tras cada espera, acotar selección TLS y request/response, comprobar `response.complete` y manejar `aborted/error/close`. Validar reloj y mapear excepciones sin perder grado de entrega.

**Cierre:** buffer mutado mientras se selecciona agent, abort durante provider, provider que no responde, respuesta sin end, socket reutilizado y agotamiento de límites; cero handles retenidos. **Riesgo:** no cerrar agents compartidos del host sin contrato de ownership; sí cerrar los recursos propios de cada intento.

<a id="rev-044"></a>

### REV-044 — La política TLS no está probada en la frontera del provider

**P1 · C-I/V · fases 5, 7, 9.** Evidencia: `AeatTlsProvider` entrega un `https.Agent` arbitrario; el adapter fija hostname/servername, pero no verifica que el provider mantenga validación de CA/hostname, certificado y política de proxy. Un provider puede alterar esas garantías; no se encontró una suite local mTLS que las demuestre.

**Corrección:** especificar contrato de provider de confianza y capacidades; preferir opciones TLS validadas y una fábrica de transporte que no permita desactivar controles por accidente. Verificar correspondencia del certificado con el ID solicitado y permiso por entorno. Crear harness local con CA sintética, certificado cliente y servidor controlados; probar proxy/DNS según responsabilidad explícita del host.

**Cierre:** CA no confiable, hostname incorrecto, certificado cliente ausente/caducado/equivocado y TLS inferior al mínimo no envían registros. **Riesgo:** un host malicioso ya controla el proceso; describir la frontera con honestidad, sin afirmar aislamiento criptográfico frente al propio host.

<a id="rev-045"></a>

### REV-045 — QR no distingue modalidad y su representación gráfica es incorrecta

**P1 · C-R/C-I · fase 5.** Evidencia: `qr/index.ts`, especialmente SVG en línea 72. No hay modalidad ni URL `ValidarQRNoVerifactu`; `viewBox` tiene tres valores (`0 57 57` reproducido) en vez de cuatro. Los milímetros de zona quieta se suman como módulos y el fondo es transparente, sin garantizar blanco.

**Corrección:** incorporar modalidad al contrato y derivar URL/leyenda; definir por separado tamaño del símbolo, margen físico y unidades SVG. Usar `viewBox="0 0 W H"`, fondo blanco y escala calculada para respetar 30–40 mm y margen mínimo/recomendado. Validar números finitos y máximos. La factura del host debe colocar leyendas y URL estructurada según modalidad.

**Cierre:** decodificador independiente recupera payload exacto a los tamaños extremos, impresión sobre fondos distintos, margen medido en mm, ambas modalidades/entornos. **Riesgo:** no corregir a ciegas solo el viewBox: mantener interpretación de dimensiones y colocación conforme a la especificación fijada.

<a id="rev-046"></a>

### REV-046 — El contenido QR admite fechas imposibles y rechaza importes negativos

**P1 · C-R/C-I · fase 5.** Evidencia: `buildQrPayload` solo aplica regex a fecha y una regex sin signo a importe; se reprodujo aceptación de `99-99-2026`. El validador de dominio admite importes negativos y el contrato QR exige probarlos. Un entorno runtime inválido puede interpolar `undefined` como endpoint.

**Corrección:** reutilizar validadores de fecha, importe y entorno cerrados, manteniendo el lexema oficial autorizado. Confrontar codificación de espacios/reservados de `URLSearchParams` con golden URLs de AEAT; no declarar incorrecto el signo `+` solo por preferencia estética. Validar correspondencia del QR con el registro final y no con otro DTO independiente.

**Cierre:** importes positivos, negativos y cero con escalas válidas, fecha bisiesta/imposible, todos los ASCII permitidos, entorno inválido y payload manipulado. **Riesgo:** no imponer checksum de NIF ni restricciones fiscales adicionales sin fuente; distinguir formato local de validación censal externa.

## 6. CLI, formatos de intercambio e I/O

<a id="rev-047"></a>

### REV-047 — La gramática rechaza los comandos de construcción/verificación documentados

**P1 · C-R · fases 8–9.** Evidencia: `packages/cli/src/cli.ts:dispatch` exige longitud 4 para `record alta build/verify` y longitud 3 para `event build/verify`, cuando las gramáticas tienen 3 y 2 tokens. Un token extra no se valida. La reproducción de `record alta build` devuelve código 2; añadir `extra` alcanza la construcción.

**Corrección:** reemplazar condiciones dispersas por una tabla declarativa de comandos, aridad exacta, argumentos y opciones permitidos. No consumir stdin ni abrir output antes de validar el uso. Derivar ayuda y pruebas desde la gramática revisada, con oráculos independientes para el comportamiento.

**Cierre:** cada comando normativo tiene caso positivo y uno por token ausente/sobrante; versiones con `--input`, `--output`, flags y orden soportado. **Riesgo:** no considerar los tests que solo verifican `version` como cobertura de la CLI; añadir pruebas de procesos reales y stdin cerrado.

<a id="rev-048"></a>

### REV-048 — Los DTO de artefactos no son serializables ni permiten round-trip

**P1 · C-R · fase 8.** Evidencia: `cli.ts:serializeArtifact` convierte solo `bytes` a base64 y propaga `validated` con `DecimalLexeme.coefficient: bigint`; se reprodujo `Do not know how to serialize a BigInt`. `verifyArtifact` no deserializa bytes base64 a `Uint8Array`; `parseStoredRecords` pasa strings base64 a un helper que las interpreta como texto UTF-8. Los lotes se escriben con arrays tipados sin codec explícito.

**Corrección:** definir DTO JSON versionado por operación, con strings decimales, bytes base64 canónico, enums y metadatos explícitos. Escribir encode/decode simétricos y validarlos mediante schemas. No serializar value objects ni usar un replacer global de BigInt como sustituto de diseño. Separar entrada XML textual de entrada base64 sin adivinar formato.

**Cierre:** API → JSON → CLI verify y CLI build → CLI verify; artefactos firmados, eventos, submission y export. Rechazar base64 no canónico, campos desconocidos y versiones incompatibles. **Riesgo:** preservar lexemas y bytes exactos; migrar formato de desarrollo y fixtures sin redefinir un schema estable.

<a id="rev-049"></a>

### REV-049 — `vectors verify` y `sources verify` anuncian comprobaciones que no ejecutan

**P0 · C-R/C-I · fase 8.** Evidencia: `cli.ts:dispatch`: vectores devuelve `{ok:true}` y fuentes devuelve el digest embebido. No abre, recuenta ni valida archivos. `schema print` solo expone el schema del manifiesto de contratos, no los schemas de entradas/salidas prometidos.

**Corrección:** implementar comandos que verifiquen los recursos distribuidos contra inventario exacto y ejecuten vectores con resultados esperados, incluyendo negativos. Informar versión, bundle, cantidad y digest comprobados; archivo ausente/corrupto debe fallar. Si se mantiene una operación de mera información, darle otro nombre y no sustituir la verificación normativa. Distribuir schemas de los DTO reales.

**Cierre:** tarball instalado con vector/fuente alterados o ausentes falla; corpus vacío no pasa; los resultados se pueden verificar fuera del workspace. **Riesgo:** no descargar fuentes implícitamente para poder decir «verificado»; trabajar con bundle fijado y red solo por operación explícita.

<a id="rev-050"></a>

### REV-050 — Los comandos con providers y stores no tienen camino de ejecución

**P1 · C-I · fase 8.** Evidencia: `cli.ts:dispatch` devuelve siempre `VF_INPUT_REQUIRED` para queue/export/signature, aunque se entreguen descriptores. No hay resolución de `--provider`/`--store`; `createCliApi` fija modalidad y scope `cli`.

**Corrección:** definir descriptores cerrados y un registro explícito de adapters admitidos; resolver capacidades, validar configuración y crear la instancia con modalidad/edición/contexto correctos. Implementar comandos sobre API pública, sin eval, import arbitrario de código no confiable ni secretos en argumentos. Providers no configurados siguen fallando, pero los configurados deben funcionar.

**Cierre:** cada comando con adapter sintético válido e inválido; certificado/store equivocado, falta de capacidad, timeout y aislamiento. **Riesgo:** el descriptor es una frontera de ejecución y secretos; no convertirlo en URL de código remoto o acceso libre al filesystem. El host es responsable de autorizar sus adapters.

<a id="rev-051"></a>

### REV-051 — La CLI no procesa NDJSON como stream ni cancela las operaciones

**P1 · C-I · fases 8–9.** Evidencia: existe `parseNdjson`, pero `readInput` siempre acumula un documento y usa `parseJsonDocument`; ficheros se leen enteros mediante `readFile` antes del límite. `main.ts` no conecta SIGINT/SIGTERM ni `--timeout-ms` con `AbortSignal`. Las rutas queue/export tampoco producen stream operativo.

**Corrección:** seleccionar formato de entrada explícito por contrato y conectar parser incremental al pipeline con backpressure. Limitar bytes antes de asignarlos para ficheros y stdin, comprobar tipo de archivo y cerrar el iterador. Propagar señal de cancelación y timeout; producir manifiesto incompleto cuando se interrumpa un stream. Acotar registros pendientes y memoria independientemente de la longitud total.

**Cierre:** chunking arbitrario de UTF-8/CRLF, primer resultado antes de EOF, fichero mayor que RAM permitida, consumidor lento, SIGINT y error en línea N. **Riesgo:** no deducir completitud de EOF ni convertir múltiples documentos JSON concatenados en un contrato ambiguo.

<a id="rev-052"></a>

### REV-052 — El parser JSON convierte números inseguros y no valida Unicode escapado

**P1 · C-R/C-I · fases 8–9.** Evidencia: `io/json-input.ts:parseNumber` solo exige número finito; `9007199254740993` se reprodujo como `9007199254740992`. `parseString` delega en `JSON.parse`, que permite sustitutos aislados escapados. El límite de propiedades es por objeto, sin presupuesto global de nodos/strings/diagnósticos.

**Corrección:** fijar política de números del DTO: importes siempre strings; enteros de control seguros; fracciones solo donde el schema las admita y sin fingir conservación decimal exacta. Rechazar enteros que perderían precisión y Unicode mal formado tras desescape. Aplicar límites globales e individuales durante parsing y validar también las claves. Mantener detección de duplicados después de desescape y protección de prototipo.

**Cierre:** enteros límite, exponentes, `-0` según contrato, sustitutos válidos/aislados, claves equivalentes por escape y árboles anchos. **Riesgo:** no prohibir toda fracción JSON si forma parte de un contrato legítimo; exigir la política explícita por campo.

<a id="rev-053"></a>

### REV-053 — La escritura «sin sobrescribir» tiene una carrera entre comprobación y rename

**P1 · C-I · fases 8–9.** Evidencia: `io/output.ts:openWriter/ensure/FileWriter.close` hace `lstat(target)` y después `rename(temp,target)`. Otro proceso puede crear el destino entre ambos; en sistemas donde rename reemplaza, se sobrescribe sin `--force`. Solo se examina el componente final, y el temporal usa un nombre predecible por PID.

**Corrección:** crear temporal privado único en directorio autorizado y fijar semántica de publicación no-clobber atómica por plataforma. Usar primitivas que no reemplacen un destino nuevo cuando `force=false`; si no existen garantías equivalentes, fallar de manera explícita. Resolver política de symlinks en padres, directorios compartidos y tipo de destino. Sincronizar archivo y directorio cuando se prometa durabilidad.

**Cierre:** crear destino entre check y publish, symlink final/padre, archivo existente, directorio, dispositivo, crash y ejecución concurrente en Linux/Windows/macOS. **Riesgo:** rename atómico no equivale a durable ni a no-clobber; documentar las garantías realmente disponibles por filesystem.

<a id="rev-054"></a>

### REV-054 — Los writers no manejan toda la semántica de escritura y error

**P1 · C-I · fases 8–9.** Evidencia: `FileWriter.write` ignora `bytesWritten`; los helpers `write` de CLI esperan solo `drain`, y `StreamWriter` instala listener de error únicamente si `write` devuelve false. `close` no garantiza limpieza del temporal si falla sync/rename. Un resultado funcional inválido borra salida de fichero aunque contenga diagnósticos útiles.

**Corrección:** escribir hasta completar todos los bytes, centralizar manejo de error/EPIPE/close/drain con cleanup exactamente una vez y contrato claro para resultados inválidos. Separar completitud de escritura de validez fiscal: un informe completo que explica invalidez puede publicarse si así define el comando. Gestionar permisos, temporales y fallos de disco sin filtrar rutas sensibles innecesarias.

**Cierre:** short write simulado, disco lleno, stream cerrado con write=true/false, fallo de rename, resultado inválido completo y aborto parcial. **Riesgo:** no convertir EPIPE silenciosamente en éxito para comandos donde perder salida equivale a perder evidencia.

<a id="rev-055"></a>

### REV-055 — Opciones, versión, ayuda y códigos de salida no cumplen el contrato

**P1 · C-R/C-I · fase 8.** Evidencia: `parseArgs` acepta flags desconocidos/repetidos y no implementa `--json`; se reprodujo `version --typo x` con éxito y doble `--format` aceptado. `quiet`, `edition` y timeout se ignoran. `version` devuelve edición normativa, `human` solo el nombre de operación, ayuda no describe uso. `exitCode` asigna 3 a errores de parsing, 6 a OUTPUT_EXISTS y 2 a defectos internos, en conflicto con la tabla normativa.

**Corrección:** tabla de opciones por comando y validación exacta; versionar paquete/protocolo/edición por separado. Implementar ayuda informativa y formato humano con resultado/diagnóstico saneado. Centralizar mapeo de uso, inválido, indeterminado, aborto, I/O, incompatible e interno. No imprimir `error.message` externo sin saneamiento.

**Cierre:** matriz de flags/códigos y stdout/stderr; versión igual al manifiesto instalado, `--json`, `--quiet`, edición desconocida y timeout efectivo. **Riesgo:** actualizar tests que actualmente institucionalizan un código erróneo; no preservar el bug por comodidad.

## 7. Calidad, pruebas, rendimiento y recuperación

<a id="rev-056"></a>

### REV-056 — La cobertura obligatoria mide únicamente el archivo de exports

**P0 · C-I · fases 2, 9.** Evidencia: [package.json](../../package.json), script `test:coverage`, línea 55: `--test-coverage-include='packages/verifactu/dist/esm/index.js'`. Quedan fuera dominio, API, adapters, XML, transporte, CLI y kit. El 98/95 configurado no acredita esa implementación.

**Corrección:** ejecutar cobertura por paquete sobre todos sus módulos realmente instrumentados, incluyendo archivos no cargados; distinguir fuente compilada por tests de `dist` para no medir otro árbol. Excluir únicamente generados/declaraciones/fixtures con justificación registrada. Impedir cobertura vacía y publicar denominadores, módulos y ramas. Mantener 98% líneas/funciones y 95% ramas según política; decidir umbrales separados de CLI/kit explícitamente, sin reducir el existente a escondidas.

**Cierre:** un módulo nuevo sin tests reduce cobertura o falla; alterar una rama crítica de cada paquete es detectado; informe incluye rutas reales. **Riesgo:** la primera medición honesta será inferior: eso es trabajo pendiente, no motivo para ampliar exclusiones.

<a id="rev-057"></a>

### REV-057 — Los scripts denominados «mutación» no ejecutan mutantes de código

**P0 · C-I · fases 4, 6–7, 9.** Evidencia: `check-mutations-phase4.mjs`, `check-mutations-phase6-7.mjs`, `check-mutation-phase9.mjs`. Las pruebas alteran inputs o comprueban invariantes; fase 9 imprime literalmente `{criticalMutants:12,killed:12,globalScore:1}` en línea 54.

**Corrección:** conservar esas pruebas como negativos/properties con nombres honestos; implantar mutación real del código en copias aisladas. Inventariar operador, ubicación, requisito crítico, compilación válida, prueba que mata y motivo de supervivencia. Diferenciar build inválido, timeout y muerte por aserción. Exigir 100% de críticos y ≥95% global; equivalentes solo con demostración revisada. Reutilizar ideas del motor, corrigiendo cualquier criterio que cuente fallo de compilación como prueba funcional.

**Cierre:** mutantes de huella, XSD, firma, contexto, CAS, outbox, respuesta ausente, límite y redacción mueren por tests; reportes contienen IDs y resultados calculados. **Riesgo:** el catálogo crítico debe cubrir funcionalidad nueva y evitar porcentajes perfectos de una selección trivial.

<a id="rev-058"></a>

### REV-058 — El job de presupuestos no mide ni impone P-01..P-12

**P0 · C-I · fases 2, 9.** Evidencia: `benchmark-phase9.mjs`, `.github/workflows/performance.yml`. Mide huella de input ya validado y SVG QR, no el pipeline P-01 ni contenido QR P-03. Solo impone 10.000 huellas/s si `NOEOS_BENCH_OFFICIAL=1`, que el job no establece. No hay runner dedicado de repositorio ni baselines revisadas.

**Corrección:** implementar doce escenarios fieles a los presupuestos, con validación de resultados, fixture 900–1.100 bytes, warmup, muestras repetidas y percentiles. Separar smoke portable de gate oficial en hardware/perfil fijados, registrar CPU/RAM/OS/Node/commit/configuración y baseline. Asegurar runners de confianza sin ejecutar PR ajenas con privilegios. Validar env numéricas para impedir cero iteraciones por `NaN`.

**Cierre:** todos los gates de la tabla de la sección 11, controles que fallan al introducir regresión y evidencia conservada. **Riesgo:** no comparar SVG/s con contenido QR/s ni bajar validación para mejorar resultados; ruido de runner alojado no justifica un claim de rendimiento oficial.

<a id="rev-059"></a>

### REV-059 — El fuzzing puede tragarse defectos y cubre pocos objetivos semánticos

**P1 · C-I · fase 9.** Evidencia: `fuzz-phase9.mjs` captura cualquier excepción de JSON; genera seis formas, XML escapado deliberadamente válido, QR de plantilla y huella constante. `NOEOS_FUZZ_MS=NaN` deja el bucle sin iteraciones. No prueba XSD, XAdES, respuestas, estados, outbox ni NDJSON completo como exige el plan.

**Corrección:** corpus y generadores por frontera con oráculo de aceptado/rechazado/indeterminado; solo capturar errores de input esperados, todo error inesperado falla. Validar duración/seed/iteraciones y mínimo de ejercicios por objetivo. Añadir shrinking, fixture minimizado y ejecución por proceso con watchdog para hangs. Semillas fijas en CI y campaña ampliada con seeds registradas.

**Cierre:** el fuzz detecta sustituto inválido, límite desactivado, respuesta parcial aceptada y excepción artificial; todos los objetivos obligatorios se ejecutan. **Riesgo:** más tiempo sobre la misma plantilla no equivale a más cobertura; evitar corpus con datos fiscales reales.

<a id="rev-060"></a>

### REV-060 — Stress y recovery no prueban streaming ni reinicio durable

**P0 · C-I · fase 9.** Evidencia: `stress-phase9.mjs` repite huella y exige `after.rss >= before.rss`, sin techo de memoria; una liberación de memoria podría hacerlo fallar. `recovery-drill-phase9.mjs` usa stores en memoria, altera un array independiente y lee un registro inexistente; imprime cuatro nombres de crash sin provocar esos cortes.

**Corrección:** medir streams reales y pendientes internas, consumo en intervalos y pendiente RSS. Para recuperación, usar un host fixture durable temporal con fault injection y procesos separados; matar/reiniciar en fronteras de transacción, firma, lease, envío y respuesta. Inspeccionar estado después de reconstruir adapters desde almacenamiento. No vender el adapter en memoria como almacenamiento de producción.

**Cierre:** 1 GiB, 10 millones de registros y crash matrix de sección 10; corrupción de backup/ancla y pérdida de respuesta se detectan; informes contienen ejecución por escenario. **Riesgo:** SIGKILL no simula todos los fallos eléctricos de filesystem: declarar esa frontera y verificar fsync/transacción donde se promete durabilidad.

<a id="rev-061"></a>

### REV-061 — El adapter kit aprueba sin adapters y ensaya invariantes insuficientes

**P0 · C-R/C-I · fase 8.** Evidencia: `packages/adapter-kit/src/index.ts`. `adapter.identity` siempre pasa, por lo que `{name,version}` obtiene `status:'passed'` aun con todos los escenarios funcionales `not-applicable`: reproducido. El test de atomicidad no provoca fallo parcial; el de idempotencia comprueba completar con lease vacío. Comparte IDs fijos y un head inicial incoherente.

**Corrección:** declarar capacidades reclamadas y exigir escenarios por capability; sin capacidades probadas, resultado no aplicable. Recibir factories aisladas, lifecycle y hooks de fallos/reinicio. Cubrir atomicidad factura+registro+outbox, CAS, ownership, fencing, retry, tiempos, estados, aislamiento, backup y exportación. Retornar status fallido de forma imposible de confundir con conformidad.

**Cierre:** adapters deliberadamente rotos fallan en el escenario correspondiente; correr dos veces no colisiona; falta de adapter jamás obtiene certificado de conformidad. **Riesgo:** el kit escribe datos de ensayo: exigir entorno descartable y nunca ejecutarlo contra stores productivos sin aislamiento.

<a id="rev-062"></a>

### REV-062 — Las pruebas existentes replican supuestos erróneos y faltan oráculos independientes

**P1 · C-I · fases 4–9.** Evidencia: `phase5.unit.test.ts` acepta falsa XAdES; `phase6-7.unit.test.ts` construye respuesta con `Estado` e IDs simplificados; e2e CLI invoca `runCli` en memoria y cubre sobre todo versión/schema/error. `tools/reference/rrsif.py` verifica altas/anulaciones, no eventos; hay tres vectores de huella. Existen properties útiles, pero no prueban todo el pipeline.

**Corrección:** introducir fixtures completos procedentes de las fuentes fijadas y datos sintéticos revisados; referencia independiente para huella de eventos y bytes/envelopes de integración. Pruebas diferenciales XSD/firma/QR con backends distintos. Probar binario empaquetado en procesos reales y ESM/CJS con consumidores limpios. Mantener propiedades algebraicas además de ejemplos.

**Cierre:** cada reproducción de sección 9 se convierte en regresión que falla en el commit base y pasa tras su arreglo. **Riesgo:** fixtures generados por la misma función probada no son oráculos independientes; no actualizar snapshots automáticamente para acomodar resultados erróneos.

<a id="rev-063"></a>

### REV-063 — Trazabilidad y cierres documentales no están unidos a evidencia ejecutada

**P0 · C-I · fases 1–3, 9.** Evidencia: `check-contract-traceability.mjs` comprueba archivos y requisitos no vacíos; `check-rule-catalog` comprueba rutas de tests. No exige todas las obligaciones de la matriz ni sabe si la prueba citada se ejecutó. Roadmap fase 9 pendiente y documentos de cierre completados discrepan.

**Corrección:** convertir la matriz en fuente verificable de IDs requisito→regla/nodo→implementación→test→job→artefacto/commit, preservando un único origen de datos. Exigir cardinalidad y cobertura de positivos/negativos aplicables; distinguir implementación, evidencia local y validación externa. Marcar cierres previos afectados como reabiertos o no acreditados, conservando fecha histórica y motivo. No eliminar requisitos para mejorar porcentajes.

**Cierre:** cada fila de la sección 12 tiene cobertura justificable; un requisito sin test, un test sin ejecución o evidencia de otro SHA bloquea cierre. **Riesgo:** la trazabilidad por nombre no prueba semántica; necesita revisión humana y pruebas de mutación que validen su utilidad.

<a id="rev-064"></a>

### REV-064 — Los controles de seguridad buscan palabras en vez de demostrar las fronteras

**P1 · C-I · fases 2, 9.** Evidencia: `check-security-boundaries.mjs` busca literales `DOCTYPE`, `ENTITY`, HTTPS, `0o600` y `rename(`; regex de shell no detecta imports nombrados ni llamadas indirectas. Presencia de esos textos hace pasar el check aunque la validación no se ejecute.

**Corrección:** establecer grafo de imports permitido por capa con análisis sintáctico, controles de dependencias/capacidades y pruebas adversariales efectivas. Verificar ausencia de red/reloj/random/fs en núcleo y permiso explícito en adapters/CLI. Añadir pruebas de redacción, límites, rutas, TLS, ownership y cancelación. Incluir los scripts críticos en lint/análisis apropiado.

**Cierre:** inyectar red en dominio, desactivar rechazo XML, omitir TLS o permisos y emitir dato sensible hace fallar el gate correspondiente. **Riesgo:** ningún análisis estático general demuestra por sí solo seguridad fiscal; CodeQL y pruebas específicas deben complementarse.

## 8. Paquetes, suministro, gobierno y GitHub

<a id="rev-065"></a>

### REV-065 — `pack:check` no examina el contenido de los tarballs

**P1 · C-I · fases 2, 8–9.** Evidencia: `scripts/check-packages.mjs` comprueba tres archivos `dist` y que los package.json sean JSON. No verifica exports, archivos permitidos, tipos, permisos del binario, secretos, fuentes regulatorias, licencias ni dependencias del paquete distribuido.

**Corrección:** empaquetar los tres workspaces con scripts deshabilitados y validar un inventario exacto por paquete. Comprobar resolución de todos los exports, tipos, bin, versión, dependencias exactas, LICENSE/NOTICE, schemas/vectores y exclusión de fuentes privadas, temporales y tests. Verificar symlinks, rutas de tar y tamaño máximo. Ejecutar pruebas de consumo sobre esos mismos bytes.

**Cierre:** archivo indebido, export roto, licencia ausente, adapter kit omitido o dependencia workspace no resoluble hacen fallar el gate. **Riesgo:** no exigir publicación ni quitar `private` para hacer `npm pack`; esto es evidencia local de fases anteriores a release.

<a id="rev-066"></a>

### REV-066 — «Clean consumers» importa archivos del workspace, no paquetes instalados

**P1 · C-I · fases 2, 8–9.** Evidencia: `scripts/check-consumers.mjs` importa rutas absolutas a dist y compara exports. La resolución puede aprovechar dependencias hoisted y ocultar defectos del tarball. Importa el `main` ejecutable de CLI, que imprime resultado y modifica `process.exitCode`.

**Corrección:** crear proyectos temporales fuera del monorepo, instalar tarballs de los tres paquetes sin lifecycle scripts y sin acceso accidental al workspace. Comprobar API por exports públicos, ESM/CJS donde se prometen, declaraciones TypeScript y CLI como binario. Probar instalación de producción y directorios con espacios/caracteres no ASCII mediante URLs de fichero correctas. Usar el engine publicado fijado, no su checkout vecino.

**Cierre:** falta de una dependencia de runtime o archivo de dist falla fuera del repo; ninguna importación de biblioteca dispara CLI. **Riesgo:** instalación con red introduce variación; fijar artefactos y registrar integridades para distinguir problema de paquete de indisponibilidad del registry.

<a id="rev-067"></a>

### REV-067 — Reproducibilidad solo compara dos empaquetados del mismo build y omite adapter kit

**P1 · C-I · fases 2, 8–9.** Evidencia: `check-reproducibility.mjs` ejecuta dos `npm pack` sobre dist existente para biblioteca y CLI. No reconstruye ni compara generación de contratos, declaraciones o kit.

**Corrección:** dos checkouts/copias limpias del mismo SHA, dependencias con integridad fijada y toolchain primaria; generar contratos, compilar, empaquetar los tres productos e inventariar contenido y digests. Controlar TZ, locale, timestamps y rutas de salida. Comparar cada archivo y los tarballs finales, conservando diff explicativo si divergen.

**Cierre:** timestamp/ruta aleatoria inyectada en generador o build rompe el check; todos los paquetes coinciden byte a byte. **Riesgo:** comparar dos directorios que comparten un dist contaminado vuelve a producir un falso positivo. La reproducibilidad no valida el contenido fiscal; requiere los demás gates.

<a id="rev-068"></a>

### REV-068 — Los archivos llamados SBOM no cumplen las estructuras anunciadas

**P1 · C-I · fases 2, 9.** Evidencia: `generate-sbom.mjs` construye objetos mínimos; componentes CycloneDX sin los campos requeridos del modelo, y supuesto SPDX 3.0.1 con forma `spdxVersion/name/packages` ajena al grafo SPDX 3. Hay schemas y herramienta admitida que no se usan para validación.

**Corrección:** generar CycloneDX 1.7 y SPDX 3.0.1 con implementación/versiones admitidas, identificadores, relaciones, hashes, licencias y distinción build/runtime. Validar contra schemas oficiales fijados offline; rechazar referencias colgantes, componentes sin identidad y ausencia de paquetes de workspace. Usar evidencia reproducible con fecha/origen explícitos y atar SBOM al lock y a cada tarball.

**Cierre:** ambos formatos pasan validadores independientes; eliminación de relación/licencia/hash requerida falla; biblioteca, CLI y kit están presentes. **Riesgo:** no inventar licencias desconocidas ni confundir SPDX 2 con 3; revisar reutilización de fuentes AEAT y del backend DSS separadamente.

<a id="rev-069"></a>

### REV-069 — El control de licencias no analiza dependencias ni atribución distribuida

**P1 · C-I · fases 1–2, 9.** Evidencia: `check-licenses.mjs` comprueba cinco rutas y cabecera SPDX en dos archivos; no recorre dependencias transitivas, licencia del adapter kit, textos de fuentes o contenidos empaquetados. Dependency Review solo analiza diferencias de PR y una denylist; no sustituye inventario completo.

**Corrección:** inventariar licencias SPDX y textos de todas las dependencias efectivas y artefactos redistribuidos. Definir política de admisión por uso y excepciones revisadas; desconocidos fallan cerrado. Verificar LICENSE/NOTICE dentro de cada tarball y separación entre código Apache-2.0, materiales AEAT y herramientas externas. Mantener atribuciones al reutilizar código del motor.

**Cierre:** dependencia nueva/desconocida, licencia incompatible según política o NOTICE omitido rompe el gate; evidencia identifica versión y archivo. **Riesgo:** obligaciones de LGPL/DSS dependen de la forma real de integración/distribución; no deducirlas solo del nombre de la licencia ni emitir una conclusión jurídica automática.

<a id="rev-070"></a>

### REV-070 — El inventario de dependencias está desactualizado y las políticas no detectan el drift

**P1 · C-R/C-I · fases 2, 5, 9.** Evidencia: digest declarado del lock `d07c9361e95e8eea1b5cbc777a3bc9a856dc9ea106f15589d8c2ec710f0870dd`; SHA-256 calculado del lock actual `27ed8ae47f6539a5de1b67365a852db95a42d1101734348ec976008bfe69ed83`. `check-policies.mjs` solo comprueba forma hexadecimal. Admisión trata xmldom como no runtime, omite qrcode/@types/qrcode y no se contrasta exhaustivamente con manifests. Adapter kit queda fuera de diversas comprobaciones.

**Corrección:** generar inventario desde lock efectivo y confrontar cada dependencia directa/transitiva según política con versión, integridad, licencia y uso real. Validar admisiones, todos los workspaces, scripts lifecycle y fuentes permitidas; comprobar hash real, no regex. Las actualizaciones de Dependabot deben regenerar evidencia mediante un flujo revisado. Endurecer también el parseo exacto de `allowed-signers`, evitando aceptar líneas adicionales mediante una regex de prefijo.

**Cierre:** cambiar lock sin inventario falla; dependencia sin admisión, versión no exacta, runtime mal clasificado o firmante extra falla. **Riesgo:** no «aprobar» automáticamente una dependencia porque aparece en el lock; separar generación mecánica de aceptación humana.

<a id="rev-071"></a>

### REV-071 — La verificación de toolchain de referencia no ejecuta Python y el wrapper npm no verifica todo

**P1 · C-I · fase 2.** Evidencia: `check-reference-toolchain.mjs` compara una variable opcional y anuncia la versión esperada sin consultar `python3`; el wrapper npm valida Node y ruta bundled, pero no vuelve a contrastar versión/integridad de npm. CI sí fija Python mediante setup-python y ejecuta check Node/npm previo: son controles existentes, no evidencia del checker defectuoso.

**Corrección:** invocar el ejecutable de referencia con opción aislada de versión y comparar resultado; resolver ruta permitida y rechazar shadowing cuando corresponda. Integrar validación Node/npm en el wrapper para que su nombre sea cierto también fuera de CI. Mantener fuentes y checksums de perfiles, flags de instalación y prueba en Windows/Linux/macOS.

**Cierre:** Python incorrecto sin variable, npm distinto junto al Node correcto y perfil desconocido fallan; versión permitida pasa. **Riesgo:** no actualizar toolchains como parte incidental de otra corrección; las reproducciones de este informe no habilitan sustituir el primario por Node 24.19.0.

<a id="rev-072"></a>

### REV-072 — Organización de módulos, exports y build dificultan aislar garantías y costes

**P2 · C-I/V · fases 2, 8–9.** Evidencia: `generated/edition.ts` pesa 687.110 bytes y mezcla metadatos y catálogos; el barrel principal importa metadatos de ese módulo. Hay contratos duplicados de `Lease`, reexports `public.ts`, tipos públicos con condicionales innecesarios y métodos artificialmente async. CLI declara `sideEffects:false` aunque importar su entrypoint ejecuta el programa. El build recompila repetidamente dentro de scripts y no tiene protección de concurrencia.

**Corrección:** separar metadatos mínimos de catálogos pesados en el generador; conservar exports públicos mediante fachadas estables. Unificar tipos de protocolo/lease y aislar entrada CLI de `runCli` importable. Revisar `sideEffects` según cada entrypoint. Organizar tests por capacidad, mantener wrappers solo si sirven a exports y no mover por estética. Orquestar build único por conjunto de gates o workspaces temporales aislados.

**Cierre:** grafo de dependencias y API reports por superficie pública, imports sin efectos, builds concurrentes seguros, startup/RSS medidos antes/después. **Riesgo:** el tamaño solo señala coste potencial; no se afirma incumplimiento de latencia sin medición. No romper paths públicos para mejorar organización.

<a id="rev-073"></a>

### REV-073 — DCO y gobierno no comprueban todas las condiciones que anuncian

**P1 · C-I · fase 2.** Evidencia: `check-governance.mjs` solo valida raíz. `check-dco.mjs` acepta una línea exacta en cualquier lugar del mensaje, no exige trailer final ni valida coautores; si faltan variables termina con éxito. En CI el check está condicionado a PR, pero el script no distingue ausencia esperada de configuración rota dentro de PR.

**Corrección:** validar gobierno real: roles, CODEOWNERS existentes, procedimiento de cambios y coherencia de políticas. Parsear trailers Git, autor/coautores y excepciones de bots explícitas; validar SHA/rango y fallar si un evento que exige DCO carece de configuración. Comprobar firma de commits y firma del tag en controles separados; DCO no es prueba de firma criptográfica.

**Cierre:** texto de ejemplo fuera de trailers, coautor sin signoff, rango vacío inesperado y bot no admitido fallan. **Riesgo:** no exigir falsos signoffs a bots ni fabricar aprobación humana; política de atribución debe respetar la contribución real.

<a id="rev-074"></a>

### REV-074 — Claims y documentación de cierre necesitan reconciliación con la implementación

**P1 · C-I · fases 1–9.** Evidencia: roadmap, cierres, documentos de implementación y hardening describen capacidades completas que los hallazgos anteriores contradicen; CLI fase 8 usa incluso otro nombre de binario. El perfil público fundacional de la organización presenta un papel regulatorio del motor que no coincide con su frontera genérica actual. `check-docs` valida encabezados y rutas, no esas contradicciones.

**Corrección:** después de cada arreglo, actualizar contrato, ADR, tests y evidencia juntos. Preservar registro histórico de qué cierre fue revisado y por qué. Crear vocabulario único de «implementado», «verificado localmente», «validado externamente» y «publicado». Corregir READMEs/ejemplos para que se ejecuten como tests; coordinar cambios de perfil organizativo fuera de este documento cuando se autoricen.

**Cierre:** ningún claim de completitud o conformidad carece de alcance, versión y prueba; todos los ejemplos ejecutan la API/CLI actual. **Riesgo:** no usar una rebaja documental para eliminar funcionalidad comprometida de fases 1–9 ni adelantar la declaración responsable de fase 11.

<a id="rev-075"></a>

### REV-075 — GitHub no exige pinning SHA aunque la política local lo declara

**P1 · C-I · fase 2.** Evidencia viva: `GET repos/noeos/verifactu/actions/permissions` devuelve `sha_pinning_required:false`; `security/github-settings.json` declara true. Las Actions usadas actualmente sí están fijadas a SHA: el defecto es la ausencia de enforcement y de comparación, no un ref mutable encontrado en los workflows actuales.

**Corrección:** activar la exigencia de SHA en la política efectiva de Actions del repositorio y, cuando se pueda verificar, en la organización según la política común. Mantener allowlist de terceros y comprobar cada `uses` con parseo YAML, SHA completo e inventario de procedencia. Añadir la comparación explícita del campo al auditor.

**Cierre:** GET devuelve true y coincide con snapshot; una PR con Action por tag falla aunque se añada ese tag al inventario local. **Riesgo:** comprobar compatibilidad de referencias locales/reusable workflows antes de activar; no sustituir SHA por versión textual para satisfacer Dependabot.

<a id="rev-076"></a>

### REV-076 — El auditor GitHub omite campos y puede declarar verificada una configuración distinta

**P1 · C-I · fase 2.** Evidencia: `scripts/audit-github.mjs` no compara sha pinning, bypass de main, exclusiones de refs, protección clásica, productor de checks, todo el conjunto de políticas de entornos ni superficie privada/organización. Comprueba que exista un patrón de despliegue, no que no existan otros. Usa listas sin paginación general y no separa inaccesible de ausente. Confunde alertas Dependabot con security updates.

**Corrección:** definir schema de estado deseado con invariantes y un recolector GET paginado; normalizar y comparar cada propiedad, incluyendo reglas heredadas, restricciones extra y listas completas. Producir `pass/fail/unverified/not-applicable` con endpoint, fecha y motivo. Tratar conteos de alertas como estado operativo variable, no constantes de conformidad. Añadir fixtures del API con drift por campo y permiso denegado.

**Cierre:** quitar enforcement, añadir bypass/patrón, cambiar app de check o denegar permiso nunca produce «todo verificado». **Riesgo:** el auditor administrativo no debe ejecutar código de PR no confiable con token privilegiado; verificación local de contrato y auditoría efectiva son jobs separados.

<a id="rev-077"></a>

### REV-077 — Las revisiones obligatorias son inoperables con la composición actual

**P1 · C-I · fase 2.** Evidencia: ruleset main y protección clásica exigen dos aprobaciones, CODEOWNERS, último push y stale dismissal; solo aparece `ddavid07` como colaborador con acceso, no hay equipos y CODEOWNERS solo lo nombra. El autor no puede aprobar su propia PR; si él es autor, falta también un CODEOWNER distinto.

**Corrección:** incorporar al menos dos revisores humanos elegibles distintos del autor para el flujo habitual y asignar CODEOWNERS con cobertura real, incluidos cambios de gobierno/cripto. Preferir equipos con permisos mínimos y sustitutos. Mantener dos aprobaciones y last-push; el trabajo del agente y este informe no cuentan como esas revisiones. Si se cambia el modelo organizativo, registrar decisión antes de cambiar protección.

**Cierre:** PR de cada mantenedor puede obtener dos aprobaciones legítimas y aprobación de propietario sin bypass; push posterior invalida las necesarias. **Riesgo:** no añadir cuentas ficticias, bots de autoaprobación ni bajar requisitos para fusionar esta remediación. Véase [revisiones requeridas de GitHub](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews).

<a id="rev-078"></a>

### REV-078 — Las excepciones de tags y entorno productivo deben tratarse como privilegios reales

**P1 · C-I · fase 2; interfaz con fase 11.** Evidencia: ruleset tags `22248561` permite bypass permanente a OrganizationAdmin; `npm-production.can_admins_bypass=true`, único reviewer con prevent-self-review. Estas excepciones están previstas en D-013, por tanto no son drift por sí mismas. El patrón productivo `v*.*.*` también puede abarcar prereleases; los globs no validan SemVer.

**Corrección:** resolver primero REV-077 y acordar en ADR el estado objetivo de separación de funciones. Para máxima inmutabilidad operativa, retirar bypass permanente o sustituirlo por mecanismo de emergencia controlado y auditado, tras comprobar que permite crear tags firmados nuevos. Usar validación estricta de tag estable/candidato y job/environment correctos, sin confiar solo en glob. Alinear política común con el motor sin copiar automáticamente su configuración efectiva.

**Cierre:** intento de actualizar/borrar tag o autoaprobar release falla salvo emergencia autorizada y registrada; RC nunca alcanza publicación estable. **Riesgo:** retirar bypass antes de tener revisores/recuperación puede bloquear operaciones. No se cambia ninguna excepción como parte de este review.

<a id="rev-079"></a>

### REV-079 — CI no conserva un expediente verificable y hay diferencias entre gates locales y jobs

**P1 · C-I · fases 2, 9.** Evidencia: run `33949212779` sin artefactos; workflow quality no ejecuta `adapter:check` de forma explícita como `npm run ci`, aunque recovery lo invoca indirectamente; conformance no hace validación XSD; performance no tiene gate oficial. Varios jobs de Security/Scorecard no fijan timeout propio. Ningún job audita periódicamente toda la configuración efectiva.

**Corrección:** definir una fuente de verdad para los checks y agregadores obligatorios. Publicar evidencia machine-readable por SHA: cobertura completa, mutantes, fuzz, performance, recovery, trazabilidad, SBOM, hashes, toolchains y configuración sanitizada. Upload `always()` para diagnósticos de fallo y marcar claramente informes incompletos; exigir artefactos ausentes como fallo. Añadir timeouts y retención acordada, archivo duradero para evidencias que superen retención de Actions.

**Cierre:** matriz de sección 13 con cada garantía en job ejecutado; el agregador falla por fallo, cancelación, ausencia y skip no autorizado. **Riesgo:** no hacer requerido un job que solo se dispara en main y bloquear todas las PR; separar comprobación previa de evidencia posterior al merge.

<a id="rev-080"></a>

### REV-080 — Scorecard verde no significa 100% de controles ni alertas cerradas

**P1 · C-I · fases 2, 9.** Evidencia: alertas abiertas [#4 Maintained](https://github.com/noeos/verifactu/security/code-scanning/4), [#5 CodeReview](https://github.com/noeos/verifactu/security/code-scanning/5) y [#6 CII Best Practices](https://github.com/noeos/verifactu/security/code-scanning/6), con workflow satisfactorio. La herramienta examina señales de historial, revisión y badge además de configuración.

**Corrección:** corregir controles técnicos y llevar revisión humana real en PR; tramitar badge con evidencia verdadera y mantener actividad/respuesta del proyecto. Guardar resultado JSON/SARIF, versión del scanner y fecha; distinguir error de análisis, check no aplicable, dato desconocido y deficiencia. Revisar todos los checks de la versión fijada, no solo los tres avisos actuales.

**Cierre:** cero defectos técnicos remediables pendientes y evolución verificada de señales externas; para exigir literalmente puntuación máxima, mantener cierre pendiente hasta que la herramienta la acredite. **Riesgo:** no se puede garantizar 10/10 inmediato mediante cambios de código ni falsificar historial/badge. Referencia: [checks oficiales de Scorecard](https://github.com/ossf/scorecard/blob/main/docs/checks.md).

<a id="rev-081"></a>

### REV-081 — Parte de la organización y de las políticas heredadas no es verificable con el acceso actual

**P1 · V · fase 2.** Evidencia: consultas org Actions, runners/grupos, secrets y variables devuelven 403 con requisito `admin:org`; rulesets 404 con esa indicación; hooks 404 con `admin:org_hook`; audit-log 404. Estos resultados no prueban que la superficie esté vacía. No se inspeccionaron valores de secretos ni se renovó autenticación.

**Corrección:** un administrador autorizado debe obtener exportación sanitizada o ejecutar el recolector con permisos de lectura adecuados; inventariar políticas heredadas, repos seleccionados, runners, retención, secretos/variables por alcance, hooks, apps, acceso externo y mecanismos de recuperación disponibles en el plan. Para cada campo no expuesto por API, registrar verificación UI con fecha y responsable. No almacenar credenciales ni datos personales de auditoría en el repo público.

**Cierre:** la matriz de sección 14 no tiene `unverified` relevante sin resolución formal. **Riesgo:** permiso y plan pueden limitar la API; no pedir privilegios de escritura por comodidad ni atribuir a un 404 ausencia confirmada. Esta revisión no puede certificar esa parte.

<a id="rev-082"></a>

### REV-082 — Los workflows de release son scaffolding y deben permanecer bloqueados hasta sus fases

**P1 · C-I · salvaguardas de fase 2; ejecución en fase 11.** Evidencia: stable exige paquete no privado pero `policy:check` exige que siga privado; no publica ni verifica firma/ancestry en su propio job. Candidate empaqueta dos productos, omite kit y no usa el entorno staging; dispatch en main no selecciona un tag válido. Release verification comprueba tag y políticas del checkout del verificador, no bytes publicados. Son piezas preparatorias, no una publicación terminada.

**Corrección ahora:** mantener paquetes privados y no activar publicación; añadir guardas inequívocas y documentar capacidad real. Validar diseño y pruebas locales de selección de tags/firmantes confiables, ancestry, artefactos de los tres paquetes y segregación de permisos. **En fase 11:** implementar pipeline de publicación OIDC y verificador independiente del tag, apoyado en gates ya corregidos, sin confiar en un `allowed-signers` sustituible desde el propio tag.

**Cierre del alcance 1–9:** ninguna ruta publica por accidente y la evidencia local de paquetes es completa. **Riesgo:** no marcar ausencia de release como defecto a «arreglar publicando» ahora; npm ownership/trusted publishing y declaración responsable quedan explícitamente reservados.

<a id="rev-083"></a>

### REV-083 — Conservación, retención legal y restauración no tienen contrato de conformidad ejecutable

**P1 · C-I/V · fases 6, 8–9.** Evidencia: `ports/index.ts`, adapter kit y `docs/02-legalidad/09-conservacion-prescripcion-prueba.md`. El plan exige política por clase/sujeto/finalidad y control de mínimos, pero no hay una interfaz/evidencia de esa política ni pruebas de legal hold, disponibilidad histórica o restauración cifrada. La falta de API de borrado es una protección útil, no prueba de conservación en un host.

**Corrección:** definir capacidad de retención/archivo del host con versión de política, fundamento, clases de artefactos y bloqueo de eliminación; no imponer un plazo único. El kit debe verificar conservación de bytes, firmas, respuestas, transiciones y anclas durante migración, archivo y restauración. Exportación tributaria debe separarse de datos comerciales confidenciales y autorización de borrado.

**Cierre:** vencimiento con retención superior, backup corrupto, clave inaccesible, restauración de versión previa y acceso tributario restringido; ninguna purga deshace una obligación vigente. **Riesgo:** no añadir borrado automático al núcleo ni inventar un número universal de años. La decisión jurídica del host se representa y verifica dentro de su alcance explícito.

<a id="rev-084"></a>

### REV-084 — El tipo público de edición no se puede obtener mediante el flujo público normal

**P1 · C-I · fase 8.** Evidencia: `index.ts` define `EditionId` como string branded; `VerifactuConfig.edition` lo exige, mientras `EditionInfo.edition` es el literal generado y no existe un constructor público de ese brand. Un consumidor no puede pasar normalmente la edición obtenida de `listEditions/getEdition` a configuración sin una aserción de tipos. El API report solo de biblioteca tampoco cubre íntegramente CLI/kit/subpaths.

**Corrección:** usar una unión generada de IDs admitidos, o devolver un `EditionId` validado por una función pública y en `EditionInfo`. El brand debe aportarse a través de validación real, no casts del consumidor. Completar schemas/types de capabilities, errores, bytes y versiones, y API reports por cada superficie que prometa compatibilidad.

**Cierre:** consumer TypeScript estricto configura una edición obtenida públicamente sin `as`; ediciones desconocidas reciben el error runtime correspondiente cuando entran por JSON/JS. **Riesgo:** distinguir edición conocida, legible y habilitada para nuevas emisiones; no hacer imposible abrir un histórico por retirar soporte de escritura.

## 9. Reproducciones y evidencia mínima de regresión

Estas pruebas se ejecutaron sobre TypeScript actual mediante un loader de transpilación en memoria, sin usar el dist de VeriFactu ni modificar sus fuentes. El adapter en memoria permite reproducir defectos de orquestación; no demuestra comportamiento de un almacenamiento productivo. Los ejemplos SOAP son deliberadamente mínimos para aislar el campo observado: no se presentan como respuestas completas validadas por XSD.

| ID de prueba | Operación/entrada mínima                                                                               | Observación en base                                                                              | Resultado que debe exigirse tras corregir                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| REPRO-01     | Preparar alta válida del fixture `record-validation.unit.test.ts` y verificar artefacto retornado.     | Prepare exitoso; verify `invalid` con `VF_INPUT_VALUE_INVALID`; XML de génesis con huella vacía. | Prepare y verify válidos sobre mismos bytes; huella emitida correcta.                        |
| REPRO-02     | Pasar ese modelo alta a `prepareAnulacion`.                                                            | `ok:true`.                                                                                       | Rechazo por tipo cruzado antes de generar artefacto.                                         |
| REPRO-03     | Sustituir bytes preparados por `<arbitrary/>`, fingerprint por 64 `A`; commit con génesis y sin reloj. | `ok:true`, `queued`, fecha `1970-01-01T00:00:00.000Z`.                                           | Fallo por artefacto/tiempo inválidos sin persistencia.                                       |
| REPRO-04     | `verifyChain` sobre el registro anterior.                                                              | `{status:'valid',recordId:'r1'}`.                                                                | Registro inválido; nunca resumen de cadena completa válida.                                  |
| REPRO-05     | SOAP con `EstadoEnvio=Correcto`.                                                                       | Parser no reconoce campo oficial y falla.                                                        | Interpretación conforme al schema/operación; fixture completo independiente para test final. |
| REPRO-06     | Firma con `DigestValue=abc`, sin SignatureValue, texto de política correcto.                           | `validateXadesEnvelope.ok:true`.                                                                 | Inspección parcial claramente marcada; verificación criptográfica inválida.                  |
| REPRO-07     | QR con fecha `99-99-2026`.                                                                             | `ok:true`; SVG `viewBox="0 57 57"`.                                                              | Fecha inválida; para fecha válida, SVG correcto y decodificable.                             |
| REPRO-08     | Serializar y parsear atributo `a\tb`.                                                                  | Se convierte en `a b`.                                                                           | Conserva tabulación mediante escape correcto.                                                |
| REPRO-09     | JSON `9007199254740993`.                                                                               | Se convierte a `9007199254740992`.                                                               | Error de número inseguro o representación exacta definida, sin redondeo silencioso.          |
| REPRO-10     | CLI `record alta build`, input válido.                                                                 | Código 2, comando desconocido.                                                                   | Construye con aridad normativa.                                                              |
| REPRO-11     | Añadir token `extra` al comando anterior.                                                              | Entra en build y falla por serialización de BigInt.                                              | Token extra rechazado; el comando correcto produce DTO JSON serializable.                    |
| REPRO-12     | CLI `vectors verify`.                                                                                  | Éxito sin verificar corpus.                                                                      | Ejecuta verificación real; falla si recurso distribuido se altera.                           |
| REPRO-13     | CLI `version --typo x`.                                                                                | Código 0.                                                                                        | Uso inválido, código 2.                                                                      |
| REPRO-14     | Dos `--format` contradictorios.                                                                        | Acepta el último y escribe solo `version`.                                                       | Rechazo de duplicado; formato humano útil con uso válido.                                    |
| REPRO-15     | `runAdapterConformance({name:'none',version:'1'})`.                                                    | `status:'passed'` sin adapters.                                                                  | No aplicable/incompleto, jamás conformidad funcional.                                        |
| REPRO-16     | Cambiar URL del primer objeto de `listAeatEndpoints()`.                                                | Resolución posterior devuelve URL modificada.                                                    | No se modifica la allowlist interna.                                                         |
| REPRO-17     | Enqueue → lease → submitting → vencer → lease con otro owner.                                          | Attempt sigue 0; otro owner obtiene `leased`.                                                    | Contador durable; entrega posible lleva a reconciliación y fencing seguro.                   |
| REPRO-18     | Respuesta mínima aceptada por parser actual: global `Correcto`, sin líneas.                            | Reporte `completed:1`, registro `accepted`.                                                      | Ningún registro aceptado sin evidencia individual suficiente.                                |
| REPRO-19     | Freshness de heads con iguales contadores y distintos contexto/digest.                                 | `ok:true`.                                                                                       | Rechazo de identidad/digest discordantes.                                                    |
| REPRO-20     | SHA-256 del lockfile frente al inventario.                                                             | Digests distintos; el checker solo exige forma hexadecimal.                                      | Inventario actualizado y comparación real obligatoria.                                       |

REPRO-01..19 son las diecinueve observaciones del harness. REPRO-20 es una comprobación adicional de integridad de archivo mediante lectura y hash. No se equiparan con veinte tests de la suite oficial ni con una medición de cobertura.

### 9.1 Fixture base reproducible

Usar como entrada de los casos de alta el objeto `validAlta()` de `tests/unit/record-validation.unit.test.ts`, manteniendo sus strings exactos. Configuración sintética: modalidad `verifactu`, `taxpayerScopeId:'t'`, `installationId:'i'`, `sequenceId:'s'`. Identidad opaca del registro `r1`. Para casos de confirmación correcta después del arreglo, inyectar reloj válido y adapters completos; la ausencia de reloj en REPRO-03 es parte deliberada de la negativa.

La conversión de estas reproducciones en regresiones debe hacerse antes de cada cambio correspondiente: ejecutar en base para ver el fallo esperado, aplicar corrección y exigir éxito del test. Los tests no deben importarse desde un árbol de build diferente al medido. Las pruebas nuevas deben localizarse por capacidad y registrar el ID REV y requisito al que dan evidencia.

## 10. Diseño objetivo y secuencia de corrección

### 10.1 Fronteras y estructura recomendadas

No se propone rehacer el motor ni imponer una nueva plataforma de persistencia. Mantener los tres paquetes y organizar las responsabilidades existentes de forma explícita:

| Superficie                                                   | Responsabilidad objetivo                                | Cambios centrales                                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `verifactu/src/domain`, `validation`, `fingerprint`          | Modelo completo, validación pura y huella oficial.      | DTOs cerrados, reglas/catálogos, temporalidad y decimales exactos.                          |
| `verifactu/src/generated`, `editions`, `schemas`, `catalogs` | Bundle de edición y metadatos reproducibles.            | Separar metadatos ligeros, inventarios y reglas ejecutables; nunca editar generados a mano. |
| `xml`, `signatures`, `certificates`, `qr`                    | Formatos, firma y contrato de confianza.                | Backends admitidos y pruebas diferenciales; no criptografía casera.                         |
| `evidence`                                                   | Adaptación al protocolo público de Verification Engine. | Subject final versionado, bytes/metadata comprometidos y evidencia verificable.             |
| `state`, `outbox`, `submissions`, `application`              | Invariantes, transacciones y máquinas operativas.       | CAS/fencing, intención de envío, identidad fiscal, journal y recuperación.                  |
| `transport`, `adapters`                                      | Binding AEAT e I/O explícito.                           | SOAP exacto, mTLS, observación de entrega y recursos acotados.                              |
| `api`                                                        | Fachada coherente y validación de fronteras.            | Artefactos, capabilities, scope y verificación de extremo a extremo.                        |
| `cli/src/io` y dispatch por comando                          | Protocolos de proceso y formatos de intercambio.        | Parser incremental, DTO codecs, salida durable y cancelación.                               |
| `adapter-kit`                                                | Ensayo reproducible de capacidades del host.            | Factories, fallos, reinicio, aislamiento y reportes por escenario.                          |
| `scripts`, `tests`, `.github`                                | Evidencia independiente y gobierno.                     | Checks que prueben comportamiento; artefactos atados al SHA.                                |

Los nombres de carpetas adicionales, si hacen falta, deben representar una responsabilidad concreta: por ejemplo `events` o `modality`. No crear carpetas `utils/helpers/common` ni reorganizar archivos solo para aparentar arquitectura. Los adapters en memoria siguen siendo exclusivamente de test; un fixture durable del kit puede vivir en tests sin convertirse en dependencia del paquete de producción.

### 10.2 Orden de trabajo y dependencias

| Lote | Trabajo y hallazgos principales                                                                                    | Dependencia                                       | Salida revisable y condición para continuar                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| R0   | Baseline, inventario, regresiones reproducidas, cobertura honesta y trazabilidad: 056–057, 062–064, 070, 074, 079. | Ninguna.                                          | Evidencia roja explicada por fallos existentes; no rebajar gates ni fusionar falsa conformidad.                                         |
| R1   | Ediciones, schemas y modelo completo: 001–006, 084.                                                                | R0.                                               | DTO/contratos revisados, inventario completo de reglas y ejemplos negativos.                                                            |
| R2   | XML, huella emitida, firma/certificados y QR: 007–015, 045–046.                                                    | R1.                                               | Bytes y firmas validados offline por oráculos independientes.                                                                           |
| R3   | Artefactos, scope, anterior, evidencia y verify: 016–021, 027.                                                     | R1–R2.                                            | Preparación/confirmación/verificación coherentes, sin entradas fabricadas aceptadas.                                                    |
| R4   | Modalidad, eventos, transacción host, CAS/freshness y retención: 022–023, 028–030, 036, 083.                       | R3.                                               | Recibos durables y contrato de adapters; crash antes de red resuelto.                                                                   |
| R5   | Outbox, leases, retries, SOAP, respuestas y transporte: 031–044.                                                   | R2–R4.                                            | Captura wire local, fallos de red, concurrencia y respuesta individual correctos.                                                       |
| R6   | Reconciliación, exportación, observabilidad y CLI completa: 024–026, 047–055.                                      | R3–R5.                                            | API/CLI parity, provider/store real de ensayo y streams recuperables.                                                                   |
| R7   | Kit, fuzz, stress, recuperación y rendimiento: 058–061.                                                            | R2–R6.                                            | Matrices completas ejecutadas y P-01..P-12 en runner oficial.                                                                           |
| R8   | Paquetes, SBOM/licencias, reproducibilidad, toolchain/build/gobierno: 065–073.                                     | Contratos estables de R1; cerrar tras R6–R7.      | Tres tarballs íntegros, consumers aislados y dos builds reproducibles.                                                                  |
| RG   | GitHub efectivo: 075–082.                                                                                          | Revisión humana y acceso administrativo adecuado. | Configuración comparada, revisores operativos, evidencia archivada y excepciones explícitas. Puede avanzar junto a los lotes de código. |
| RC   | Revisión final del alcance 1–9.                                                                                    | Todos los anteriores.                             | Ningún P0/P1 abierto, matriz sin huérfanos, evidencia del mismo SHA; conserva fases 10/11 pendientes.                                   |

Cada lote puede dividirse en PR pequeñas por invariante, pero no se declara cerrado un flujo mientras solo pase su happy path. Ante cambios que rompan API de desarrollo, preparar migración y notas en la misma PR; no esconder aserciones de tipos o normalizaciones dentro de consumers para forzar compatibilidad.

### 10.3 Invariantes obligatorias de transacción

1. Un registro confirmado conserva exactamente sus bytes finales y su identidad; nunca se «repara» sobrescribiéndolo.
2. Factura visible, registro, head, evidencia, eventos e intención de remisión tienen una frontera atómica documentada y ensayada.
3. Un CAS fallido no mueve ningún head ni expone factura; obliga a preparar nuevo artefacto sobre el head vigente.
4. Cada intento usa un único conjunto inmutable de request bytes, digest, miembros, destino y credential ID. Rotación de credenciales debe respetar esa identidad y el contrato del intento.
5. Desde posible entrega sin resultado persistido, el estado es indeterminado hasta evidencia suficiente; no hay retry ciego.
6. La respuesta remota puede existir aunque falle su aplicación local: guardar evidencia y reaplicar localmente mediante journal/CAS.
7. Resultados públicos reflejan el estado durable conocido, incluso al abortar después de commit; no prometen rollback que no ocurrió.
8. Conservación, restauración y cambios de edición no destruyen anclas ni firmas; ancla externa no depende del mismo fallo que pretende detectar.

### 10.4 Matriz mínima de fallos y recuperación

Para cada fila: ejecutar en proceso A, inyectar el fallo, terminarlo y reconstruir proceso B sobre el mismo almacenamiento de ensayo. Registrar bytes/digests/heads/outbox/eventos antes y después, ID de intento, fencing y recibos. El host fixture debe implementar el contrato, no saltarlo con acceso a campos privados.

| Frontera                                                          | Fallo inyectado                                                   | Invariante tras recuperación                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Antes de validar / durante XSD                                    | Entrada hostil, límite, abort.                                    | Sin factura, head ni outbox nuevo.                                              |
| Durante firma                                                     | Provider falla/cuelga/devuelve otro registro.                     | Nada confirmado; claves no filtradas; resultado explícito.                      |
| Antes de commit                                                   | Proceso termina.                                                  | Head previo; artefacto no expuesto como confirmado.                             |
| Entre escrituras de factura/registro/head/evidencia/outbox/evento | Excepción/disco lleno/rollback transacción.                       | Todo-o-nada, sin factura huérfana.                                              |
| Después de commit, antes del retorno                              | Proceso termina.                                                  | Recuperación por ID devuelve mismo recibo; no genera otro registro.             |
| CAS concurrente                                                   | Dos procesos sobre el mismo head.                                 | Un único sucesor; perdedor sin efectos parciales.                               |
| Adquisición de lease                                              | Doble worker/corte al persistir.                                  | Una titularidad efectiva y token durable.                                       |
| Lease vence antes de red                                          | Worker lento.                                                     | Reasignación segura solo si se prueba no envío.                                 |
| Durante TLS                                                       | CA/hostname/certificado incorrectos.                              | Sin aceptación ficticia; clasificación de entrega precisa.                      |
| Durante escritura HTTP                                            | Corte parcial/timeout/abort.                                      | Posible entrega indeterminada; request original preservado.                     |
| Después de recepción remota, antes de respuesta                   | Pérdida de conexión.                                              | Reconciliación; ningún retry ciego.                                             |
| Durante lectura HTTP                                              | Truncamiento/límite/error/evento close.                           | Resultado incompleto y recursos liberados.                                      |
| Después de respuesta, antes de persistir                          | Proceso termina.                                                  | Estado indeterminado recuperable, nunca éxito sin evidencia.                    |
| Durante aplicación de líneas                                      | Error de store en primera/intermedia/última línea.                | Journal reejecutable; ausencia de línea no acepta registro.                     |
| Después de resolver, antes de ACK local                           | Duplicación de ejecución.                                         | Aplicación idempotente con mismo recibo.                                        |
| Respuesta tardía de worker anterior                               | Fencing obsoleto.                                                 | No modifica intento ni head nuevo.                                              |
| Exportación a stream/fichero                                      | EPIPE, disco lleno, cancelación, destino creado concurrentemente. | Incompleto detectable; sin sobrescritura no autorizada.                         |
| Resumen de seis horas/cierre                                      | Crash antes/después de persistir.                                 | Evento exactamente una vez por intervalo lógico.                                |
| Restauración                                                      | Snapshot viejo, bytes corruptos, ancla externa nueva.             | Rollback/alteración detectados; no reparación silenciosa.                       |
| Actualización de versión                                          | Reinicio con records/outbox de versión previa.                    | Lectura estable, migración reversible de metadatos y bytes normativos intactos. |
| Retención                                                         | Vencimiento y legal hold simultáneos.                             | Conservación prevalece; no purga de evidencia exigible.                         |

## 11. Plan de rendimiento y determinismo verificable

La fuente de presupuestos es [Presupuestos de rendimiento](../09-rendimiento/01-presupuestos.md). La fase 9 debe dejar implementados y ejercitados los escenarios; la ejecución definitiva de release puede volver a ejecutarlos en fase 11, pero no inventarlos entonces.

| Gate | Medición exigida                                                                 | Umbral del contrato                                | Evidencia adicional                                                               |
| ---- | -------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| P-01 | Validar + serializar + huella de registro típico, no huella prevalidada aislada. | ≥10.000 registros/s.                               | Fixture 900–1.100 bytes, validación positiva comprobada.                          |
| P-02 | Latencia individual del pipeline P-01.                                           | p95 ≤1 ms; p99 ≤2 ms.                              | Distribución y tamaño de muestra suficientes para p99, calentamiento separado.    |
| P-03 | Contenido de URL QR.                                                             | ≥20.000/s.                                         | Separar de coste del símbolo SVG.                                                 |
| P-04 | XML + XSD completo típico.                                                       | ≥2.000/s.                                          | Backend y schema fijados, negativos no ignorados.                                 |
| P-05 | Firma del provider software de referencia.                                       | ≥500/s.                                            | Perfil/certificado/algoritmos fijados; HSM/red informados aparte.                 |
| P-06 | Construcción y parsing de 1.000 registros.                                       | p95 ≤500 ms.                                       | Sin red/firma externa; sin quitar campos o validación normativa.                  |
| P-07 | Stream total 1 GiB.                                                              | RSS incremental ≤256 MiB.                          | Series de RSS y buffers, sin acumular entrada/salida.                             |
| P-08 | 10 millones de registros ligeros.                                                | Pendiente interna ≤2; pendiente RSS ≤1 MiB/millón. | Instrumentación de pendientes y cálculo explícito de tendencia.                   |
| P-09 | Arranque CLI `version`.                                                          | p95 ≤250 ms.                                       | Procesos reales, no llamada directa a runCli.                                     |
| P-10 | Primer resultado NDJSON.                                                         | p95 ≤750 ms.                                       | Entrada no finalizada; stdout capturado por proceso independiente.                |
| P-11 | Cancelación entre registros.                                                     | ≤100 ms.                                           | Señal→cese de nuevos efectos y cierre del iterador.                               |
| P-12 | Overhead transporte local.                                                       | p95 ≤50 ms.                                        | Excluir explícitamente latencia de AEAT/provider; mantener parsing/clasificación. |

Plan de medición: runner Linux x64 dedicado con al menos el perfil fijado de 4 vCPU/8 GiB, build limpio y Node 24.20.0; registrar modelo CPU, frecuencia/gobernador, RAM, kernel, carga, toolchain y configuración. Muestras repetidas, orden de escenarios determinista con seed registrada y estadística de dispersión. Cualquier propuesta de revisión de presupuesto requiere evidencia y decisión expresa; no se ajusta el umbral para conseguir un verde.

Determinismo se prueba además con matriz de locale/TZ/chunking y orden de propiedades. Comparar bytes y diagnósticos con el mismo input y mismos hechos externos; reloj, provider y aleatoriedad explícitos forman parte de esos hechos. Las firmas pueden incorporar tiempo o variación del provider: distinguir el material determinista del protocolo del comportamiento criptográfico admitido y conservar sus inputs/evidencia, sin exigir que dos firmas de distinto instante sean idénticas.

Controles contra pruebas vacías: validar todas las variables de entorno de fuzz/benchmark/stress como números finitos seguros dentro de rango; imponer mínimo de iteraciones y muestras; todo escenario obligatorio produce resultado y metadatos. `NaN`, corpus vacío, runner no conforme y cancelación no generan una conclusión de éxito.

## 12. Matriz completa de requisitos, controles y riesgos

### 12.1 Los 67 requisitos existentes

La cifra se obtiene de los IDs de la matriz actual, no de resúmenes históricos. «Parcial» significa que existe una base útil, pero no toda la garantía; «externo» reserva la ejecución de fases 10/11 y no autoriza dejar incompleta su funcionalidad previa. Todos los hallazgos referidos están abiertos al emitir este informe.

| Requisito | Evaluación del alcance actual                                                                      | Hallazgos / prueba exigida                                                             |
| --------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| LEG-001   | Base de categorías implementada; casuística/errores no cerrados integralmente.                     | REV-027, 062–063; tabla completa con hechos conocidos/desconocidos.                    |
| LEG-002   | SII representado explícitamente; mantener sin inferencias favorables.                              | REV-027, 062–063; SII sí/no/desconocido y dato ausente.                                |
| LEG-003   | Territorio representado; el host debe aportar el hecho jurídicamente pertinente.                   | REV-017, 027, 062; no inferir territorio fiscal por dirección operativa.               |
| LEG-004   | Hechos resumidos por booleanos; trazabilidad de resoluciones queda en el host sin ensayo completo. | REV-001, 027, 063; resolución aplicable/inaplicable/insuficiente con referencia opaca. |
| LEG-005   | Códigos de impuesto presentes; validaciones de combinaciones parciales.                            | REV-001–003; reglas por impuesto/régimen.                                              |
| LEG-006   | Fechas documentadas; metadata ejecutable y prueba regulatoria no acreditadas.                      | REV-004, 063, 074; metadatos versionados sin usarlos como sustituto de aplicabilidad.  |
| LEG-007   | Frontera conceptual correcta; conservarla durante remediación.                                     | REV-064, 072, 074; no introducir B2B/SII/foral en API regulatoria genérica.            |
| LEG-008   | Ocho snapshots con digests; fuentes posteriores incompletas.                                       | REV-004–006, 070.                                                                      |
| LEG-009   | Watch de ocho fuentes; falta bloqueo/evidencia de todo drift afectado.                             | REV-006, 063, 079.                                                                     |
| LEG-010   | Licencia original definida; atribución/inventario insuficientes.                                   | REV-068–070.                                                                           |
| REG-001   | Falta demostración de atomicidad con factura visible.                                              | REV-028, 060–061.                                                                      |
| REG-002   | XML incompleto y sin XSD efectivo.                                                                 | REV-001, 007–011.                                                                      |
| REG-003   | Terna en huella; se pierde en respuesta/lote/estado.                                               | REV-017–018, 036–040.                                                                  |
| REG-004   | Decimales exactos útiles; conversión/euros sin contrato completo de datos.                         | REV-003, 048; host declara conversión y registro usa importe autorizado en euros.      |
| REG-005   | Reglas oficiales no inventariadas ni ejecutadas exhaustivamente.                                   | REV-002–003, 063.                                                                      |
| REG-006   | Anulación existe parcialmente; no expresa todo XML y tipos pueden cruzarse.                        | REV-001, 007–008, 018, 036.                                                            |
| REG-007   | Hecho previo parcial; faltan flujos completos de rechazo/subsanación.                              | REV-001–002, 024, 034–040.                                                             |
| REG-008   | Head/CAS parcial; no vínculo cronológico completo por obligado.                                    | REV-017–018, 028–030.                                                                  |
| REG-009   | XML génesis/anterior incorrecto.                                                                   | REV-007–008, 018.                                                                      |
| REG-010   | Función de preimagen/huella tiene vectores útiles; emisión incorrecta.                             | REV-007, 019–020, 062.                                                                 |
| REG-011   | Tipo de huella exige mayúsculas; conservar en todos los codecs.                                    | REV-016, 019–020, 048, 062; negativos de longitud/case.                                |
| REG-012   | Verificación de cadena/freshness insuficiente.                                                     | REV-018, 021, 029–030, 032.                                                            |
| REG-013   | Separación conceptual/perfil correcta; conexión al commit incompleta.                              | REV-019–021, 048, 084; no intercambiar fingerprints y digests.                         |
| MOD-001   | Etiqueta de configuración sin separación durable completa.                                         | REV-017, 023, 028.                                                                     |
| MOD-002   | Falta máquina de modalidad anual.                                                                  | REV-023; calendario y concurrencia.                                                    |
| MOD-003   | Falta renuncia/FechaFinVeriFactu operativa.                                                        | REV-001, 023, 037.                                                                     |
| EVT-001   | Preparación mínima; no automatiza catálogo y operaciones.                                          | REV-022, 025–026, 083.                                                                 |
| EVT-002   | Resumen operativo durable no implementado.                                                         | REV-022, 060–061.                                                                      |
| EVT-003   | No está probada cadena/firma/conservación independiente de eventos.                                | REV-007, 012–015, 019–022.                                                             |
| EVT-004   | Catálogo importado; XML de evento no corresponde al schema completo.                               | REV-001, 007–008, 022.                                                                 |
| STO-001   | Bundle parcial, outbox vacío desde facade y ausencia de transacción host ensayada.                 | REV-028–036, 060–061.                                                                  |
| STO-002   | Export parcial sin completitud ni fidelity round-trip.                                             | REV-024–025, 048, 051, 053–054.                                                        |
| STO-003   | Responsabilidad del host documentada; política/ensayo faltantes.                                   | REV-083, 060–061.                                                                      |
| STO-004   | No hay prueba integral de autorización/aislamiento de exportación.                                 | REV-017, 025–026, 083.                                                                 |
| SIG-001   | Se exige signer NVF, pero su resultado no se verifica y modalidad es parcial.                      | REV-012–015, 022–023.                                                                  |
| SIG-002   | Puente de firma, sin evidencia de nodo exacto firmado.                                             | REV-010, 012–015, 037.                                                                 |
| SIG-003   | Constantes de política presentes; algoritmos/clave no verificados integralmente.                   | REV-012–015.                                                                           |
| SIG-004   | Descriptor/fechas/booleano no prueban confianza.                                                   | REV-014–015, 044.                                                                      |
| SIG-005   | Protección wrapping/transforms no implementada en verificador normativo.                           | REV-009–015, 059.                                                                      |
| QR-001    | Falta modalidad NO VERI*FACTU y validación de entorno completa.                                    | REV-045–046.                                                                           |
| QR-002    | Codificación base útil; falta corpus completo y vínculo al registro.                               | REV-046, 062.                                                                          |
| QR-003    | SVG inválido, unidades/margen/fondo incorrectos.                                                   | REV-045.                                                                               |
| QR-004    | Leyendas y modalidad no modeladas integralmente.                                                   | REV-023, 045; fixture del host, sin construir aquí una aplicación de facturación.      |
| NET-001   | Wire SOAP/binding incorrecto y mTLS sin conformance completa.                                      | REV-037–044.                                                                           |
| NET-002   | Límite 1–1.000 y orden parcial existen; falta contenido oficial completo.                          | REV-001, 008, 037; casos 0/1/999/1.000/1.001.                                          |
| NET-003   | Espera no aplicada ni persistida.                                                                  | REV-033, 041.                                                                          |
| NET-004   | Estado global puede suplir línea ausente.                                                          | REV-039–040.                                                                           |
| NET-005   | Parte de respuesta se parsea, pero se pierden identidad/presentación/duplicado.                    | REV-024, 035, 039–040.                                                                 |
| NET-006   | Clasificación de entrega incompleta.                                                               | REV-032, 039, 042–043.                                                                 |
| NET-007   | Attempt/retry/reconciliación y aplicación durable rotos.                                           | REV-024, 031–036, 040–043.                                                             |
| NET-008   | Endpoints de requerimiento listados; payload/capacidad no implementados completamente.             | REV-001, 023, 037, 039; validación externa reservada a fase 10.                        |
| NET-009   | Consulta de presentados no implementada.                                                           | REV-023–024, 037, 039.                                                                 |
| CON-001   | ESM/CJS base; API/CLI no son equivalentes funcionalmente.                                          | REV-020, 047–055, 066, 084.                                                            |
| CON-002   | Dominio mayormente puro; límites, reloj y callbacks necesitan política completa.                   | REV-026–027, 043, 064, 072.                                                            |
| CON-003   | Dependencia exacta y perfil público existen; falta prueba de tarball y subject final.              | REV-019–021, 066–070.                                                                  |
| CON-004   | API report parcial; DTO/CLI y lectura histórica no están cerrados.                                 | REV-004, 048, 065–067, 084; compatibilidad histórica externa en fase 10.               |
| SEC-001   | Filtros XML presentes, pero límites/C14N/XSD requieren corrección.                                 | REV-008–012, 059, 064.                                                                 |
| SEC-002   | Sin secretos en fixtures observados; redacción de errores/observer no probada integralmente.       | REV-026–027, 054–055, 064, 069, 079.                                                   |
| SEC-003   | Allowlist mutable y provider TLS sin suite negativa completa.                                      | REV-038, 042–044.                                                                      |
| SEC-004   | Pins presentes; enforcement, admisión, SBOM y auditoría incompletos.                               | REV-065–071, 075–082.                                                                  |
| PER-001   | No acreditado.                                                                                     | REV-058–060; doce presupuestos de sección 11.                                          |
| QUA-001   | Trazabilidad de archivos, no de ejecución/alcance completo.                                        | REV-002, 005, 063, 079.                                                                |
| QUA-002   | Cobertura/mutación nominales no sostienen los umbrales.                                            | REV-056–057.                                                                           |
| QUA-003   | Hay referencia de huella y properties; faltan oráculos y consumers reales.                         | REV-058–068.                                                                           |
| OPS-001   | Publicación fuera de alcance actual; preservar bloqueo y preparar evidencia local.                 | REV-078–079, 082; fase 11 sin ejecutar.                                                |
| OPS-002   | Declaración por versión y expediente final reservados.                                             | REV-069, 074, 079, 082; no inventar ni firmar declaración en este review.              |
| OPS-003   | Claims de cierre requieren corrección.                                                             | REV-063, 074, 080–082.                                                                 |

### 12.2 Los 22 controles existentes

| Control | Hallazgos que impiden darlo por cerrado | Evidencia necesaria                                                                   |
| ------- | --------------------------------------- | ------------------------------------------------------------------------------------- |
| CTL-001 | 001–003, 009, 011, 027, 047–052.        | Parsers/DTO/XSD/reglas con negativos y límites.                                       |
| CTL-002 | 007, 010, 012–016, 019–021.             | Alteración aislada de cada material comprometido detectada.                           |
| CTL-003 | 018, 028–029, 034–036.                  | Carreras y crash transaccional del host.                                              |
| CTL-004 | 021, 030, 060.                          | Ancla externa y restauración antigua.                                                 |
| CTL-005 | 024, 031–036, 040–042.                  | Replay, duplicados, fencing y mismos bytes por intento.                               |
| CTL-006 | 008–011, 059, 064.                      | XXE/DTD/expansión rechazados antes de consumo no acotado.                             |
| CTL-007 | 010, 012–015.                           | Wrapping, referencias duplicadas/externas y transforms adversarios.                   |
| CTL-008 | 038, 043–044.                           | Allowlist inmutable y mTLS negativo.                                                  |
| CTL-009 | 006, 038, 043–044.                      | Redirect/DNS/proxy según frontera declarada.                                          |
| CTL-010 | 013–015, 050, 064.                      | Providers opacos, log capture y permisos mínimos.                                     |
| CTL-011 | 014, 024, 044.                          | PKI/revocación/representación con resultado trivalente.                               |
| CTL-012 | 026–027, 048, 054–055.                  | Captura stdout/stderr/observer y errores externos saneados.                           |
| CTL-013 | 009, 027, 033, 043, 051–052, 058–060.   | Bytes, nodos, pendientes, tiempo, RSS y aborto.                                       |
| CTL-014 | 065–071, 075–076, 079–080.              | Lock/admisión/SBOM/signatures/scanners por SHA.                                       |
| CTL-015 | 064, 070, 075–076, 079, 081–082.        | SHA enforcement, permisos y frontera de ejecución PR.                                 |
| CTL-016 | 004–006, 063.                           | Fuente fijada y drift observado bloqueante.                                           |
| CTL-017 | 065–068, 071, 079.                      | Dos builds limpios y provenance de artefactos exactos cuando corresponda.             |
| CTL-018 | 073, 077–082.                           | Firmas, revisores, tags, entorno y verificador independiente; publicación en fase 11. |
| CTL-019 | 064, 069–070, 076, 079, 081.            | Push protection, historial escaneado y alcance privado/organizativo verificado.       |
| CTL-020 | 022, 025, 030, 060–061, 083.            | Backup/restauración real y evento normativo.                                          |
| CTL-021 | 018, 022–023, 027, 033, 041.            | Reloj explícito, skew, cronología y límites de lease.                                 |
| CTL-022 | 017, 023, 028, 036, 044, 061.           | Matriz multiobligado de datos, claves, colas y exportación.                           |

### 12.3 Tratamiento de los 15 riesgos existentes

| Riesgo                                     | Tratamiento concreto en esta guía    | Residual que debe seguir documentado                                            |
| ------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------- |
| R-001 Cambio normativo                     | REV-004–006, 063, 074.               | Cambio oficial aún no publicado/interpretado; nunca actualización silenciosa.   |
| R-002 Confusión entre factura/registro/B2B | REV-001, 028, 064, 072, 074.         | Host que incumple contrato; ensayo obligatorio.                                 |
| R-003 Interpretación incorrecta            | REV-001–006, 062–063.                | Ambigüedad de fuente; decisión trazable, sin dictamen externo previo inventado. |
| R-004 XML/firma vulnerable                 | REV-007–015, 059, 064.               | Fallo de backend; actualización/advisory y corpus independiente.                |
| R-005 Pérdida/fork                         | REV-018, 021, 028–036, 060–061.      | Storage/host malicioso; anclas y alcance explícito.                             |
| R-006 Certificado comprometido             | REV-013–015, 044, 050.               | Compromiso del provider; rotación y revocación fuera del núcleo.                |
| R-007 Desconocido tratado como éxito       | REV-020–025, 035, 039–042, 049, 061. | Ambigüedad remota legítima; conservar indeterminado.                            |
| R-008 Supply chain                         | REV-065–073, 075–082.                | Zero-day/compromiso de cuentas; no desaparece por tener CI verde.               |
| R-009 Backlog/capacidad                    | REV-033–034, 041, 043, 051, 058–060. | Saturación del host o servicio; política de backpressure y aviso.               |
| R-010 Host omite atomicidad                | REV-028, 060–061.                    | Integración no conforme; no autorizar emisión con kit incompleto.               |
| R-011 Claims excesivos                     | REV-063, 074, 080–082.               | Copy/uso externo del producto; claims por versión y alcance.                    |
| R-012 Conocimiento concentrado             | REV-073–074, 077–078.                | Disponibilidad humana; revisores/sustitutos y recuperación practicada.          |
| R-013 AEAT indisponible                    | REV-024, 031–035, 041–043.           | Caída prolongada; backlog durable y respuesta operativa del host.               |
| R-014 Reloj manipulado                     | REV-018, 022–023, 027, 033, 041.     | Fuente de tiempo del host; no autocorregir silenciosamente.                     |
| R-015 Multiobligado                        | REV-017, 023, 028, 036, 044, 061.    | Authorization del host; test de capacidad y namespace.                          |

Ninguna fila acepta automáticamente el residual. Mantener probabilidad/impacto y propietario, y volver a evaluarlos con los resultados de los cambios. D-009 permite construcción sin gate jurídico externo previo; no elimina trazabilidad ni la evaluación final que corresponda en las fases reservadas.

## 13. Matriz de workflows y controles de salida

### 13.1 Los dieciséis contextos requeridos actualmente

Conservar nombres estables o actualizar coordinadamente ruleset, protección clásica, workflow y pruebas del auditor. No retirar checks para permitir merge. En eventos donde un check no aplica, registrar la razón prevista; un skip inesperado no cuenta como evidencia.

| Contexto requerido                               | Función real que debe acreditar después de remediar                                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Required · quality and policy`                  | Políticas completas, docs/ADR, lint/typecheck, API/schema, cobertura real y mutación; ningún campo de inventario meramente decorativo. |
| `Required · regulatory sources and traceability` | Schemas de manifiestos, digests, integridad del bundle y matriz requisito→ejecución.                                                   |
| `Required · RRSIF conformance`                   | XML/XSD/reglas/huella/firma/QR/binding contra fixtures oficiales fijados, sin portal externo en PR.                                    |
| `Required · ubuntu-24.04 · Node 22.14.0`         | Tests de comportamiento, tarballs y CLI/procesos en mínimo soportado.                                                                  |
| `Required · ubuntu-24.04 · Node 22.23.2`         | Mismas garantías en Node 22 actualizado.                                                                                               |
| `Required · ubuntu-24.04 · Node 24.20.0`         | Mismas garantías en primario Linux.                                                                                                    |
| `Required · windows-2025 · Node 24.20.0`         | I/O, rutas, permisos disponibles, no-clobber y tipos/paquetes en Windows.                                                              |
| `Required · macos-15 · Node 24.20.0`             | I/O, filesystem y determinismo en macOS.                                                                                               |
| `Required · package reproducibility`             | Dos builds limpios de los tres paquetes con inventario y tarballs iguales.                                                             |
| `Required · dependency review`                   | Diff de dependencias, vulnerabilidades/licencias/admisión en PR; el escaneo completo complementa este diff.                            |
| `Required · CodeQL`                              | Base analizada del SHA correcto, queries previstas, análisis completado y alertas diferenciadas por herramienta.                       |
| `Required · secret scan`                         | Historial completo, redacción, herramientas fijadas y revisión de artefactos/binarios.                                                 |
| `Required · OSV`                                 | Lockfile efectivo escaneado; fallos de servicio diferenciados de vulnerabilidad, sin transformar ambos en éxito.                       |
| `Required · npm audit and license inventory`     | Audit completo según umbral y política, firmas/attestations de dependencias cuando se reclamen, inventario real de licencias.          |
| `Required · phase 9 performance budgets`         | Smoke de corrección y conexión con gate oficial P-01..P-12; no score nominal de huella prevalidada.                                    |
| `Required · application security boundaries`     | Import graph y negativos runtime de XML/TLS/secretos/recursos/ownership/paths.                                                         |

Los umbrales actuales de `npm audit` y Dependency Review son `moderate`. El objetivo solicitado exige decidir explícitamente qué hacer con cualquier alerta low u otra categoría: evaluar y corregir todas las remediables, documentar las no aplicables con prueba, y no afirmar «cero vulnerabilidades» basándose solo en que no haya moderate+. No abrir descartes genéricos para mantener el verde.

### 13.2 Garantías transversales que deben añadirse o conectarse explícitamente

- **Adapter conformance y crash/recovery:** job obligatorio con fixture durable, matrices completas y artefactos. Puede integrarse en quality si conserva visibilidad y timeout; no quedar escondido tras un script nominal de recovery.
- **Mutation/fuzz:** informes por objetivo y paquete; falla por corpus vacío, error inesperado, sobreviviente crítico o tiempo insuficiente. Campañas ampliadas programadas con política de vigencia de evidencia.
- **Rendimiento oficial:** runner de confianza y gates medidos. Un smoke en PR no sustituye evidencia oficial anterior al cierre; definir cómo se exige sin ejecutar PR ajenas en runner persistente privilegiado.
- **GitHub audit:** contrato/snapshot validado sin credenciales en PR; auditor administrativo read-only desde código protegido en schedule/manual. Drift/inaccesible produce estado no conforme o no verificado, nunca verde absoluto.
- **Scorecard:** análisis y evaluación de resultados separados; mantener seguridad de tokens y constraints de la Action. No exigir un job posterior a merge como status imposible de producir antes del merge.
- **Evidencia:** reportes incluyen SHA/ref/evento, run/job IDs, toolchains, timestamp de medición, versión de corpus/schema, resultados, exclusiones revisadas y digests. Los errores de upload no se ignoran en la evidencia obligatoria.
- **Firmas/DCO:** controles independientes, con trusted root fuera del material cuya confianza se está evaluando y con tratamiento explícito de bots/coautoría.

Un verificador final debe consultar conclusiones **y jobs** del SHA exacto. Ni badge de main, ni último workflow global, ni un run de una PR anterior son evidencia del commit que se pretende cerrar.

## 14. GitHub: estado efectivo, estado objetivo y procedimiento de comprobación

### 14.1 Superficies del repositorio

Datos observados mediante GET el 2026-09-07. Los IDs identifican esta instantánea; el futuro recolector debe descubrir recursos por nombre y ámbito, sin depender de IDs permanentes. «Conforme observado» se refiere a la propiedad de esa fila, no al repositorio completo.

| Superficie                 | Estado efectivo observado                                                                                                                                        | Tratamiento y evidencia exigida                                                                                                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identidad                  | Repositorio público `noeos/verifactu`, ID `1355804670`; default branch `main`; no archivado ni deshabilitado.                                                    | Mantener identidad y visibilidad deliberadas. Comparar metadata real con política, sin atribuir seguridad al texto descriptivo.                                                                                     |
| Métodos de merge           | Squash habilitado; merge commit, rebase y auto-merge deshabilitados; borrado de rama tras merge y signoff web habilitados.                                       | Conforme observado con política. Probar que las restricciones efectivas de main no tienen una excepción heredada desconocida.                                                                                       |
| Funcionalidades            | Issues habilitadas; wiki, projects, discussions, downloads y Pages deshabilitados; forks habilitados. `has_pages:false` y GET Pages 404 concordantes.            | No activar funcionalidades innecesarias. El 404 aislado de otra API no se interpreta igual que este par de evidencias.                                                                                              |
| Ruleset main               | `22248545`, activo, `refs/heads/main`, sin exclusiones ni bypass; no deletion/non-fast-forward; historia lineal y firmas.                                        | Conservar los invariantes; verificar tipos y parámetros completos, no solo que exista una regla con cierto nombre. REV-076.                                                                                         |
| PR sobre main              | Dos revisiones, CODEOWNERS, descarte de aprobación obsoleta, aprobación del último push, resolución de conversaciones, aprobación extra de cambios sin atribuir. | Configuración exigente pero capacidad humana insuficiente: REV-077. Resolver acceso y propiedad antes de retirar excepciones de release.                                                                            |
| Checks requeridos          | Los 16 de sección 13; strict=true, `do_not_enforce_on_create:false`.                                                                                             | Comparar sets exactos, productor y condiciones de ejecución. No retirar checks para hacer merge.                                                                                                                    |
| Protección clásica de main | Activa, `enforce_admins:true`; checks asociados a GitHub Actions, `app_id:15368`.                                                                                | Ruleset no fija integration ID, pero la protección clásica sí fija productor. No afirmar que hoy cualquiera puede suplantar el check. Consolidar solo después de demostrar equivalencia y actualizar ambas fuentes. |
| Tags                       | Ruleset `22248561`, activo, `refs/tags/v*`; exige firmas y restringe actualización, borrado y non-fast-forward; bypass de OrganizationAdmin siempre.             | Excepción aprobada por D-013; REV-078 propone un objetivo más estricto sujeto a nuevo ADR. La existencia de una regla no sustituye la verificación criptográfica del tag con raíz confiable.                        |
| Actions generales          | Habilitadas, allowlist seleccionada, **SHA obligatorio=false**, frente a true declarado.                                                                         | Drift confirmado REV-075. Activar y verificar enforcement, tras comprobar compatibilidad de referencias admitidas.                                                                                                  |
| Allowlist de Actions       | GitHub-owned=true, verified creators=false; terceros limitados a OSV y Scorecard con SHA completo.                                                               | Mantener inventario de refs/procedencia, comparar conjunto exacto y analizar `uses` estructuralmente. No ampliar a toda una organización por comodidad.                                                             |
| Token y forks              | Permiso por defecto read; workflows no pueden aprobar PR; requiere aprobación de todos los colaboradores externos en forks.                                      | Conforme observado. Mantener permisos mínimos por job y analizar eventos, checkout, inputs, cachés y artefactos como fronteras de confianza.                                                                        |
| `npm-staging`              | Único reviewer `ddavid07`; self-review permitido; admin bypass=false; solo tags personalizados `v*.*.*-rc.*`.                                                    | Definir separación de funciones y SemVer estricto. El entorno existe, pero candidate no lo consume actualmente: REV-082.                                                                                            |
| `npm-production`           | Único reviewer `ddavid07`; prevent-self-review=true; admin bypass=true; tags `v*.*.*`.                                                                           | REV-077–078: cubrir revisores, resolver bypass mediante decisión y excluir RC mediante validación semántica. No inferir que el glob es un filtro de versión estable.                                                |
| Secret scanning            | Habilitado, push protection habilitada; non-provider patterns y validity checks deshabilitados según política.                                                   | Estos dos últimos estados no son por sí solos drift. Evaluar cobertura con scanner complementario sin afirmar que conoce todo formato de secreto.                                                                   |
| Dependabot                 | Alertas accesibles sin abiertas; security updates habilitadas y no pausadas; tres PR de dependencias abiertas en el corte.                                       | Revisión y regeneración de inventarios por actualización; diferenciar alerts, updates y dependency review. REV-070, 076.                                                                                            |
| Vulnerabilidades privadas  | Private vulnerability reporting habilitado.                                                                                                                      | Comprobar responsables y procedimiento de respuesta; no crear un reporte de prueba externo sin autorización.                                                                                                        |
| Code scanning              | Tres alertas abiertas, todas Scorecard; ninguna abierta de CodeQL observada.                                                                                     | REV-080. Guardar herramienta/rule ID/severidad/estado; no cerrar Scorecard como falso positivo por el mero hecho de que el workflow pase.                                                                           |
| Accesos                    | Un colaborador `ddavid07`, rol admin; equipos del repo e invitaciones pendientes vacíos.                                                                         | REV-077. Revisar acceso efectivo, pertenencia y cobertura CODEOWNERS; el rol de un bot no sustituye independencia humana.                                                                                           |
| Integraciones del repo     | Webhooks y deploy keys vacíos; runners del repo vacíos.                                                                                                          | Conforme con ausencia en estos endpoints; no descarta recursos heredados de organización inaccesibles.                                                                                                              |
| Secretos y variables       | Actions secrets=0, Dependabot secrets=0; env secrets/variables=0 en ambos entornos; Actions variables del repo=0.                                                | `privateSurface.actionsVariables:1` está desactualizado. Determinar finalidad del valor esperado antes de crear o eliminar nada; no fabricar una variable para cuadrar un contador. REV-076.                        |
| Retención de Actions       | `days:90`, `maximum_allowed_days:90`.                                                                                                                            | Retención efectiva confirmada. No cubre conservación legal ni evidencia de release a largo plazo: establecer archivo durable del expediente y clasificación de contenido. REV-079, 083.                             |
| Evidencia de ejecución     | CI del HEAD sin artefactos; jobs y logs accesibles; workflows declarados en ocho archivos.                                                                       | Corregir persistencia y contenido de informes; una política de 90 días no sirve si nunca se suben los informes.                                                                                                     |
| Releases y paquetes        | Ninguna release; manifiestos privados de desarrollo.                                                                                                             | Mantener barrera de publicación; la configuración npm/trusted publishing no queda certificada mediante GitHub. Fase 11 permanece pendiente.                                                                         |

En la allowlist observada, los terceros son `google/osv-scanner-action/osv-scanner-action@6e4298ebc4db23e847df9b2e2de2939d6f066c67` y `ossf/scorecard-action@2d1146689b8cda280b9bc96326124645441f03bc`. Fijar un SHA evita movimiento de un tag, pero no acredita por sí mismo el contenido de la Action; conservar su evaluación y vigilar actualizaciones.

### 14.2 Organización y controles heredados

| Superficie de Noeos                                 | Resultado                                                                                                                                                                                                                                                 | Resolución necesaria                                                                                                                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Metadata y política general accesible               | Organización verificada; plan Free; un asiento ocupado; 2FA requerida; permiso base read; signoff web requerido; miembros no pueden crear repos, cambiar visibilidad, borrar repos ni hacer fork privado; invitación de colaboradores externos permitida. | Mantener comparador de campos accesibles. Separar «permitido por política» de «existe acceso externo efectivo». No concluir recuperación completa a partir de 2FA.                |
| Repositorios del ecosistema                         | Nueve repos observados, seis públicos y tres privados; VeriFactu y Engine forman parte de una arquitectura mayor.                                                                                                                                         | Mantener inventario de responsabilidad y dependencias; no copiar secretos ni bases de datos entre productos ni divulgar metadata privada innecesaria.                             |
| GitHub Apps instaladas, endpoint consultado         | Cero instalaciones devueltas por el endpoint de organización.                                                                                                                                                                                             | No significa cero autorizaciones OAuth, tokens personales o aplicaciones fuera de ese alcance. Completar inventario administrativo por capacidad disponible.                      |
| Actions permissions de org                          | 403; requiere `admin:org`.                                                                                                                                                                                                                                | Exportación sanitizada de habilitación, allowlist, SHA, políticas de forks/token y repos seleccionados. Estado **no verificado**.                                                 |
| Rulesets de org                                     | 404 con indicación de permisos `admin:org`.                                                                                                                                                                                                               | Enumerar reglas heredadas, enforcement, condiciones y bypass aplicables a ambos repos. Estado **no verificado**.                                                                  |
| Runners y grupos de org                             | 403, `admin:org`.                                                                                                                                                                                                                                         | Inventariar pertenencia, repos autorizados, aislamiento, persistencia, conectividad, mantenimiento y política frente a PR externas. Estado **no verificado**.                     |
| Secrets y variables de org                          | 403, `admin:org`.                                                                                                                                                                                                                                         | Solo nombres/clases, alcance y repos seleccionados cuando no sean sensibles; nunca exportar valores. Estado **no verificado**.                                                    |
| Hooks de org                                        | 404 con indicación `admin:org_hook`.                                                                                                                                                                                                                      | Inventario de destinos, eventos, activo/inactivo, verificación TLS y administración; secretos fuera del informe. Estado **no verificado**.                                        |
| Retención de Actions de org                         | 403, `admin:org`.                                                                                                                                                                                                                                         | Confirmar política heredada y restricciones del plan; comparar con 90 días efectivos del repo. Estado **no verificado**.                                                          |
| Audit log                                           | 404.                                                                                                                                                                                                                                                      | Determinar acceso/soporte del plan; no concluir ausencia de actividad. Obtener evidencia administrativa disponible y definir conservación operativa. Estado **no verificado**.    |
| Recuperación, credenciales y controles no expuestos | No se inspeccionaron recovery codes, credenciales, autorizaciones OAuth, inventario completo de PAT/SSH ni controles UI no expuestos por las consultas disponibles.                                                                                       | Responsable autorizado documenta procedimiento y evidencia sanitizada. No solicitar ni guardar secretos. No afirmar que SSO u otra prestación esté disponible sin comprobar plan. |

La revisión no cambia autenticación para resolver estas filas. La remediación debe asignar un administrador responsable de aportar evidencia; una exportación puede bastar y evita conceder privilegios innecesarios al proceso de CI. El repositorio público debe contener el resultado y digests, no información sensible del gobierno interno.

### 14.3 Procedimiento exacto para remediar y comprobar GitHub

1. **Capturar base:** exportar estado deseado y respuestas GET sanitizadas, con fecha, API version, endpoint, status, paginación y scope. No sustituir el JSON deseado por el observado para borrar el drift.
2. **Corregir el recolector primero:** implementar REV-076 con fixtures de todos los tipos de regla, estados desconocidos y paginación. El recolector carece de métodos de escritura. Usar identificadores descubiertos y validar schemas; un campo requerido ausente no toma un default permisivo.
3. **Resolver personas y decisiones:** REV-077 antes de endurecer bypass; nombrar responsables de recuperación y revisores elegibles. Aprobar el ADR que modifique D-013 si se adopta ese cambio. Las invitaciones, roles y políticas son acciones administrativas futuras, no ejecutadas por este informe.
4. **Aplicar cambios concretos:** activar SHA obligatorio, sincronizar protecciones/contextos/productores, ajustar entornos y patrones según decisiones, y corregir snapshots desactualizados. Para una sustitución de protección, crear y verificar la nueva antes de retirar la anterior; no abrir una ventana sin protección. Mantener paquetes privados.
5. **Leer de nuevo:** repetir GET y comparar estado efectivo con invariantes. Un PUT exitoso o una captura de configuración no prueba que la regla se aplique a la referencia y actor previstos.
6. **Probar enforcement:** tests contractuales contra fixtures en PR; prueba administrativa controlada de restricciones en recurso de prueba autorizado cuando se necesite una operación real. No borrar ni mover un tag de producción para demostrar su protección. Comprobar por API bypass efectivo y documentación de restricciones cuando no sea apropiada una prueba destructiva.
7. **Cerrar evidencia:** guardar informe `pass/fail/unverified/not-applicable`, diferencias, responsable, SHA de scripts y referencia de decisión. Programar auditoría desde main protegido y vigencia máxima del informe. Un recurso inaccesible conserva su estado y bloquea la afirmación de auditoría completa.

Consultas de lectura base para el recolector; las rutas con `RULESET_ID`, `ENVIRONMENT`, `RUN_ID` y `SHA` son parámetros descubiertos, no valores literales a ejecutar. Los endpoints de listas deben paginarse incluso cuando hoy devuelvan pocos elementos:

```text
GET /repos/noeos/verifactu
GET /repos/noeos/verifactu/rulesets?includes_parents=true&per_page=100
GET /repos/noeos/verifactu/rulesets/RULESET_ID
GET /repos/noeos/verifactu/rules/branches/main
GET /repos/noeos/verifactu/branches/main/protection
GET /repos/noeos/verifactu/actions/permissions
GET /repos/noeos/verifactu/actions/permissions/selected-actions
GET /repos/noeos/verifactu/actions/permissions/workflow
GET /repos/noeos/verifactu/actions/permissions/fork-pr-contributor-approval
GET /repos/noeos/verifactu/actions/permissions/artifact-and-log-retention
GET /repos/noeos/verifactu/environments
GET /repos/noeos/verifactu/environments/ENVIRONMENT
GET /repos/noeos/verifactu/environments/ENVIRONMENT/deployment-branch-policies
GET /repos/noeos/verifactu/environments/ENVIRONMENT/secrets
GET /repos/noeos/verifactu/environments/ENVIRONMENT/variables
GET /repos/noeos/verifactu/actions/secrets
GET /repos/noeos/verifactu/actions/variables
GET /repos/noeos/verifactu/dependabot/secrets
GET /repos/noeos/verifactu/automated-security-fixes
GET /repos/noeos/verifactu/private-vulnerability-reporting
GET /repos/noeos/verifactu/code-scanning/alerts?state=open&per_page=100
GET /repos/noeos/verifactu/dependabot/alerts?state=open&per_page=100
GET /repos/noeos/verifactu/secret-scanning/alerts?state=open&per_page=100
GET /repos/noeos/verifactu/collaborators?affiliation=all&per_page=100
GET /repos/noeos/verifactu/teams?per_page=100
GET /repos/noeos/verifactu/invitations?per_page=100
GET /repos/noeos/verifactu/hooks?per_page=100
GET /repos/noeos/verifactu/keys?per_page=100
GET /repos/noeos/verifactu/actions/runners?per_page=100
GET /repos/noeos/verifactu/actions/runs?head_sha=SHA&per_page=100
GET /repos/noeos/verifactu/actions/runs/RUN_ID/jobs?per_page=100
GET /repos/noeos/verifactu/actions/runs/RUN_ID/artifacts?per_page=100
GET /repos/noeos/verifactu/commits/SHA/check-runs?per_page=100
GET /repos/noeos/verifactu/commits/SHA/status
GET /orgs/noeos
GET /orgs/noeos/rulesets?per_page=100
GET /orgs/noeos/actions/permissions
GET /orgs/noeos/actions/permissions/selected-actions
GET /orgs/noeos/actions/permissions/workflow
GET /orgs/noeos/actions/permissions/artifact-and-log-retention
GET /orgs/noeos/actions/runners?per_page=100
GET /orgs/noeos/actions/runner-groups?per_page=100
GET /orgs/noeos/actions/secrets?per_page=100
GET /orgs/noeos/actions/variables?per_page=100
GET /orgs/noeos/hooks?per_page=100
GET /orgs/noeos/installations?per_page=100
GET /orgs/noeos/audit-log?per_page=100
```

El recolector también debe descubrir los repos seleccionados por secretos, variables y grupos cuando existan; no basta el contador superior. Para endpoints con 204, tratar el status como dato y no exigir un JSON inexistente. No reintentar 403 indefinidamente ni transformar 404 ambiguo en lista vacía. La API y prestaciones pueden cambiar: verificar el contrato en la [referencia oficial de permisos de Actions](https://docs.github.com/en/rest/actions/permissions). Los requisitos y restricciones de aprobación de despliegues se contrastan con [la documentación de entornos](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

## 15. Protocolo de ejecución y cierre de la remediación

### 15.1 Unidad de trabajo por hallazgo

Cada REV tiene una ficha de seguimiento dentro del expediente de remediación. Este informe conserva la línea base; el cierre debe enlazar implementación y evidencia, no reescribir el pasado como si el defecto nunca hubiera existido. Un mismo PR puede cerrar varios IDs solo si acredita cada criterio; un ID puede necesitar varios PR.

| Campo obligatorio          | Contenido concreto                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID y estado                | REV-NNN; `abierto`, `en curso`, `corregido pendiente de evidencia`, `verificado` o `no aplicable demostrado`. Todos empiezan abiertos en este corte.   |
| Responsable y revisor      | Persona/rol capaz de resolver la superficie; revisión independiente cuando la política lo requiera. Código del agente no equivale a aprobación humana. |
| Dependencias               | IDs/lote de sección 10 y decisión pendiente. No integrar un consumidor de un contrato todavía ambiguo.                                                 |
| Reproducción               | Fixture mínimo, entrada, resultado anterior y resultado debido; incluir negative control que demuestre que la prueba detecta el defecto.               |
| Cambio                     | SHA y PR; API/schema/migración/configuración efectiva afectadas; por qué el cambio cumple cada invariante.                                             |
| Evidencia                  | Tests por nombre, comandos/versiones, fixtures/digests, run/job IDs del SHA final, informes con resultados y exclusiones.                              |
| Compatibilidad y operación | Lectores de datos anteriores, rollout por fases, backups si procede, rollback de software compatible y límites explícitos.                             |
| Riesgo residual            | Qué depende del host, proveedor, infraestructura, AEAT o tiempo de observación; propietario y resolución. No esconderlo en una nota genérica.          |
| Cierre                     | Fecha, verificador y resultado de todos los criterios del hallazgo; los bloqueos externos permanecen visibles.                                         |

No usar `no aplicable` para una funcionalidad comprometida que todavía no está hecha. Una propuesta arquitectónica de este informe puede sustituirse por otra si demuestra las mismas propiedades y se documentan sus riesgos; lo innegociable son el contrato, la evidencia y la ausencia de regresiones identificadas.

### 15.2 Secuencia de comprobación de cada cambio

1. Reproducir el defecto sobre la base y escribir la prueba del comportamiento correcto. En controles de calidad, probar también un código/artefacto deliberadamente defectuoso: un gate que nunca falla no queda validado.
2. Corregir la causa en el propietario apropiado: fiscalidad en VeriFactu, integridad genérica en Engine solo si se demuestra un defecto suyo, atomicidad de negocio y almacenamiento en contrato del host. No duplicar primitivas criptográficas para evitar integrar un contrato correctamente.
3. Ejecutar las pruebas focalizadas y luego las suites afectadas. Para cambios de protocolo o estado, incluir los puntos de fallo de sección 10; para formatos, oráculo independiente y bytes exactos; para public API, consumidor de tarball y tipos sin casts.
4. Actualizar contratos, catálogos generados, matrices, admisiones, API reports y documentación que dependen del cambio. Generación determinista desde fuentes verificadas; no editar a mano resultados generados para cuadrar un test.
5. Ejecutar los controles completos con toolchain fijada en la matriz oficial. No instalar una versión arbitraria para hacer pasar un check de versión ni ampliar umbrales sin decisión y medición.
6. Revisar diff, ownership, cambios de archivos inesperados, secretos en logs/artefactos y resultados por job. Los scripts que escriben `.build` o `artifacts` lo hacen en checkout aislado, sin modificar la base de revisión.
7. Obtener revisión y comprobar nuevamente el SHA que queda tras los cambios solicitados. Para GitHub, verificar estado efectivo posterior a la modificación administrativa. Archivar evidencia antes de que expire Actions.

### 15.3 Condiciones de salida del alcance 1–9

- Los 84 IDs tienen resolución individual y evidencia; no quedan P0/P1 abiertos ni P2 omitidos. Una verificación inaccesible relevante impide afirmar cierre total. Si aparece un nuevo defecto durante la remediación, añadir ID y analizar impacto sobre cierres previos.
- Los 67 requisitos, 22 controles y 15 riesgos tienen prueba ejecutada o una delimitación contractual explícita dentro de su alcance; nombres de archivos y textos «passed» no bastan. Matriz actualizada automáticamente desde resultados reales con revisión de su significado.
- Los doce presupuestos de rendimiento se miden en condiciones acordadas, con corrección verificada y trazabilidad. Ninguna mejora de velocidad elimina validación, firma, persistencia o backpressure del escenario comprometido.
- Un mismo registro puede construirse, validarse, firmarse cuando corresponda, confirmarse atómicamente, enviarse, reconciliarse, verificarse y exportarse preservando bytes/identidad/edición. Se demuestran alteraciones, duplicados, concurrencia, cancelación y recuperación.
- Los 16 contextos requeridos y controles transversales se ejecutan donde corresponda, con productores correctos, sin skips inesperados y con expediente del SHA de cierre. CodeQL, OSV, secrets, dependencias y licencias tienen alcance e informes comprobados.
- Scorecard conserva resultados por check y resolución honesta de señales. Si se mantiene el objetivo literal de puntuación máxima, no declarar logrado hasta observarlo; historial, badge y evaluación externa no se simulan mediante configuración.
- Tarballs de los tres paquetes se producen reproduciblemente, funcionan fuera del workspace y contienen API, tipos, licencias y material debido. Sigue sin publicarse npm ni GitHub release como consecuencia de esta revisión.
- Política efectiva de repositorio y organización tiene evidencia suficiente y ningún drift relevante sin resolver; aprobación humana, privilegios y recuperación están operativos.
- Documentos de cierre de fases 1–9 se reemiten con referencia a este informe y resultados reales. Las fases 10 y 11 conservan sus tareas propias de validación externa, expediente, declaración y publicación.

Una colección de checks verdes no constituye prueba matemática de perfección. Este protocolo exige propiedades explícitas, pruebas que detectan fallos y límites visibles; evita declarar completas las superficies que todavía no se pueden acreditar.

## 16. Fuentes, autoridad y compatibilidad con el proyecto completo

La referencia primaria de alcance es la documentación del commit indicado, contrastada con código y ejecución. Se consultaron los PDF `Noeos-Estado-y-Pendientes.pdf`, `Noeos-Plan-Maestro.pdf` y `Noeos-Arquitectura-y-Orden-de-Desarrollo.pdf` del directorio padre: son antecedentes de producto y distribución de responsabilidades. No se añaden copias ni rutas WSL dependientes del equipo a los contratos del paquete.

Para normativa y protocolos, resolver cualquier discrepancia contra la versión aplicable y conservar la fuente exacta. Las páginas web vivas sirven para localizar documentación; no sustituyen un snapshot con fecha, digest y versión:

- [Real Decreto 1007/2023, texto consolidado del BOE](https://www.boe.es/buscar/act.php?id=BOE-A-2023-24840) y [Orden HAC/1177/2024, BOE](https://www.boe.es/buscar/act.php?id=BOE-A-2024-22138): autoridad normativa para revisar obligaciones y sus cambios, no un sustituto de la matriz de aplicabilidad del producto.
- [Información técnica RRSIF/VERI*FACTU de AEAT](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica.html), [esquemas](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica/esquemas.html) y [validaciones y errores](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica/documento-validaciones-errores.html): fuentes de descubrimiento para completar importación y trazabilidad de REV-001–006, 008 y 037–041.
- [Firma de registros y eventos](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica/especificaciones-tecnicas-firma-electronica-registros-evento.html) y [QR y servicio de cotejo](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica/caracteristicas-qr-especificaciones-servicio-cotejo-factura.html): incorporar el documento exacto a la edición y demostrar interoperabilidad con perfil y vectores, sin deducir una garantía de una URL en un JSON.
- [Canonical XML 1.1, W3C](https://www.w3.org/TR/xml-c14n11/): muestra que canonicalización es un algoritmo especificado con reglas de namespaces y normalización. La selección concreta debe ser la exigida por el perfil de firma, no «la última versión» por defecto.
- [SPDX 3.0.1](https://spdx.github.io/spdx-spec/v3.0.1/): contrastar los SBOM con el modelo y schema exactos que declaran, además de comprobar exhaustividad contra los paquetes distribuidos.
- Las referencias oficiales de GitHub y Scorecard figuran junto a los hallazgos y sección 14. La fecha del GET y la versión del scanner forman parte de la evidencia; no asumir que una futura interfaz seguirá exponiendo los mismos campos.

Verification Engine se toma como dependencia publicada y contrato genérico, no como oráculo de validez fiscal. Reutilizar sus Result, perfiles, evidencia, streaming y garantías únicamente según la versión fijada. Conservar una suite de compatibilidad que instale ambos tarballs; verificar cada actualización del motor y sus semánticas de preparación/confirmación/lectura. Si la corrección exige cambiar su contrato, abrir una decisión coordinada y mantener compatibilidad explícita, sin aplicar cambios fuera de VeriFactu en este trabajo.

La instalación y persistencia real de Facturación, un backend DSS/HSM, certificados reales, portal AEAT, recuperación administrativa y controles de organización inaccesibles requieren evidencia de sus responsables. Este informe especifica las obligaciones y pruebas que faltan; no atribuye una validación que no se ha realizado ni convierte su ausencia en éxito.

## 17. Inventario íntegro de archivos de la base revisada

Inventario de **328 archivos versionados**, obtenido con `git ls-files` en la base indicada. No incluye `node_modules`, salidas ignoradas, `.git` ni este documento nuevo. Se aporta SHA-256 del contenido para identificar el material exacto; estos hashes son evidencia de inventario, no una firma ni una certificación de corrección.

La asignación de REV por grupo es un índice de superficies relacionadas, **no significa que cada archivo tenga todos esos defectos**. Los hallazgos identifican funciones y causas concretas. En catálogos extensos y material generado se inspeccionaron estructura, procedencia, generación y usos; no se afirma haber validado manualmente cada entrada contra una autoridad externa. Los `.gitkeep` acreditan un directorio versionado, nunca una prueba ejecutada. El inventario del repositorio de referencia Engine y los PDF forman contexto, no amplían a ese repositorio el alcance de corrección solicitado.

| Grupo                                               | Archivos | Bytes   | Hallazgos relacionados                                                 |
| --------------------------------------------------- | -------- | ------- | ---------------------------------------------------------------------- |
| Configuración raíz, toolchain, licencias y gobierno | 26       | 188247  | REV-056, 064–074, 082–084                                              |
| Gobierno y automatización auxiliar GitHub           | 8        | 5274    | REV-069–070, 073–078, 080–081                                          |
| Ocho workflows de GitHub                            | 8        | 23922   | REV-056–060, 063–080, 082                                              |
| Escenarios e inventario de rendimiento              | 4        | 436     | REV-058–060; presupuestos P-01..P-12 de sección 11                     |
| Contratos y catálogos generados                     | 7        | 1083281 | REV-001–006, 008, 037–041, 063, 072, 084                               |
| Documentación del plan y contratos                  | 116      | 201586  | REV-001–084; matriz de sección 12 y autoridad documental de sección 16 |
| Manifiestos, API report y documentación de paquetes | 16       | 55211   | REV-048, 065–074, 082, 084                                             |
| Adapter kit                                         | 1        | 6399    | REV-028–036, 060–061, 066–068, 083–084                                 |
| CLI e I/O                                           | 4        | 31487   | REV-047–055, 060, 062, 066, 072, 084                                   |
| Adaptadores y transporte                            | 8        | 29927   | REV-017, 028–044, 061, 083                                             |
| API de aplicación e integración con Engine          | 3        | 35170   | REV-015–028, 048, 083–084                                              |
| Estados, puertos, transacciones y remisión          | 13       | 30447   | REV-017–024, 028–037, 040–043, 061, 083                                |
| Dominio, reglas, huella y ediciones                 | 10       | 49535   | REV-001–007, 018, 027, 046, 062–063, 084                               |
| XML, firma, certificados y QR                       | 9        | 20251   | REV-007–015, 037, 039, 045–046, 064                                    |
| Exports, schemas y diagnósticos públicos            | 4        | 12601   | REV-004–005, 026–027, 048–049, 064, 072, 084                           |
| Catálogo TypeScript generado                        | 1        | 687110  | REV-004–006, 063, 072, 084                                             |
| Fuentes regulatorias y snapshots                    | 15       | 136056  | REV-001–008, 012–014, 022–023, 037–041, 045–046, 063                   |
| Scripts de build, controles y schemas auxiliares    | 38       | 79046   | REV-004–006, 049, 056–071, 073–076, 079–082                            |
| Políticas declaradas e inventarios de seguridad     | 7        | 10800   | REV-064, 069–071, 073, 075–082                                         |
| Suites, fixtures declarados y directorios de tests  | 26       | 46868   | REV-001–064, 084; nuevos oráculos y pruebas de aceptación por hallazgo |
| Vectores y referencia Python                        | 4        | 7452    | REV-007, 019–021, 049, 057, 059, 062, 071                              |

### 17.1. Configuración raíz, toolchain, licencias y gobierno

Relación de revisión: REV-056, 064–074, 082–084.

| Archivo               | Bytes  | SHA-256                                                            |
| --------------------- | ------ | ------------------------------------------------------------------ |
| `.editorconfig`       | 188    | `a6b98ea7cb6d61ed8d430dd0dffa46c87012b5cf859d4ce7207898954951fdcd` |
| `.gitattributes`      | 251    | `d8287b3de1c6a0b4be667ed5bd98645452e95e90f650d9f807deffe08cfaf822` |
| `.gitignore`          | 406    | `f3bc31f1b57ff37987041e7d495a5df5a167a97c85b34226d09f13321456f655` |
| `.gitkeep`            | 0      | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `.node-version`       | 8      | `5b9d0e73029969ae9000117cb877f17bb9841c1279bfe8024e294acfcf017800` |
| `.npmrc`              | 158    | `2f5b59e7cf8d1ec3f7992a07254c8117664f55904516458d4d4c354156ecd47a` |
| `.prettierignore`     | 173    | `9dd0fcdd39b3fa772a401d33b01bcb5133131c9869d6afadfcf37f71fa8e9c58` |
| `CHANGELOG.md`        | 352    | `713365c1c4d9d9fff656e60aa20994f84ac548236d67d61f69648fcf28cb2bc9` |
| `CODE_OF_CONDUCT.md`  | 5228   | `c5c6f451b71e55ccddf3ac31fa64dbde629f597abb52f4bb0ddf23375e7a2220` |
| `CONTRIBUTING.md`     | 1639   | `e5eb6e48fae5cf5991dc5c19498ab7fc97acb874d1a647766c05bcccd6d3e38e` |
| `DCO.md`              | 553    | `feb5799d22814052b8359449a9b4c0d09b20d129ce3d3d7720ed17053a1d7bf7` |
| `GOVERNANCE.md`       | 1021   | `0bf02dfba723fd1f1954f2008f3d096c336722b4f25b8130db727cf270cc615d` |
| `LEGAL.md`            | 786    | `4bf451a6f4d3a0ebadb311e09b36cff1c7f292d5e0427da6076dc44f0edf220b` |
| `LICENSE`             | 11357  | `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` |
| `MAINTAINERS.md`      | 716    | `d3cb25be667d6d6ded065853ac04b99fbd5f795f2bbf2ae08a24df3be05f0d7d` |
| `NOTICE`              | 349    | `05c2fb43f8e0e399fc2d848074a206aae0b0a0b734a0c00f624cde794a29eac2` |
| `PRIVACY.md`          | 574    | `b52166d0c6a1c7e3dbb96d814d988fc9637850e3fed56834e490dc5a644e0bae` |
| `README.md`           | 1490   | `a995a2319788ac0b1b8e78fa08ac166b96869fe73d48ed3f281d862f925f250b` |
| `SECURITY.md`         | 656    | `83a5070491138c7d19c543cc5e33efdb185ee5d4d38874d301889c138b47dfd2` |
| `SUPPORT.md`          | 373    | `7c012eab868d8326194d6904c10a08bbf9c9ed551db5919ac7ff4d4e08b89b37` |
| `eslint.config.js`    | 1900   | `13042dbeba39e77fbf9f2fcd4ded78974a692fca53b62c38bd405bf41012314d` |
| `package-lock.json`   | 153655 | `27ed8ae47f6539a5de1b67365a852db95a42d1101734348ec976008bfe69ed83` |
| `package.json`        | 4903   | `bbfca164aaddbbfa169531326fd3fd421c879f38e9a7abd65ffc3e7b2e6c1770` |
| `prettier.config.mjs` | 242    | `06c72001d24136f641043661a719114b625d7c5fd412510b6396cc6a1460f25e` |
| `tsconfig.base.json`  | 909    | `aba8ffb405ad8117338ed57cf38ccee1ef82dd97820948ffd38fa0e2c52f878e` |
| `tsconfig.tests.json` | 360    | `7950c3475a5b239c72a1cd3aca5b61baef7550a215a12bf58a68607b672a9fac` |

### 17.2. Gobierno y automatización auxiliar GitHub

Relación de revisión: REV-069–070, 073–078, 080–081.

| Archivo                              | Bytes | SHA-256                                                            |
| ------------------------------------ | ----- | ------------------------------------------------------------------ |
| `.github/CODEOWNERS`                 | 249   | `17bbdec35daf5430689bb9c92b176e0b0595ccc5a98b38c6691c596875d4d817` |
| `.github/ISSUE_TEMPLATE/bug.yml`     | 872   | `a9e4182edac06bf0f23e2bcf0a1196117a218a3f72105372ae794fa030beb740` |
| `.github/ISSUE_TEMPLATE/config.yml`  | 432   | `34fdd8a5259d0227b710bac5d97c58ce5b4ce06c509197f9957628930353970a` |
| `.github/ISSUE_TEMPLATE/feature.yml` | 731   | `6f237dac85dffcd3f313dd0af3fca90b8ae58b684ea283d1812b5360c1ebb721` |
| `.github/ISSUE_TEMPLATE/general.md`  | 146   | `def09ee5736d832871d2d1d00b8f87a901b1c49155472f937742f62256a57e6b` |
| `.github/SECURITY.md`                | 964   | `0ce1b874b0d38d72b1dccbd95a6923bc2f6af003935c95aef44e1138cc1acb3c` |
| `.github/dependabot.yml`             | 1066  | `58c04808f05e74944d1ff9ea6ea3a2445ca1e8ba345594acebfdaee495f8fb62` |
| `.github/pull_request_template.md`   | 814   | `893df556ee7e6be428f23e1a9f3cf8f2677569308e12f232d9501643112564c7` |

### 17.3. Ocho workflows de GitHub

Relación de revisión: REV-056–060, 063–080, 082.

| Archivo                                      | Bytes | SHA-256                                                            |
| -------------------------------------------- | ----- | ------------------------------------------------------------------ |
| `.github/workflows/ci.yml`                   | 7102  | `90c7f86054b8d64b7741c0367d03df29226277cef6c0dd2d90d65ebef7299163` |
| `.github/workflows/conformance.yml`          | 3326  | `62e89803a6250ceb50fcd41138599ebb6f2f7ffc5d9c0b0ca00bd92129465664` |
| `.github/workflows/performance.yml`          | 1383  | `5901d8598119510660a9e7492af38c62e3824d32cde03b5631ddd557e34ad0b1` |
| `.github/workflows/release-candidate.yml`    | 2667  | `f5fead0baa6ccc0512b2ae00be075846b12c77af52bddeedff17627656fc8041` |
| `.github/workflows/release-verification.yml` | 1527  | `7e85762e603cd6f68924bb202faee119d3135141a85f3b610d83c8306e123687` |
| `.github/workflows/release.yml`              | 1415  | `1526d65241278b74b307c0315634309b510f9732208f002af25cefe739609ef3` |
| `.github/workflows/scorecard.yml`            | 860   | `89088b44b660a88d7bc606bf82b19787ac87c058abda34d8ad1d9491845387e7` |
| `.github/workflows/security.yml`             | 5642  | `54d3c79eb37f45d046bde1ac4f3d0dfcf2ce2675be07c6b8ee2ca0a1b54e0f50` |

### 17.4. Escenarios e inventario de rendimiento

Relación de revisión: REV-058–060; presupuestos P-01..P-12 de sección 11.

| Archivo                                    | Bytes | SHA-256                                                            |
| ------------------------------------------ | ----- | ------------------------------------------------------------------ |
| `benchmarks/baselines/.gitkeep`            | 1     | `01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b` |
| `benchmarks/reports/.gitkeep`              | 1     | `01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b` |
| `benchmarks/scenarios/foundation.json`     | 109   | `50d00d2456e8e6a5a59c9e177e53434b2a98f1956234a00ac07e042eb961cf2b` |
| `benchmarks/scenarios/phase-4-domain.json` | 325   | `d17734af5a259688d9c731e116d3e37967a8ebee579f70c557efe74910313c7b` |

### 17.5. Contratos y catálogos generados

Relación de revisión: REV-001–006, 008, 037–041, 063, 072, 084.

| Archivo                                                                              | Bytes  | SHA-256                                                            |
| ------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------ |
| `contracts/editions/aeat-rrsif-1.0@2026-09-03/checksums.json`                        | 1914   | `90e4152c9416ceb76ab7a9ba3edcc8197d2888b9f52202daa4dfc394ac9eed12` |
| `contracts/editions/aeat-rrsif-1.0@2026-09-03/constraint-catalog.json`               | 586996 | `8813aab13c7108df67246783e251a4474110a968f7b7acb92bf3ad1cc3985609` |
| `contracts/editions/aeat-rrsif-1.0@2026-09-03/manifest.json`                         | 3286   | `0fb7eead36d4347a6d14206f5ec26c103920b1c86e972ae2f6874b43e48d4b73` |
| `contracts/editions/aeat-rrsif-1.0@2026-09-03/operation-catalog.json`                | 2866   | `27fa9b2482fc0c0cee090709617a98581a777092836d73705c534eed30f8e148` |
| `contracts/editions/aeat-rrsif-1.0@2026-09-03/schemas/contract-manifest.schema.json` | 992    | `abdb49f16d1a2655e21e7434cc0752ed4ba1607ac73c9544bd3c5a04b5af7e47` |
| `contracts/editions/aeat-rrsif-1.0@2026-09-03/source-map.json`                       | 260538 | `0d28f14a49c0e62b109bdc0e851f73ee0098f0007c9e7767e102b4d85098d630` |
| `contracts/editions/aeat-rrsif-1.0@2026-09-03/type-catalog.json`                     | 226689 | `83a228e58d603a99e9671e913813a381965d0b4fb880b6e771edfd746fbbb9e7` |

### 17.6. Documentación del plan y contratos

Relación de revisión: REV-001–084; matriz de sección 12 y autoridad documental de sección 16.

| Archivo                                                               | Bytes | SHA-256                                                            |
| --------------------------------------------------------------------- | ----- | ------------------------------------------------------------------ |
| `docs/00-gobierno/00-indice.md`                                       | 7995  | `31faa248e95a1560bd4153ff11b248508c08689e98b21f5b71ae5e4831621495` |
| `docs/00-gobierno/01-autoridad-documental.md`                         | 1466  | `3d9df2a9b7ef2e56bb236c3ba0225827767b766865720b818cdba1da93dafc23` |
| `docs/00-gobierno/02-decisiones.md`                                   | 7933  | `81e5e24ceb29d664e3167f0a0b87ae39a731b13b856cce260da6ea09b843c0ec` |
| `docs/00-gobierno/03-glosario.md`                                     | 3073  | `ee3476bef40de941d96adf12cd0951d5f29024c4e2b6787266acb0923107e510` |
| `docs/00-gobierno/04-trazabilidad-requisitos.md`                      | 1394  | `b2dbd420dfb6b081d24f90336b8f7f4ff3a299af6553a07cb7d3c1a32f743051` |
| `docs/00-gobierno/05-mantenimiento-contribuciones.md`                 | 1070  | `145ba84d5832a8047362a783e89904fc9f23a87d33e7827589e442278e62f6db` |
| `docs/00-gobierno/06-aprobacion-plan.md`                              | 2071  | `7cb7aa530b00e7ea3e6adfe6248a6fc2b9652794b4dc24075757892c07cb22a2` |
| `docs/01-producto/01-vision-alcance.md`                               | 1329  | `05ebe5792632aa1c151a2760bb7166707f11b98f3acdea4ef51a3c89fa58dbd6` |
| `docs/01-producto/02-mapa-facturacion-obligaciones.md`                | 1415  | `1742a4ab1ff873803e9f95c98674e6ef6f49983497abe9c50482d4f1d71d23d6` |
| `docs/01-producto/03-actores-casos-uso.md`                            | 1240  | `032caeada3cd5175aa8878eb58b32b99a0e0de53cb3abbd6b566696de542d30a` |
| `docs/01-producto/04-modalidades-cumplimiento.md`                     | 1236  | `5fcc34340b377ae81d314fb79b12598960775d0ed0a3138f66fc449c9ef841e5` |
| `docs/01-producto/05-requisitos-no-funcionales.md`                    | 1247  | `0fe7160e3461bf868ebf7c314e23aeddf5c2610429252ec94a34df997d36d50d` |
| `docs/01-producto/06-limitaciones-garantias.md`                       | 1083  | `a89de239ce6125a40afbc2f30d26e34ef164354c9fd83244b45be1d6b8511899` |
| `docs/02-legalidad/01-jerarquia-fuentes.md`                           | 1491  | `fb99b96fcc95f77b468aaa4747c6c7a3916cc0d5bc7518310e9edc9acdc2db5e` |
| `docs/02-legalidad/02-marco-legal-vigente.md`                         | 2010  | `185d8c7999929d808b7e6f87cf6b65343584de09ed7f1cb8fd212eb2640cba1c` |
| `docs/02-legalidad/03-ambito-aplicacion-exclusiones.md`               | 2522  | `6c13f2c53514c8c7417f809ef5831f53958403fe8e23021d7d516e4e4d1e4e39` |
| `docs/02-legalidad/04-registro-fuentes-versiones.md`                  | 1420  | `792c53da206546d80f4000d4c9468f25136ac9afeb93518354b4d03f0c67d413` |
| `docs/02-legalidad/05-matriz-norma-requisito.md`                      | 2376  | `6fe636c98aa07d9a2037b62e03da39ffe8bd5adf1ef2141ec8514421f347e7c2` |
| `docs/02-legalidad/06-criterios-interpretacion.md`                    | 1021  | `2d34bec86c981be37f0164b1a78a95013b2886d4d140014be7dc4a581a8f960d` |
| `docs/02-legalidad/07-vigilancia-regulatoria.md`                      | 1028  | `f1de96406a6cc7e3a83abdbe39230cd2680b4c43e7186e549372f699720da8e1` |
| `docs/02-legalidad/08-declaracion-responsable-expediente.md`          | 2232  | `6e1044f67a37efc3069ce2744dd0ad60f05453681cebcf4c8e5294e4ab68a0f9` |
| `docs/02-legalidad/09-conservacion-prescripcion-prueba.md`            | 973   | `21c031b88b03373a5635fcfc754c4656f0214f1eb310950ae1e4676ec42d92ff` |
| `docs/02-legalidad/10-regimenes-relacionados-fronteras.md`            | 939   | `98ff87a88dfafeabc60ca17034f2c3dbd11edc7d8494c1837f4ca8bba5b51782` |
| `docs/02-legalidad/11-licencias-reutilizacion-pi.md`                  | 958   | `68f945951a52dd204b8dfc4fda59886352a917a378563fa1513d394d85767d68` |
| `docs/02-legalidad/12-importacion-fuentes.md`                         | 1416  | `f4691f7edfddedc073328c06969c3b209df2e1fc1ceb88b3090cf2f3755bda29` |
| `docs/03-dominio/01-modelo-dominio.md`                                | 1125  | `70910ff0289899cacdc41370f974f6b112aa747e66516d5852f35fb4f922fac7` |
| `docs/03-dominio/02-identidades-sistema-instalaciones.md`             | 1038  | `3d2621a2b0171ed1ec6933af2a09bd7cb353a5db6c9d94005df87c289d9fa128` |
| `docs/03-dominio/03-frontera-factura-registro.md`                     | 1002  | `5849db6148473550fa617b96990aa8f6d8b325efef939b36b9e12ca3025c51de` |
| `docs/03-dominio/04-registros-alta-anulacion.md`                      | 2461  | `8c2523efd616ec0f220efe408ba25fd33a45937a0351196addb7db176f64d334` |
| `docs/03-dominio/05-registros-eventos.md`                             | 2139  | `fdb1443a2ac32695cb4b630157687ded8683508723f81419780bf1c5d84c5cbd` |
| `docs/03-dominio/06-secuencias-encadenamiento.md`                     | 962   | `fac7fb00159d41f58c63fcc3f45edb202fa453fbf2fc4c077bd68c1c1d7ce95c` |
| `docs/03-dominio/07-estados-rechazos-correcciones.md`                 | 1828  | `31c324af2c886939db9176828b2a664bd632004248b7b6723239c807fd910209` |
| `docs/03-dominio/08-catalogos-reglas-diagnosticos.md`                 | 1023  | `b8c022570a3c2d206d27c9d761fd4ce6b2e7a7931b4210aec81011d9b17c9e3b` |
| `docs/04-contratos/01-api-publica.md`                                 | 3408  | `c2e8ef74e47bd28774dd8679d443dfcd8c25e2d2271fd3d8f7fb994d5612322b` |
| `docs/04-contratos/02-esquemas-formatos.md`                           | 900   | `352d70f1fb7bd780f521f422007275fbda1d041309d298b37d232b98ad55bc62` |
| `docs/04-contratos/03-cli.md`                                         | 2451  | `c82055478a1417a356bf10c8dec85f1c31d96ea54cb2ac5f664241e31ac1e8b7` |
| `docs/04-contratos/04-puertos-adaptadores.md`                         | 3293  | `17ce14894c9a43a949e82ea2adfdd4157c4057f558a1c19f2a9c72fc26c412ec` |
| `docs/04-contratos/05-errores-resultados.md`                          | 946   | `8c67bed9769aea085c518b8cfc5eb1505fbf1305e89376f78e886759e6088995` |
| `docs/04-contratos/06-eventos-observabilidad.md`                      | 899   | `f00fb5eb26c4960544287417b3817e9f9c5193d12a0b8fa826043e2e7f3b2dbc` |
| `docs/04-contratos/07-versionado-compatibilidad.md`                   | 1056  | `bdb7f3138459f166589cafe1c58734d49e111d5b42044ccfff9d344d267becfa` |
| `docs/04-contratos/08-integraciones-engine-facturacion.md`            | 1021  | `b491ebeb4e73d5bf146f37678390412cb3599595254e8405ed651b9dbfacec58` |
| `docs/04-contratos/09-generacion-contratos.md`                        | 1049  | `9a88a062bb844902e874a70f04e6bcfa92cd9285248a545eea1d196a64629b7f` |
| `docs/04-contratos/10-api-fase8.md`                                   | 1059  | `841402c93322134d0fe91d14ecf38482713cad69aa03c9c4085c07b9d841d2c8` |
| `docs/04-contratos/11-cli-fase8.md`                                   | 827   | `0e9cbaaa31940741df6fd58ed1807a3d28dfdd806cb5c69c3dde00123b43333c` |
| `docs/04-contratos/12-kit-adapters-fase8.md`                          | 632   | `806acb028b02047d76bc7b510cdbb87ea363cf66fb046dd723a07e02559eebc9` |
| `docs/05-formatos-criptografia/01-serializacion-oficial.md`           | 1048  | `db667eac29e5a483d1011f13e826733d0d8b3c1ee9114661b05f5b162424cd8f` |
| `docs/05-formatos-criptografia/02-huella-rrsif.md`                    | 3074  | `19ad2e88e1cd283796306acc77d646ea63f5fcc38131db1bff094a71d8ca0411` |
| `docs/05-formatos-criptografia/03-evidencia-interna-noeos.md`         | 884   | `904cb3a2ab9fe6cf267cfb5718c7ca69f4b06f84f93eea5f9679ce6a48856760` |
| `docs/05-formatos-criptografia/04-xml-xsd.md`                         | 966   | `ab0f9adc3f2a52f909030761a0e6a5f729e0482d4145acf90b81b85bf79c83d0` |
| `docs/05-formatos-criptografia/05-firma-electronica.md`               | 2631  | `7a025cb8500988883018ce488bc5bf9e2fdc151ac23b5376b19bbb5ca6021d9f` |
| `docs/05-formatos-criptografia/06-certificados-claves.md`             | 970   | `eaaa1686863acbe573a060be13184729f7c9a5027d08915ce90adfcfe811f720` |
| `docs/05-formatos-criptografia/07-qr.md`                              | 3040  | `09e962878acf18fdc282dc569db7f580cebbffe681ca1abfe9f9b509ff266046` |
| `docs/05-formatos-criptografia/08-vectores-conformidad.md`            | 830   | `67ffde9c604bd684c8731e402807a747a9d24bb472daf2424738ca08a63a718b` |
| `docs/05-formatos-criptografia/09-implementacion-fase5.md`            | 2234  | `6154dc092d52e06d2b1d52a55814ec2aa61283e91e0da6d9b4a6d69a3189a351` |
| `docs/06-comunicacion-aeat/01-servicios-entornos.md`                  | 2980  | `ce54267b424239c31d6a93209a458f3190a112737391cf4b06615ad86f57c3ca` |
| `docs/06-comunicacion-aeat/02-soap-https-autenticacion.md`            | 1186  | `5f6b6dc3e66c44e8319cbcb82b1773267d93d6acf8a761486cf4e6c7938df6b2` |
| `docs/06-comunicacion-aeat/03-lotes-orden-remision.md`                | 1844  | `293eacad830eb735b8a48608e5356db232fd3cb7b96124a64698489c1049ffb8` |
| `docs/06-comunicacion-aeat/04-respuestas-errores.md`                  | 2376  | `335f6ce6920f221a11977444cd0c0c03fce2c80adc431acf251ca8ca19aa26d8` |
| `docs/06-comunicacion-aeat/05-idempotencia-reintentos.md`             | 878   | `e57bf304b99cc1b60f3891dc54443a02cadb5d8e58c476e9bd5ae123ce88f4ce` |
| `docs/06-comunicacion-aeat/06-colas-indisponibilidad-recuperacion.md` | 942   | `01190e98d32cd7e0f6363dc8e2faa2256ec27e4dbc5a773d00c581ab88d0395a` |
| `docs/06-comunicacion-aeat/07-pruebas-externas-aeat.md`               | 874   | `9f14ae3cf6336b3022cc371b6d80d5686496a75d86b9941f6ab99c7d044fc94e` |
| `docs/07-arquitectura/01-arquitectura.md`                             | 875   | `c7b17dc4a4e5d7c49ed434023ba3a2c0626b9f0926d26f3722fd4fb9e548e471` |
| `docs/07-arquitectura/02-estructura-repositorio.md`                   | 1259  | `b024f758fdcc81badc3aa0348a1da1372957958e79f8ff47b2ff735e266ca7a8` |
| `docs/07-arquitectura/03-flujos-fronteras-confianza.md`               | 949   | `33444700feab9e2a328bf3f4bdf91920f966fa4ef235977adf4bcb5c2bd64c5a` |
| `docs/07-arquitectura/04-dependencias.md`                             | 1011  | `b9452c17bee73d3846c52f395ffc68c6ca937c14228ce15f815d97ca3fef5c6e` |
| `docs/07-arquitectura/05-persistencia-atomicidad-outbox.md`           | 999   | `c99406f274244a13115cfbddbf3ec6908911cba717b98939009e4d5cfdd1382a` |
| `docs/07-arquitectura/06-concurrencia-streaming.md`                   | 962   | `d1fdaad8fe198cc42adea3b1f04266cc50aa40c60c60a25d566b98359fc1961b` |
| `docs/07-arquitectura/07-configuracion-aislamiento.md`                | 899   | `de87a0e4cbb80b0e344f273a045750e9b5e262f6e8896d86ee16017afd22286e` |
| `docs/07-arquitectura/08-implementacion-fases-6-7.md`                 | 3752  | `2a3a07c910fde85581c450e1f6930747e4ed7e066680b2b2ad2183bb780ceeeb` |
| `docs/07-arquitectura/09-implementacion-fase8.md`                     | 2158  | `7cfaf74c3b00fc01f28ce638e44cea8e44b844ca24df5a2f7d5d0ab85173de43` |
| `docs/07-arquitectura/10-implementacion-fase9.md`                     | 591   | `28d3d914a64690b1f3ede1a25d4b6f40bc83efcba5b7257f6ccf14dfe1de49de` |
| `docs/08-seguridad/01-modelo-amenazas.md`                             | 969   | `2808bcacb15db9c42d6a67a2dbc3fa12332f4dcba1014688fb82367e063e2cee` |
| `docs/08-seguridad/02-controles.md`                                   | 892   | `391cf14c4e05b162e768190b41f0d2b1a930f20c7c353e720ec14977d227633a` |
| `docs/08-seguridad/03-seguridad-xml-red.md`                           | 924   | `e9f0c486f4419fc577fa99e2ba2325297628be139ff9ef7267af823cd339465b` |
| `docs/08-seguridad/04-claves-certificados-almacenamiento.md`          | 856   | `a1fe39125ccb80dcf4ffbe8724c04dd5644036b5d76eed2f3365151995278f80` |
| `docs/08-seguridad/05-cadena-suministro.md`                           | 795   | `20cb32da9293d9ed02e98394a09b98cfedc324d90ccd894458210aef702a1c3e` |
| `docs/08-seguridad/06-vulnerabilidades-incidentes.md`                 | 838   | `dded3433a82d15b99133c8c290abf67033cb089aa786586b83c48ceea41fc405` |
| `docs/08-seguridad/07-privacidad-datos.md`                            | 961   | `3c7632b65f5991dc5648fcf1d3644bb0e2c8264e62c9dae4e6f569255339302c` |
| `docs/08-seguridad/08-hardening-fase9.md`                             | 873   | `0adf0e9c5c491fedad7be32c698513111b10df44d969e3252ca261dcbfd06d1f` |
| `docs/09-rendimiento/01-presupuestos.md`                              | 2779  | `c19f0e85adb0c0057963009540fb4e26618db5a51d990b7e76c9628f45f89096` |
| `docs/09-rendimiento/02-benchmarks-regresiones.md`                    | 947   | `f5c27ea35b76e375d09e2a2e9128807a00ebc2f1d9d60e1d4a8fc8920abdbc57` |
| `docs/09-rendimiento/03-capacidad-backpressure.md`                    | 868   | `b4cdc00fa3dd085d9f8ad5d978977aac17ead52b6c3335da76d91558bae2bc08` |
| `docs/09-rendimiento/04-evidencia-fase9.md`                           | 502   | `229b4ed276e9fa2b190873773615b66b8ff960fdf7aa0a36086397c4239fda81` |
| `docs/10-calidad/01-estrategia-pruebas.md`                            | 860   | `c4260edfde72286998077237cf6bfe0cdb403d196db363e218892c58c3ac73c8` |
| `docs/10-calidad/02-ejemplos-vectores-oficiales.md`                   | 748   | `182df5ddf0bb0dd3af3dd620398f42d6ff198e7c192fabec7843495b8f967a14` |
| `docs/10-calidad/03-limites-alteraciones-negativos.md`                | 902   | `2c686bcb2d183b840f2a888cb2d69239d58b32be38bcabdb299ceb1c1585fd1d` |
| `docs/10-calidad/04-property-fuzz-mutation.md`                        | 895   | `67218e2de7948af8d7546460647d1883858aff0c0a617f4729a2708e193d6aca` |
| `docs/10-calidad/05-ci-calidad.md`                                    | 1581  | `1ebcdbf28e812e1875e5f5915f8c17518fe923626f2b669e28de537cd2aa57f5` |
| `docs/10-calidad/06-auditoria-lanzamiento.md`                         | 969   | `9d9c1646f8e3a8f9b990d4b57c832c89609f8bf5d992f97c9953910158e4076f` |
| `docs/10-calidad/07-contratos-generados.md`                           | 765   | `7b58d95db864970aeb4b6f5738f3f1fd4bc7080a88db931fcd9b2fb053b80a2e` |
| `docs/10-calidad/08-cierre-fase8.md`                                  | 691   | `545bfa2942663b287caec5a5cf6eb35dee964be64aa73566c4a03ce808ca664e` |
| `docs/10-calidad/09-fase9.md`                                         | 571   | `d9b1915d5a2627162bf5f6231368e5158a7e6b7ea5ced703af87500e5c5282ce` |
| `docs/11-repositorio-entrega/01-github-flujo-cambios.md`              | 885   | `285a62a33081c6e1d6b7aea917899aa63aacc527bc8589baadb5027df7e68b75` |
| `docs/11-repositorio-entrega/02-configuracion-github.md`              | 3142  | `c0c967d2fcf972611a8a27ea2eab82c4d20a480650351f1933186c87cc22aa9e` |
| `docs/11-repositorio-entrega/03-toolchain-dependencias.md`            | 1243  | `41bb35457a70c4faf27928c9b9d3832e930fc89085026473d835374e4960bbfd` |
| `docs/11-repositorio-entrega/04-build-reproducibilidad-sbom.md`       | 860   | `e6327ef83031ec2be8f19d5c3c9e9b96238a6aefb675649e1a41bf1c7f9350d9` |
| `docs/11-repositorio-entrega/05-versionado-publicacion.md`            | 838   | `e7ea5203e3bb9a1eca58ff1ab8ee1742b6640cd381c8a0fc03bf9690763c8cfb` |
| `docs/11-repositorio-entrega/06-release-candidate-estable.md`         | 817   | `ad371c07dfc738cf22e49f5f5660eee8410e63b3d23c3197a7c2605d03cb13ef` |
| `docs/11-repositorio-entrega/07-verificacion-release.md`              | 730   | `f7e2d17e3a94cddf1b78eecfed3c6c1098cf7244064a2dbac4a286880a56b4d9` |
| `docs/11-repositorio-entrega/08-soporte-recuperacion.md`              | 862   | `ecef0aa21e7e7e347076bb75056cf99485638e11768e47609a3148948e6f5433` |
| `docs/12-roadmap/01-roadmap.md`                                       | 1778  | `9f7359c38f751e6515ffa0243a6deddc02e734977ca7af9eeb38b99927c447bf` |
| `docs/12-roadmap/02-criterios-cierre.md`                              | 812   | `39cd4f740994fbf62aa95c1f5b91f4c00357e9dd21d039d987069ba7397f3c60` |
| `docs/12-roadmap/03-riesgos.md`                                       | 3384  | `ef8a37313ee364999d6d623d995be746506756446b024f0e9d04ece27ff2e6aa` |
| `docs/12-roadmap/04-preparacion-release-1.md`                         | 828   | `971fcfeaa0344997670bdb3047854e5a74a56536986f7ae7f8ae7364fa4ac3ae` |
| `docs/12-roadmap/05-cierre-fase-4.md`                                 | 2438  | `5adfbcc1e601033cab78c682f62979bf3ca17b35159b145f3d3615a788402149` |
| `docs/12-roadmap/06-cierre-fases-6-7.md`                              | 2091  | `462d92411fa0c7604d86e2fd63c4d6b4c8626116f9a6739f2492b4998c3d2a49` |
| `docs/12-roadmap/07-cierre-fase8.md`                                  | 654   | `32c11be46dec5a2d3ce2a24f262b73d78c8e2db225fa1bf55f314d7a2d22fee9` |
| `docs/12-roadmap/08-cierre-fase9.md`                                  | 820   | `0dece289780ad81edf79fad5df9524f4cd081d82e3b0f6a86db804f64bf6873c` |
| `docs/README.md`                                                      | 4679  | `7ecfb0ac9c7edae77ea963acaa2201534a3d476630570334aeb4095884976661` |
| `docs/anexos/01-fuentes.md`                                           | 9960  | `97d9c29ad783a90fc0ab89d02e5e03fe718c220112a6d11a00f39acccd1d0457` |
| `docs/anexos/02-matriz-requisitos.md`                                 | 15468 | `f0d6c0b83f7357c9de25d9328ccd81fa1c87331e6973b630c1f90e01fc2cc01b` |
| `docs/anexos/03-matriz-controles.md`                                  | 5418  | `83612d8fca32dda8c1f79e06e5ea8cee82cdbf77c3aa03dbc0a97038074e3943` |
| `docs/anexos/04-diagramas-estados-datos.md`                           | 959   | `068615344019943265f9df6961c66816c1d7aadc3bdd4dfc62fa4de29ac7ad4c` |
| `docs/anexos/05-plantilla-decision.md`                                | 534   | `cb7021622f498581ca812444b3ad9374b1d7e76b5cf4487fdbd421031d2b7451` |
| `docs/anexos/06-plantilla-expediente-release.md`                      | 913   | `28817a664aa1eb51bab519724714287dd6b90d8a24156959303dcf9d1362c195` |
| `docs/anexos/07-validacion-coherencia.md`                             | 1018  | `1da69486cbfb7e143f858b5439e20606c37c04f4c3c595fb2efc2b76e64e81cf` |

### 17.7. Manifiestos, API report y documentación de paquetes

Relación de revisión: REV-048, 065–074, 082, 084.

| Archivo                                   | Bytes | SHA-256                                                            |
| ----------------------------------------- | ----- | ------------------------------------------------------------------ |
| `packages/adapter-kit/CHANGELOG.md`       | 45    | `8f1dd656f6e1bdb29127ffdd1d619685ca59f450a42ddcedca9a86f86747e842` |
| `packages/adapter-kit/README.md`          | 397   | `e959ef708d89e11ed275af8a2b59aaee340b76333d0f0d3612152f39e41ea9ba` |
| `packages/adapter-kit/package.json`       | 990   | `f4a36149399b8c8eefa8e8b0f5771a8593fe9c31ba35ab534be105860515323b` |
| `packages/adapter-kit/tsconfig.json`      | 285   | `04dc1c8ade35dbf8f01e6cf7e029403a8732adc38a4bc05faad3e3bebacd1b52` |
| `packages/cli/CHANGELOG.md`               | 98    | `e110c545b6056079bb35e57b564bf028856cc5881663c961d233fffae5cebc9e` |
| `packages/cli/README.md`                  | 408   | `f84acb5a0a64b8c6cdba861b5cbc6609fd671169b9aed830460fd9ded4f10f3e` |
| `packages/cli/package.json`               | 1131  | `0fc58cab63fee3650034188d133cefb7781e60181f25abe187c79ed74a514a04` |
| `packages/cli/tsconfig.json`              | 309   | `45727493bb4917bae127b0905d71bc25f7153adc909ac9207edad522029fd71b` |
| `packages/verifactu/CHANGELOG.md`         | 614   | `1a6912ada9f609a027421a88e8099066d847502f51362a5fe674206b6e6a218d` |
| `packages/verifactu/README.md`            | 297   | `c21d491ac5ee34b63fb4d747b5a7d5563111bf6f7890404280ea25abe4579f38` |
| `packages/verifactu/api-extractor.json`   | 593   | `27a84a46bca8ac5464f9efa3a97404522e96430de14854de559e223e3ad4a4b8` |
| `packages/verifactu/etc/verifactu.api.md` | 45564 | `390b422ec66602bb0e8a46b33336d1db65b7187fb7325913c4433462c7b89638` |
| `packages/verifactu/package.json`         | 3704  | `583583c025a21074a130273c4017baca74091e7f0693e79da9b9a04b5075e221` |
| `packages/verifactu/tsconfig.cjs.json`    | 341   | `7b25b69f63e47de08f8d7237e217dbd91dde00ade54bd0914ee87a55fe8e2b98` |
| `packages/verifactu/tsconfig.esm.json`    | 248   | `55e0e0e5f1f4ec80b72c164ac6f0f00d953917f274f2f82052f32f230b649f4f` |
| `packages/verifactu/tsconfig.json`        | 187   | `44e499e97308614472ffc17b01b0681d9d487b15e59d854fe903aa9339876509` |

### 17.8. Adapter kit

Relación de revisión: REV-028–036, 060–061, 066–068, 083–084.

| Archivo                             | Bytes | SHA-256                                                            |
| ----------------------------------- | ----- | ------------------------------------------------------------------ |
| `packages/adapter-kit/src/index.ts` | 6399  | `09fa5687bcffdfe45b3185d11cc6c1589acc0ed3234dbb1573e80b81fbe4d446` |

### 17.9. CLI e I/O

Relación de revisión: REV-047–055, 060, 062, 066, 072, 084.

| Archivo                             | Bytes | SHA-256                                                            |
| ----------------------------------- | ----- | ------------------------------------------------------------------ |
| `packages/cli/src/cli.ts`           | 20715 | `03c0e066f6b715a0e6c86ea1a853a7641e00d30bdb5d5daf2debeaaa5e3ffb15` |
| `packages/cli/src/io/json-input.ts` | 7538  | `b03dc6e98c2571a2f63b6da5249cd17021ccf9768636b849962783602322da0b` |
| `packages/cli/src/io/output.ts`     | 2982  | `392151beae74e80a7e302210116e844ac4314ce587a63b982120f9f0c660d24e` |
| `packages/cli/src/main.ts`          | 252   | `4369ee2b4f28984026df6566f44c812590fa9df1670a0874a7175e4c2650028c` |

### 17.10. Adaptadores y transporte

Relación de revisión: REV-017, 028–044, 061, 083.

| Archivo                                                   | Bytes | SHA-256                                                            |
| --------------------------------------------------------- | ----- | ------------------------------------------------------------------ |
| `packages/verifactu/src/adapters/index.ts`                | 287   | `e2dd7057e014dbcd899ed276f912aa9537193d6ec5aadef4cb7d6880dfabbe00` |
| `packages/verifactu/src/adapters/memory-outbox-store.ts`  | 6094  | `eafafca76adb3fe1f394a5ff4cf0a2fc4a20d9bf77e13fa1fa0ca8cd65aca0c5` |
| `packages/verifactu/src/adapters/memory-record-store.ts`  | 5881  | `94bfaa0d04c5531586e09f7e7a53ab1853957665111674e1b81321cbb78f93c2` |
| `packages/verifactu/src/adapters/node-https-transport.ts` | 7606  | `b1b2360871303d6b3797c04da5f2f050bb4e2fe65c6f4d341eac6cbd94619d37` |
| `packages/verifactu/src/transport/endpoints.ts`           | 2783  | `18c8f058ac64fef9838eceee7ecffb65135a34a43d02a8c71dc59dbb5871ca8e` |
| `packages/verifactu/src/transport/index.ts`               | 129   | `ff32e9b2cf1afb6f27fac72b648daf513b224c8bad497cc2059b880f2b7dec8b` |
| `packages/verifactu/src/transport/response.ts`            | 4947  | `7d7995192a62822819317e9b1c3623dfc09e6e938420a89227dddb10d38278a8` |
| `packages/verifactu/src/transport/soap.ts`                | 2200  | `612576f90156c34ca917ed0fe3251c4efc35ecbdcc8a16d01d207df9967de358` |

### 17.11. API de aplicación e integración con Engine

Relación de revisión: REV-015–028, 048, 083–084.

| Archivo                                             | Bytes | SHA-256                                                            |
| --------------------------------------------------- | ----- | ------------------------------------------------------------------ |
| `packages/verifactu/src/api/create-verifactu.ts`    | 18627 | `6a612015dcb8b3cc1ab610902f3c6809e2783ff5b83b270e94a8316ef01aef54` |
| `packages/verifactu/src/api/types.ts`               | 5063  | `bf83f815ab1d4b240f6fbb14fd1e5f4b4364bfff1d44209e7228490eec2b4e68` |
| `packages/verifactu/src/evidence/record-profile.ts` | 11480 | `78feb315b8de3d487cb78b975c521408434ae14e9e0aacf1147f07712d240943` |

### 17.12. Estados, puertos, transacciones y remisión

Relación de revisión: REV-017–024, 028–037, 040–043, 061, 083.

| Archivo                                               | Bytes | SHA-256                                                            |
| ----------------------------------------------------- | ----- | ------------------------------------------------------------------ |
| `packages/verifactu/src/application/commit-record.ts` | 2858  | `9632d0099dea088561bde2819a7cf933a5d84034a3f843902845365651434321` |
| `packages/verifactu/src/application/index.ts`         | 111   | `b71d5f8b771712bfb20c1a086b146b80d88f700a4f1c5d5a35f2033c15c0114d` |
| `packages/verifactu/src/application/process-queue.ts` | 9282  | `700bf28dadf1f7a69e55ded945fa57d5ffaaeda03ea6ca19efedf28b48398b92` |
| `packages/verifactu/src/outbox/index.ts`              | 126   | `e702fc92fef43760776b612ba46d8119cdb4b4422a4097cf88f1b2d39598090c` |
| `packages/verifactu/src/outbox/retry-policy.ts`       | 1904  | `d15d6dc254d8fd252df9727d4810d1b5931d18613d584ac2b9fc446aa2383ecf` |
| `packages/verifactu/src/ports/index.ts`               | 4621  | `a14b005dbc498d34bddc8821e024af9179b5c45e3b3ba7eea2e316555d4eace6` |
| `packages/verifactu/src/state/heads.ts`               | 1958  | `4691fa811bc732ec7d54c018738304d9ca09791869897a808ac5de10ea12aef7` |
| `packages/verifactu/src/state/index.ts`               | 327   | `bc996de2d0bf6f97a2a82fadfbb1dc6cb2ab6a7f62937b8c3c51e878217ac3e9` |
| `packages/verifactu/src/state/model.ts`               | 2398  | `e98a15ee4e6aff3c5ebc4fedd305267e5d9795283be5fa937db1416f929d5c15` |
| `packages/verifactu/src/state/transitions.ts`         | 1756  | `8905bac55c3a7d7c4d716ebfc8e9ae1f0160916923add1cd020e5c910ddee392` |
| `packages/verifactu/src/submissions/batch-builder.ts` | 4544  | `8cf57dc426ed9495bf15109961caa15710469b5d23e37638d3926ebe757b521a` |
| `packages/verifactu/src/submissions/index.ts`         | 103   | `0e5e610accfe78d9ae4933f36d88702c6b98e88011484b3b9f7d3d616d515ac2` |
| `packages/verifactu/src/submissions/model.ts`         | 459   | `c7d55353ef9c5988d094958446f4b5d8673bf2ed80f36d1c969436f156ab9ce1` |

### 17.13. Dominio, reglas, huella y ediciones

Relación de revisión: REV-001–007, 018, 027, 046, 062–063, 084.

| Archivo                                                  | Bytes | SHA-256                                                            |
| -------------------------------------------------------- | ----- | ------------------------------------------------------------------ |
| `packages/verifactu/src/catalogs.ts`                     | 479   | `6a6888584de99770f032bfe06d863e4a51c58807e97a4b8fd62e2f89af8b7773` |
| `packages/verifactu/src/domain/applicability.ts`         | 5517  | `dca7034322974386a60d2cc221e8e04858223813415ba8a1308a15fb0aebb2e9` |
| `packages/verifactu/src/domain/immutable.ts`             | 359   | `b874bd5c70c1fa866a70d74128b5ce15844f7c78683167517dbe6a82a543df61` |
| `packages/verifactu/src/domain/values.ts`                | 5791  | `d76fbfaaffc271bef00467030a916c2dc57bb380e6717cb2a688eb32e1333fd1` |
| `packages/verifactu/src/editions.ts`                     | 976   | `09aa37af3f9e5308aac5b2594edbeb04e0ceeeee80bb0e281cf14252160ab4d8` |
| `packages/verifactu/src/fingerprint/rrsif.ts`            | 12071 | `759e0fbb13f2a0c4f5b8a2e1d8cf707d6c9e26005c1e752a220ff2bb697ca6c9` |
| `packages/verifactu/src/validation/object-inspection.ts` | 6338  | `ebf05391c87e3af8a69cd4af7dbb922e0742b4c79a4194ea2b2dda44213912c7` |
| `packages/verifactu/src/validation/record.ts`            | 12938 | `c18076b33c82ff1718ba5e3da65883ae8480c37ac6ee879bb1257c02bb8fa528` |
| `packages/verifactu/src/validation/totals.ts`            | 4011  | `c247eee3dfb201aaac5ee5e84c849383f041e48a5d5cd8b69d69f65f618910cc` |
| `packages/verifactu/src/vectors.ts`                      | 1055  | `91213773b12a7e3b69b668d417bd5866d971cd2a7a3cc7cb485879f77c83ba42` |

### 17.14. XML, firma, certificados y QR

Relación de revisión: REV-007–015, 037, 039, 045–046, 064.

| Archivo                                         | Bytes | SHA-256                                                            |
| ----------------------------------------------- | ----- | ------------------------------------------------------------------ |
| `packages/verifactu/src/certificates/index.ts`  | 2663  | `f72d8b2facac181008668b566aa4689c440a37b2b28a92c18906ef538b6f95ae` |
| `packages/verifactu/src/certificates/public.ts` | 67    | `81137ee22ccf151eea949f850aa4a51d786774a1da370d3d5c268ceabbb41b09` |
| `packages/verifactu/src/qr/index.ts`            | 3255  | `7ec5eedbd326a23f5775ee6c7c2e50b1fc281547f213a1de098b25ef0acffb50` |
| `packages/verifactu/src/qr/public.ts`           | 67    | `81137ee22ccf151eea949f850aa4a51d786774a1da370d3d5c268ceabbb41b09` |
| `packages/verifactu/src/signatures/index.ts`    | 4440  | `1d175df015be42188be8f156bd0f08728a6a1722d2c9d78b4e3151812bfaee69` |
| `packages/verifactu/src/signatures/public.ts`   | 67    | `81137ee22ccf151eea949f850aa4a51d786774a1da370d3d5c268ceabbb41b09` |
| `packages/verifactu/src/xml/codec.ts`           | 6925  | `f66b4f7e20e49c3ea733374b2ae4710b4d38f576b07f421424c8aca7027edcf3` |
| `packages/verifactu/src/xml/index.ts`           | 67    | `84cd4bcb7516011b9866f1ff5e6558c946708e98e35d3fe839f074e015b66828` |
| `packages/verifactu/src/xml/records.ts`         | 2700  | `788f67aba6383d84756af0f0e89ed940064b0d4cf938513b361b16fc65e56139` |

### 17.15. Exports, schemas y diagnósticos públicos

Relación de revisión: REV-004–005, 026–027, 048–049, 064, 072, 084.

| Archivo                                            | Bytes | SHA-256                                                            |
| -------------------------------------------------- | ----- | ------------------------------------------------------------------ |
| `packages/verifactu/src/diagnostics/diagnostic.ts` | 4133  | `363c3ad485934def61f59e5e374bc62d426741a57f2176b3870cff3c51ef5b5b` |
| `packages/verifactu/src/diagnostics/result.ts`     | 2395  | `569cdac41dff84ce504e37e3b6cce6e96e4be44cbec73a49ecac0f2e398842f0` |
| `packages/verifactu/src/index.ts`                  | 5602  | `1951d8bce421f62263cc15a64bc9350c8c8ddd0963670136db337d3cee82e9f8` |
| `packages/verifactu/src/schemas.ts`                | 471   | `33bf5d0410c1e832b28ba65cb9bb872f61ad114b15a7ef803e58e737132894a0` |

### 17.16. Catálogo TypeScript generado

Relación de revisión: REV-004–006, 063, 072, 084.

| Archivo                                       | Bytes  | SHA-256                                                            |
| --------------------------------------------- | ------ | ------------------------------------------------------------------ |
| `packages/verifactu/src/generated/edition.ts` | 687110 | `06e157fb8e537595bf88bd95b88ef4ad1df07ef1f222e6918a93a0aaf5c946c2` |

### 17.17. Fuentes regulatorias y snapshots

Relación de revisión: REV-001–008, 012–014, 022–023, 037–041, 045–046, 063.

| Archivo                                                                                | Bytes | SHA-256                                                            |
| -------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------ |
| `regulatory/README.md`                                                                 | 1832  | `3a75789d876427a882faac90e3ec0112cae58c2fda82f2d8bc3542b3ffce4d8e` |
| `regulatory/phase5-sources.json`                                                       | 1882  | `d7cc8d470795591216a3fdd8cf6e637dc48bb1ae1403ec2ffd24684f23bdf85c` |
| `regulatory/rules/aeat-1.2.2.json`                                                     | 5061  | `f0879c7ffaa3c5ea6fbf324eacb0b09613058416e9138d9085be70391319ca7f` |
| `regulatory/snapshots/aeat-rrsif-1.0@2026-09-03/manifest.json`                         | 4171  | `2460f1616dc065fe45ea3a35b6e7736b6650591e808d7bcb900e6f22bb9b0873` |
| `regulatory/snapshots/aeat-rrsif-1.0@2026-09-03/provenance.json`                       | 2568  | `1f9a0062fa546722fd460d1ff4f478b7d12a030de75530b58c36589477c182a4` |
| `regulatory/snapshots/aeat-rrsif-1.0@2026-09-03/raw/ConsultaLR.xsd`                    | 3886  | `bf2cdb8fc4b95b291757a72b76d8fffca06a6d30d9329122ca2fd6b2d5f8f1b1` |
| `regulatory/snapshots/aeat-rrsif-1.0@2026-09-03/raw/EventosSIF.xsd`                    | 30873 | `cc7347c6a9a57a0c8edbc6b9ddcce55176452d0db0e68369477e207e9fbdd7e7` |
| `regulatory/snapshots/aeat-rrsif-1.0@2026-09-03/raw/RespuestaConsultaLR.xsd`           | 10058 | `de35063acb8d9ba0d6ae51acc6b595de9c2b12333250e95e13108ef5f2670d45` |
| `regulatory/snapshots/aeat-rrsif-1.0@2026-09-03/raw/RespuestaSuministro.xsd`           | 6259  | `82acf80f785643caac13087aae66808ed721a13f08ca5218cf8ae81b695549ef` |
| `regulatory/snapshots/aeat-rrsif-1.0@2026-09-03/raw/RespuestaValRegistNoVeriFactu.xsd` | 4228  | `8f47af4f3c49d29b6a62aed261c09f171e855ad6d6bb72ef3fc0b147dc9572f0` |
| `regulatory/snapshots/aeat-rrsif-1.0@2026-09-03/raw/SistemaFacturacion.wsdl`           | 8780  | `05919120708ff7650612fa6683c9336eaf919335d9a4db10e86759190af48602` |
| `regulatory/snapshots/aeat-rrsif-1.0@2026-09-03/raw/SuministroInformacion.xsd`         | 49540 | `ee4c1655175644de44c4c25055ffeb8e5f4bb4bc3834ce8254d4222ef18c8aa1` |
| `regulatory/snapshots/aeat-rrsif-1.0@2026-09-03/raw/SuministroLR.xsd`                  | 1573  | `cbdac8d427cc5ab5d77ca48974cab0f35d6bb819c4c66db361681e3710aeba36` |
| `regulatory/sources.json`                                                              | 3815  | `d139a59eb0bed58065e2bc38b1b915c70da3563dce66563d07acd4e32602dbe8` |
| `regulatory/sources.schema.json`                                                       | 1530  | `58f89307dbcf242ece53823634ec20707627f170ef986046cdca02702be707ef` |

### 17.18. Scripts de build, controles y schemas auxiliares

Relación de revisión: REV-004–006, 049, 056–071, 073–076, 079–082.

| Archivo                                             | Bytes | SHA-256                                                            |
| --------------------------------------------------- | ----- | ------------------------------------------------------------------ |
| `scripts/audit-github.mjs`                          | 8136  | `3527b85c398eae4bd58fe0b7672539bf1dc098f8a60fb7e7be246c36b79f8d6b` |
| `scripts/benchmark-phase4.mjs`                      | 1886  | `4aaae7c342aa8ac66e6198c071482404d7f35d8e68c5e66e12b4327580ef1247` |
| `scripts/benchmark-phase6-7.mjs`                    | 1646  | `c76ea28c01cf50c4325c39cc9def3855357c5504cc910694aca8f5ec9137396c` |
| `scripts/benchmark-phase9.mjs`                      | 1925  | `7178fc241aa28473e92edab1f589079c3cd181be66bfb9e7cccf5d148eac4d0a` |
| `scripts/build.mjs`                                 | 1973  | `a431a6e90b9eb5dd6d387aeb6d843e19025cf4572a2e3f33ffaed26905a0a5f9` |
| `scripts/check-adapters.mjs`                        | 728   | `5f275cb50d1286836519a41168e4620b804004f9153e22f0396e2a612c761f4e` |
| `scripts/check-consumers.mjs`                       | 3371  | `eb61d6823dadc1781ed7d0330a5ef52e303a45f31928ff7f15c9020998e76728` |
| `scripts/check-contract-traceability.mjs`           | 1196  | `0a3779c3a41c84a322eea4d114e34e2314903532af3eabe574744fea60984da0` |
| `scripts/check-contracts.mjs`                       | 1773  | `6fb1b8a118d516af9d5a49735ab8bb98700e65c46737456db57c0914d766465c` |
| `scripts/check-dco.mjs`                             | 981   | `249ec200ed4e20737ad10316922c358ea6e21f97ffa03928ed10047866e0544a` |
| `scripts/check-docs.mjs`                            | 1125  | `51dcf65274583d6ac14c19797e60552bd17f30a9c82675c9c12efa8487984a97` |
| `scripts/check-generated-clean.mjs`                 | 645   | `81867229b39e124d9ddfec4d6f469487c423726be4f47746c4e11b7f61e5c7a2` |
| `scripts/check-governance.mjs`                      | 168   | `80ff3e183c5835f7e04b9ebedbb15b150bd8ecb36d20cde64dca06914512f431` |
| `scripts/check-licenses.mjs`                        | 724   | `f0376718a7ca627836bfaa63d4c09a4b90cc63be64e70e0ff4602c9aa1aeff1e` |
| `scripts/check-mutation-phase9.mjs`                 | 1708  | `d56f1053ceedd27cadcaba09f5cb5f436e8808db4e83d6af0857399b893bb274` |
| `scripts/check-mutations-phase4.mjs`                | 2380  | `450e2e3a4994594b7b5db00cbe281b4a790b7ec44fa77fe53078bd9234ebb449` |
| `scripts/check-mutations-phase6-7.mjs`              | 1509  | `020bd0cabedef1f6053e1c4cc87a92a2bae4908ac1959c2ef88c31d4c6d278ab` |
| `scripts/check-packages.mjs`                        | 770   | `584de2afe8ce0dfcf0723990b228c5a824b41afbe810b76dd19a2daecc808151` |
| `scripts/check-policies.mjs`                        | 4014  | `cccef4433a37b207e3c3f0c2a34f9981c3ede21cf74c137e0b5346d18f4fc3e2` |
| `scripts/check-reference-toolchain.mjs`             | 499   | `0472e865fefc49e653be8daafabd31bc37be7f9c9313ba56f5b4a8775a2cefb9` |
| `scripts/check-regulatory-manifest.mjs`             | 1803  | `6c95b10b30e33f4445526c0066217a60ec7f5943f204e2a1ed12567c084855f0` |
| `scripts/check-regulatory-snapshots.mjs`            | 1355  | `1771d07622ab6880ea582cbc88ed142d6eee5383b46a397218aacd477fb968c6` |
| `scripts/check-reproducibility.mjs`                 | 1601  | `1552f6148fedd164cf30cb9375af338c14684781d75cfef3242161fe60429651` |
| `scripts/check-rule-catalog.mjs`                    | 1956  | `34ecc985df65cf6f74920ebb6c3b351d79ad06328764eb7b44b3067b001c124b` |
| `scripts/check-security-boundaries.mjs`             | 1809  | `c98630868a5bd5f3f66d2ce6fdd96b38fa56c0b59761a577123d7656e03f1035` |
| `scripts/check-toolchain.mjs`                       | 1223  | `7c60f8af53e8cef6c7a5adc17a707677595b1dcaade71cb1bb5cd6baf67d8532` |
| `scripts/check-vectors.mjs`                         | 3250  | `9d33707fc4f9cf08e44c09bdc1fc6682baddd452141e205ff1a453f2d6170172` |
| `scripts/fuzz-phase9.mjs`                           | 2910  | `64ef39a2026009b671198448d437627225712d664ebedb0c3695d0beb6e6b385` |
| `scripts/generate-contracts.mjs`                    | 9446  | `f19d25e193fcd047d71fd7dbc6c02981151ad93f193c926f37828c699d5bec8f` |
| `scripts/generate-sbom.mjs`                         | 1245  | `293e36ac71f761a52c26f04d855fed454139ad8c43c56ba08173c12b1e2bd2ec` |
| `scripts/import-regulatory.mjs`                     | 7781  | `7ab1a9ff12fbbccff61b200b66387cfdcd4d52d38b3d60c647e52b745c5b455f` |
| `scripts/project.mjs`                               | 2661  | `9f94fc49def5664d4dea43aa8c61668960a753a245faca65fc2b5353404ecf7b` |
| `scripts/recovery-drill-phase9.mjs`                 | 988   | `1b0a10d7bd8197803e84c2d64714311b4c09ae224d2c76ca452e3ddcdd9e9f5e` |
| `scripts/run-verified-package-manager.mjs`          | 927   | `bd81556f46578cf76e2bc674a63454fbf80c3a20fb6a182d426182f918698347` |
| `scripts/schemas/spdx-3.0.1.schema.json`            | 444   | `a530c212c9665ef8b9a065c8b92e1af0d6aa31034fdb02c5eb350a3117edc072` |
| `scripts/schemas/spdx-3.0.1.schema.provenance.json` | 137   | `0ebe817ae70ae85041b42a9ca911793e2c33d51637ccb8def49781143e80cec4` |
| `scripts/stress-phase9.mjs`                         | 1190  | `01e4eb99c3580b0581073bd879a64f9a6a58108b7124989a87e3f395b5296961` |
| `scripts/toolchain-rules.mjs`                       | 1163  | `06e17f0bec727bec523e612c3c3641d54591de3b463c416177c8774925811d53` |

### 17.19. Políticas declaradas e inventarios de seguridad

Relación de revisión: REV-064, 069–071, 073, 075–082.

| Archivo                              | Bytes | SHA-256                                                            |
| ------------------------------------ | ----- | ------------------------------------------------------------------ |
| `security/allowed-signers`           | 160   | `fb4c67a2ca6ca1adbe19d2fe77eaa9d1d8c4bea95e023a9103127376ea2391ef` |
| `security/dependency-admission.json` | 2672  | `c7aa6371c6c3b3168423df119299024d12b28094d06199c2d22db99be42f49c7` |
| `security/dependency-inventory.json` | 412   | `7b7a1c264fdd866747a8a4f2b5dacc36e7223d8eb9b078ead1e013821b3e0d44` |
| `security/github-settings.json`      | 5389  | `a960f11b150a74edae70e117a305e9494f69c4d885f7e9d985d62b99441522e2` |
| `security/reference-toolchain.json`  | 221   | `2c51fe9239a48e44a7cd9f80875e09a0466f5bb6d4b3b5286f07d69a57a8b34e` |
| `security/runtime-toolchain.json`    | 511   | `8b6d63843f8f0f73fa5975a4ade3e648d763105d7351e1c7efbc4ec795fa2a96` |
| `security/workflow-actions.json`     | 1435  | `98085fcca8c7fb247b1bad469614410ddf9ca61d1993e9d1f3ac009d6d1ebce8` |

### 17.20. Suites, fixtures declarados y directorios de tests

Relación de revisión: REV-001–064, 084; nuevos oráculos y pruebas de aceptación por hallazgo.

| Archivo                                                   | Bytes | SHA-256                                                            |
| --------------------------------------------------------- | ----- | ------------------------------------------------------------------ |
| `tests/compatibility/.gitkeep`                            | 1     | `01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b` |
| `tests/contract/.gitkeep`                                 | 1     | `01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b` |
| `tests/contract/regulatory-contracts.test.ts`             | 952   | `df13e9460f3785a44da5f9b7af28403374ca14097854c5dbb1ec3f9366e0a0f9` |
| `tests/e2e/.gitkeep`                                      | 1     | `01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b` |
| `tests/e2e/phase9-cli.e2e.test.ts`                        | 2027  | `7f10cc777001c0b3061aa7f41e2fd1c08fd73134512e205a77851d2ef87c178a` |
| `tests/fixtures/.gitkeep`                                 | 1     | `01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b` |
| `tests/fuzz/.gitkeep`                                     | 1     | `01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b` |
| `tests/fuzz/phase4.fuzz.test.ts`                          | 1099  | `76dfd555e4d5eae84e9ee403de0fd3161e09eebb9b6c82280964ae4d6675f709` |
| `tests/index.test.ts`                                     | 873   | `280c86e62b1cba83acd344fe34198faf97ee73e8beebd726195a4f2e049dcf51` |
| `tests/integration/.gitkeep`                              | 1     | `01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b` |
| `tests/integration/internal-evidence.integration.test.ts` | 2482  | `ef3d4ae799ffe036659a1e147591258d8931c6f618c9d47078e3357f591e2a5f` |
| `tests/property/foundation.property.test.ts`              | 547   | `9b3745b2e05f002c7b63d64effdaca02888710a09a852562037893f0ebcd2796` |
| `tests/property/phase4.property.test.ts`                  | 2564  | `11bccc55a1b9fbee2f5abc6852c15c7adfeb0434112b4ae5da7486e2729a708a` |
| `tests/security/domain-boundaries.security.test.ts`       | 2014  | `3fbdeb36377989346eab835079d3323255212b065ebcd87bd539959c97f823d8` |
| `tests/security/foundation.security.test.ts`              | 5276  | `722686ba8d8e8abb754b572557629ce8d4388857103d8054a1b1fddf322f221c` |
| `tests/security/phase4-edgecases.security.test.ts`        | 5275  | `6b8dc56ec7b36081dbcb7d70d35ec2fcafb87d9d89ea5da842efa62ecfb4fc17` |
| `tests/security/regulatory-import.security.test.ts`       | 661   | `5860abc6e66b4730324846b85eee405bb1a2be98f6c0021483852d336d826f5c` |
| `tests/unit/.gitkeep`                                     | 1     | `01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b` |
| `tests/unit/domain-fingerprint.unit.test.ts`              | 5136  | `e7a6efde2ae3b2ea1ab9a003368dfca8dd2b8659f2114aa04c5bc561deee4017` |
| `tests/unit/foundation.unit.test.ts`                      | 634   | `e3225980f6b76f75e8779aad208e43e18afa5c57ba876e4e97d99f9f732aa248` |
| `tests/unit/phase5.unit.test.ts`                          | 2033  | `e824dcf65fce58ac66c1db29c02ffb3dd7b3f160c7cfc01ef636755e7c614670` |
| `tests/unit/phase6-7.unit.test.ts`                        | 6573  | `b9bea455348d162c9dc9d33a08a50e8bacad2ef45f3fe1ad0933142643df9e2e` |
| `tests/unit/phase8.unit.test.ts`                          | 1652  | `d12b07d371bd290cc5d01b99b42faa6a0f6b0c0a978e52651a2f0cd59dfe162b` |
| `tests/unit/phase9.unit.test.ts`                          | 2008  | `72649b62c0279287b06fbd0ff37f2e5444d21d7cb51f71d3e37efe3adef9e122` |
| `tests/unit/record-validation.unit.test.ts`               | 2996  | `564d94fd673da7c07c86026eb2c07298d72acc74f3619f82c31b24887bf50682` |
| `tests/unit/totals-validation.unit.test.ts`               | 2059  | `bd432a77dec3b8e98fafed428ea27e4c0a4b57bd579d377c3e24afa2f93ef692` |

### 17.21. Vectores y referencia Python

Relación de revisión: REV-007, 019–021, 049, 057, 059, 062, 071.

| Archivo                             | Bytes | SHA-256                                                            |
| ----------------------------------- | ----- | ------------------------------------------------------------------ |
| `tools/reference/rrsif.py`          | 2104  | `44770fa20cd1e3de2eebbb58dbda265feed26e6b3c6c2140533c5ecccde45938` |
| `vectors/internal-evidence.v1.json` | 1180  | `9b9c70e7d5cc10ec5b756ec8142dfb07a2ebd7b849d22f0b109572265951f90d` |
| `vectors/manifest.json`             | 1392  | `d4f0ab20fe5165f41d462b7b06a92c41cdf49eb12a683caf0691536d9e32b1dd` |
| `vectors/rrsif-fingerprint.v1.json` | 2776  | `a399ce5771d9c41aa7a86105985d852868d7f3e01c11dcbe7321d5fb7fc97328` |

## 18. Reproducción diagnóstica autocontenida

El siguiente programa es la reproducción utilizada para las 19 observaciones de sección 9. Se repitió al cerrar la redacción y terminó con código 0, reproduciendo los resultados descritos. **El código 0 significa que el diagnóstico terminó, no que el producto sea correcto**: imprime fallos y éxitos inesperados en vez de usar assertions. Convertir cada observación en una prueba de regresión que espere el comportamiento corregido. La observación 20, digest del lockfile, se calcula por separado.

Guardar el bloque como `/tmp/noeos-verifactu-review-probes.mjs` y ejecutarlo desde la raíz de VeriFactu con `node /tmp/noeos-verifactu-review-probes.mjs`, usando Node con `registerHooks` y las dependencias instaladas de la base. La ejecución observada usó Node 24.19.0; para evidencia oficial reexpresar las pruebas en la suite y ejecutarlas en toda la matriz fijada. El loader transpila el TypeScript de VeriFactu/CLI/kit en memoria y utiliza la dependencia Engine instalada; no prueba el build ni la resolución de los tarballs publicados.

Solo usa fixtures sintéticos, streams y stores de memoria. No abre conexiones ni escribe en el repositorio. La mutación de endpoint se restaura inmediatamente dentro del proceso; no existe envío de red. Algunos sondeos encadenan el estado de otros para demostrar impacto —registro fabricado, verificación de cadena y aceptación sin línea—; en la suite definitiva añadir también fixtures aislados y controles positivos válidos.

```javascript
import { registerHooks } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { Writable, Readable } from "node:stream";
const root = process.cwd();
const ts = (await import(pathToFileURL(resolve(root, "node_modules/typescript/lib/typescript.js"))))
  .default;
registerHooks({
  resolve(spec, ctx, next) {
    if (spec === "@noeos/verifactu")
      return {
        url: pathToFileURL(resolve(root, "packages/verifactu/src/index.ts")).href,
        shortCircuit: true,
      };
    if (spec === "@noeos/verifactu/schemas")
      return {
        url: pathToFileURL(resolve(root, "packages/verifactu/src/schemas.ts")).href,
        shortCircuit: true,
      };
    if (
      spec.endsWith(".js") &&
      ctx.parentURL?.startsWith("file:") &&
      ctx.parentURL.includes("/src/")
    ) {
      const u = new URL(spec.replace(/\.js$/, ".ts"), ctx.parentURL);
      if (u.protocol === "file:" && existsSync(u)) return { url: u.href, shortCircuit: true };
    }
    return next(spec, ctx);
  },
  load(url, ctx, next) {
    if (url.startsWith("file:") && url.endsWith(".ts"))
      return {
        format: "module",
        source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
          compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
        }).outputText,
        shortCircuit: true,
      };
    return next(url, ctx);
  },
});
const source = (p) => import(pathToFileURL(resolve(root, p)));
const v = await source("packages/verifactu/src/index.ts");
const { MemoryRecordStore } = await source(
  "packages/verifactu/src/adapters/memory-record-store.ts",
);
const { runCli } = await source("packages/cli/src/cli.ts");
const { parseJsonDocument } = await source("packages/cli/src/io/json-input.ts");
const record = {
  kind: "alta",
  fingerprint: {
    kind: "alta",
    issuerNif: "89890001K",
    invoiceNumber: "A-1",
    issueDate: "01-09-2026",
    invoiceType: "F1",
    taxAmount: "21.00",
    totalAmount: "121.00",
    previous: { kind: "genesis" },
    generatedAt: "2026-09-01T10:00:00+02:00",
  },
  taxpayerNif: "89890001K",
  currentDate: "04-09-2026",
  rectificationType: "none",
  correctedInvoices: false,
  substitutedInvoices: false,
  rectificationAmounts: false,
  operationDate: "01-09-2026",
  simplifiedFlag: false,
  unidentifiedRecipientFlag: false,
  macrodataFlag: false,
  issuedBy: "issuer",
  thirdPartyDetails: false,
  recipientCount: 1,
  taxKind: "01",
  regimeCode: "01",
};
const store = new MemoryRecordStore();
const api = v.createVerifactu({
  mode: "verifactu",
  taxpayerScopeId: "t",
  installationId: "i",
  sequenceId: "s",
  recordStore: store,
}).value;
const prepared = await api.prepareAlta({ recordId: "r1", record });
console.log(
  JSON.stringify({
    probe: "prepare-verify",
    prepared: prepared.ok,
    verification: await api.verifyRecord({ artifact: prepared.value }),
    xml: new TextDecoder().decode(prepared.value.bytes),
  }),
);
console.log(
  JSON.stringify({
    probe: "wrong-kind",
    result: (await api.prepareAnulacion({ recordId: "r2", record })).ok,
  }),
);
const forged = {
  ...prepared.value,
  bytes: new TextEncoder().encode("<arbitrary/>"),
  fingerprint: "A".repeat(64),
};
const committed = await api.commit(forged, v.genesisHead("t", "s"));
console.log(
  JSON.stringify({
    probe: "commit-forged",
    ok: committed.ok,
    state: committed.value?.record.state,
    createdAt: committed.value?.record.createdAt,
  }),
);
console.log(
  JSON.stringify({
    probe: "chain-forged",
    results: await Array.fromAsync(api.verifyChain({ limit: 100 })),
  }),
);
const soap =
  '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><RespuestaRegFactuSistemaFacturacion><EstadoEnvio>Correcto</EstadoEnvio><TiempoEsperaEnvio>60</TiempoEsperaEnvio></RespuestaRegFactuSistemaFacturacion></s:Body></s:Envelope>';
console.log(
  JSON.stringify({
    probe: "official-status",
    result: v.parseAeatResponse(new TextEncoder().encode(soap)),
  }),
);
const fake =
  "<Invoice><Signature><SignedInfo><Reference><DigestValue>abc</DigestValue></Reference></SignedInfo><SignaturePolicyIdentifier>" +
  v.VERIFACTU_SIGNATURE_POLICY.oid +
  v.VERIFACTU_SIGNATURE_POLICY.uri +
  "</SignaturePolicyIdentifier></Signature></Invoice>";
console.log(
  JSON.stringify({
    probe: "signature-structural",
    ok: v.validateXadesEnvelope(new TextEncoder().encode(fake)).ok,
  }),
);
const qr = v.renderQr({
  nif: "B12345678",
  invoiceNumber: "A",
  issueDate: "99-99-2026",
  total: "1",
});
console.log(
  JSON.stringify({
    probe: "qr",
    ok: qr.ok,
    viewBox: qr.value?.svg.match(/viewBox="([^"]*)"/)?.[1],
  }),
);
console.log(
  JSON.stringify({
    probe: "xml-tab",
    serialized: v.serializeXml({ name: "r", attributes: { a: "a\tb" }, children: [] }),
    parsed: v.parseSecureXml(v.serializeXml({ name: "r", attributes: { a: "a\tb" }, children: [] }))
      .value,
  }),
);
console.log(
  JSON.stringify({
    probe: "unsafe-number",
    value: parseJsonDocument("9007199254740993", {
      maxBytes: 1024,
      maxDepth: 10,
      maxProperties: 10,
      maxArray: 10,
    }),
  }),
);
for (const argv of [
  ["record", "alta", "build"],
  ["record", "alta", "build", "extra"],
  ["vectors", "verify"],
  ["version", "--typo", "x"],
  ["version", "--format", "json", "--format", "human"],
]) {
  let out = "",
    err = "";
  const stdout = new Writable({
      write(c, e, cb) {
        out += c.toString();
        cb();
      },
    }),
    stderr = new Writable({
      write(c, e, cb) {
        err += c.toString();
        cb();
      },
    });
  const code = await runCli(argv, {
    stdin: Readable.from([Buffer.from(JSON.stringify({ recordId: "r1", record }))]),
    stdout,
    stderr,
  });
  console.log(JSON.stringify({ probe: "cli", argv, code, output: out.slice(0, 180), stderr: err }));
}
const { MemoryOutboxStore } = await source(
  "packages/verifactu/src/adapters/memory-outbox-store.ts",
);
const { runAdapterConformance } = await source("packages/adapter-kit/src/index.ts");
console.log(
  JSON.stringify({
    probe: "conformance-without-adapters",
    result: (await runAdapterConformance({ name: "none", version: "1" })).value,
  }),
);
const endpoints = v.listAeatEndpoints();
const saved = endpoints[0].url;
endpoints[0].url = "https://invalid.example/";
console.log(
  JSON.stringify({
    probe: "endpoint-mutable",
    url: v.resolveAeatEndpoint("test", "verifactu").value.url,
  }),
);
endpoints[0].url = saved;
const ob = new MemoryOutboxStore();
const work = v.createOutboxWork(
  {
    workId: "w",
    recordIds: ["r1"],
    requestDigest: "c".repeat(64),
    requestBytes: new Uint8Array([1]),
    certificateId: "c",
    environment: "test",
    endpointId: "verifactu",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  "2026-01-01T00:00:00.000Z",
);
await ob.enqueue([work]);
const leased = (
  await ob.lease({ owner: "one", now: "2026-01-01T00:00:01.000Z", limit: 1, leaseSeconds: 1 })
).value[0];
const submitting = (await ob.markSubmitting("w", leased.lease, "2026-01-01T00:00:01.000Z")).value;
const released = (
  await ob.lease({ owner: "two", now: "2026-01-01T00:00:03.000Z", limit: 1, leaseSeconds: 1 })
).value[0];
console.log(
  JSON.stringify({
    probe: "attempt-expired-submitting",
    attempt: submitting.attempt,
    releasedState: released.state,
    owner: released.lease.owner,
  }),
);
const ob2 = new MemoryOutboxStore();
await ob2.enqueue([work]);
const response = new TextEncoder().encode(
  "<Envelope><Body><Estado>Correcto</Estado></Body></Envelope>",
);
const report = await v.processQueueOnce({
  owner: "x",
  limit: 1,
  leaseSeconds: 60,
  clock: { now: () => new Date("2026-01-01T00:00:05Z") },
  outbox: ob2,
  recordStore: store,
  transport: {
    send: async () =>
      v.success({
        requestDigest: work.requestDigest,
        responseBytes: response,
        httpStatus: 200,
        bytesWritten: 1,
        bytesRead: response.length,
        completed: true,
        receivedAt: "2026-01-01T00:00:05Z",
      }),
  },
});
console.log(
  JSON.stringify({
    probe: "accept-without-line",
    report: report.value,
    recordState: (await store.read("r1")).value.state,
  }),
);
console.log(
  JSON.stringify({
    probe: "foreign-freshness",
    ok: v.assertFreshness(
      { contextId: "a", sequenceId: "s", position: 1, version: 1, linkDigest: "A".repeat(64) },
      { contextId: "b", sequenceId: "s", position: 1, version: 1, linkDigest: "B".repeat(64) },
    ).ok,
  }),
);
```

Para repetir la observación 20, ejecutar desde la raíz este bloque JavaScript con Node en modo módulo; solo lee archivos:

```javascript
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const inventory = JSON.parse(readFileSync("security/dependency-inventory.json", "utf8"));
const actual = createHash("sha256").update(readFileSync("package-lock.json")).digest("hex");
console.log({
  declared: inventory.lockfileSha256,
  actual,
  matches: inventory.lockfileSha256 === actual,
});
```

## 19. Comprobaciones del entregable de revisión

Comprobaciones realizadas sobre este documento antes de entregarlo:

- `node scripts/check-docs.mjs`: aprobado; 135 Markdown comprobados. Valida encabezados y destinos de enlaces locales, no la corrección fiscal de las afirmaciones.
- `node scripts/check-policies.mjs`: aprobado; 334 archivos recorridos por el enumerador del script. Las limitaciones de ese control están documentadas en los hallazgos; este resultado solo acredita que añadir el informe no rompe sus comprobaciones actuales.
- Validación específica del informe: IDs REV-001..084 consecutivos y únicos, anclas internas existentes, presencia de los 67 requisitos, 22 controles y 15 riesgos, y correspondencia de los 328 archivos del inventario con su contenido y SHA-256.
- Formato aplicado únicamente a este Markdown mediante la API de Prettier y configuración del repositorio; UTF-8, LF, salto final y ausencia de espacios al final de línea comprobados. `docs` está excluido del check habitual de Prettier, por lo que la comprobación explícita del archivo es necesaria para acreditar este resultado.
- Reproducción diagnóstica de sección 18 ejecutada con los resultados de sección 9; estado del lockfile comprobado separadamente. No equivale a una ejecución nueva de CI ni corrige esos defectos.
- Estado versionado: el único archivo añadido es este informe; VeriFactu no tiene cambios de implementación y Verification Engine permanece limpio. No se modificaron configuración remota, PR, tags, publicaciones ni credenciales.

El estado al entregar sigue siendo **remediación pendiente**. Los controles y presupuestos que deberán pasar después de corregir están especificados en las secciones 10–15; sus éxitos futuros no se dan por obtenidos en esta revisión.


## 20. Seguimiento de remediación

Inicio de ejecución autorizado tras el review. Incorporación de revisores (REV-077): **pendiente por decisión del titular**; se mantienen las protecciones existentes. No se ejecutan las fases 10 y 11. Los estados siguientes son provisionales hasta completar los criterios de cada ficha y los controles del conjunto.

### 20.1 Cambios y evidencia obtenida

| Hallazgos | Implementación | Evidencia y trabajo restante |
| --- | --- | --- |
| REV-007, 018, 020 | Huella actual en XML; rechazo de clase cruzada; reconstrucción del artefacto desde sus lexemas de entrada; comparación de bytes y huella. | Pruebas en `review-artifact.integration.test.ts`. Siguen abiertos modelo/XSD completos, cronología de cadena y alcance de verificación de artefactos firmados. |
| REV-016, 017, 027 | Capacidad de preparación ligada a la instancia, copia privada de bytes, rechazo de alteración/forja y head de otro contexto; reloj obligatorio y no anterior a generación. | Pruebas de confirmación negativa y positiva. Aislamiento de lectura/colas/exportación y validación runtime integral siguen en curso. |
| REV-029, 030 | Head completo, génesis único, contadores seguros, CAS obligatorio incluso sin secuencia, next head exacto y freshness ligado a identidad/digest. | Nueve regresiones de fronteras inicialmente fallidas pasan tras corregir. Anclaje externo y fixture durable aún pendientes. |
| REV-031, 032, 033 | Intento avanza al entrar en submitting una sola vez; lease de posible entrega vencido pasa a indeterminate; límites/owner/fechas/fencing acotados. | Regresiones y mutantes ejecutados. Falta integrar renovación/reconciliación y todo el procesamiento transaccional. |
| REV-038 | Objetos de endpoints inmutables además del array. | Regresión por `Reflect.set` y mutante que quita el freeze detectados. |
| REV-009, 011 | Rechazo temprano de declaraciones inseguras, presupuestos finitos acotados, preflight antes de DOM, errores acotados, atributos sin pérdida de tabulación, escalares XML y QName válidos, orden sin locale. | Regresiones de XML; ampliar fuzz/oráculos y verificar límites de serialización/canonicalización por separado. |
| REV-045, 046 | SVG con cuatro coordenadas, fondo blanco y unidades físicas; fechas reales, importes con signo y límites finitos. | Regresiones de representación; falta diferenciación de modalidad y decodificación gráfica independiente. |
| REV-047, 048, 051, 055 | Aridad correcta, DTO JSON explícito sin BigInt, bytes base64 coherentes, lectura de archivo acotada, flags desconocidos/duplicados rechazados. | Round-trip CLI build→verify y negativos pasan. NDJSON, providers, versión/ayuda/edition/timeout y contrato completo siguen en curso. |
| REV-052 | Números enteros inseguros rechazados; Unicode escapado validado; límites acumulados y configuración de límites comprobada. | Regresiones de redondeo, surrogates y presupuesto acumulado. Ampliar escenarios de decimales y fuzz. |
| REV-053, 054 | Publicación sin sobrescritura mediante link atómico; temp exclusivo; fsync de archivo/directorio cuando soportado; escritura completa y errores de streams observados. | Carrera con archivo competidor, limpieza, reemplazo explícito y EPIPE probados. Completar contrato de directorio de confianza y demás plataformas. |
| REV-056 | Cobertura de módulos compilados de los tres paquetes, precarga de archivos no ejercitados e informe LCOV. Umbrales 98/98/95 conservados. | La primera medición ampliada dio alrededor de 65% de líneas y falla correctamente el gate. La cobertura se debe elevar con pruebas reales; no se declara cierre. |
| REV-057 | Mutación de código ejecutable en copias aisladas, baseline, comprobación sintáctica, control de ejecución, prueba negativa identificada e informe. | 11/11 mutantes del corpus inicial detectados. Los scripts antiguos ya no atribuyen mutantes muertos a alteraciones de inputs. Falta ampliar el corpus a todas las garantías críticas. |
| REV-061 | Sin adapters el resultado es not-applicable; fixture de head de génesis corregido. | No se declara conformidad de persistencia sin adapter. Matriz durable y fault injection aún en curso. |
| REV-068, 069, 070 | Generador real CycloneDX/SPDX y schema SPDX oficial reutilizados del motor; inventario de 319 dependencias y admisiones cotejadas con manifests/lock; hash real exigido; headers completos. | Inventario/licencias/políticas pasan. Validación de los SBOM y contenido distribuido en curso. Instalación local se reconstruye desde lock al detectar entradas sobrantes/faltantes. |
| REV-071, 072, 084 | Wrapper verifica npm además de Node y fija PATH de la toolchain; comprobador Python ejecuta el binario; entrypoint CLI importable sin ejecución; EditionId procede del literal generado. | Node 24.20.0/npm 11.19.0 verificados; la suite deja de imprimir version por un import. Completar consumidores/API reports y demás puntos de organización. |

Los demás IDs continúan abiertos hasta aplicar y probar sus correcciones. La suite llegó a 61 pruebas aprobadas tras integrar las correcciones de artefactos; otras cuatro pruebas focalizadas de I/O/QR pasaron después. Estas cifras describen ejecuciones concretas y no sustituyen la suite completa del estado final.


### 20.2 Avance de implementación y comprobaciones del 10-09-2026

Esta sección amplía la evidencia de 20.1; los inventarios y reproducciones de las secciones 1–19 describen el baseline del review, no los archivos modificados posteriormente. Ningún éxito focalizado sustituye los criterios de cierre completo de cada ficha.

- **REV-005/006 — Contratos y fuentes:** validación efectiva de JSON Schema 2020-12 con Ajv y formatos completos; límites e identidad de edición; rechazo de campos adicionales, IDs/archivos duplicados y rutas inseguras. `regulatory-rules.mjs` verifica el inventario exacto, archivos regulares sin symlinks, tamaño antes de lectura, lectura acotada y ambos hashes. `contract-rules.mjs` exige los seis artefactos generados, checksums completos y únicos, schema igual al del generador, procedencia exacta y coherencia entre catálogos, counts y source map. El schema generado incorpora `generatedBy` y estructura de cada artefacto. La importación offline es de solo lectura y falla ante bytes alterados; fetch verifica todos los resultados antes de persistir y usa reemplazo atómico por archivo. Esto no constituye una transacción atómica de todo el directorio ni acredita aún todas las pruebas de interrupción de importación. Siete pruebas de scripts pasan, incluidas manipulaciones rehasheadas y ejecución aislada del importador real; se integran en CI.
- **REV-009/010/011 — XML y canonicalización:** serialización con límites de profundidad, ciclos, nodos, texto y bytes; comprobación de declaraciones de namespace, prefijos ligados y atributos duplicados por nombre expandido. Se preserva CR como `&#xD;`. `canonicalizeXml` implementa el perfil de documento completo de Canonical XML 1.0 inclusivo, sin comentarios, con orden por URI/local name y eliminación de declaraciones redundantes. La API recibe el modelo restringido `XmlElement`: no acepta DTD, PI ni conjuntos XPath separados del documento. El contexto de namespace debe acompañar a la raíz. Cinco pares explícitos input/expected y 250 combinaciones reproducibles coinciden con libxml2, más negativos de ciclos, profundidad, tamaños y namespaces. Referencia normativa: [W3C Canonical XML 1.0](https://www.w3.org/TR/2001/REC-xml-c14n-20010315). No se atribuye a esta función verificación criptográfica de XAdES ni soporte de otras URI de canonicalización.
- **REV-037 — Cabecera de suministro:** `SubmissionHeader` representa `CabeceraType`: obligado con `NombreRazon`/`NIF`, representante opcional y datos de remisión. Se corrigen los namespaces de `RegFactuSistemaFacturacion`, `Cabecera`, `RegistroFactura` y sus tipos. Se rechazan raíces de registro ajenas al namespace oficial. El DTO anterior con `idVersion`, `nombreSistemaInformatico`, `idSistemaInformatico`, `version`, `numeroInstalacion` y flags de software debe migrar: esos datos pertenecen a cada registro, no a la cabecera. Ejemplo de la nueva cabecera: `{"obligado":{"nombreRazon":"Noeos","nif":"89890001K"}}`. Los consumidores de esa API deben actualizarse antes de la publicación. Tres variantes de lote, con un registro de anulación completo preparado como fixture, pasan el **XSD oficial completo y sin modificar**; quitar `NombreRazon` o cambiar el namespace falla. Esto acredita el envoltorio/cabecera y el fixture, no cierra todavía la serialización completa del modelo fiscal de REV-001/008.
- **REV-039/040/062 — Respuestas:** el parser exige SOAP 1.1 y nombres expandidos, identidad fiscal y operación de cada línea, orden y unicidad de campos, coherencia entre resultado global y líneas. Se conservan cabecera, presentación, referencia externa y duplicado. Una respuesta favorable sin líneas no produce aceptación. El fixture favorable pasa además `RespuestaSuministro.xsd` mediante libxml2. La aplicación coteja todas las líneas con las identidades de los registros antes de transicionar; quedan por completar el journal durable, atomicidad de grupo y reconciliación.
- **REV-026/034/035/042/043/044 — Persistencia y entrega:** se observan resultados de complete/release/transiciones, se usa el reloj actualizado y se evita que errores de observabilidad alteren una confirmación durable. Sin prueba explícita de no envío el resultado se conserva como indeterminado. El transporte comprueba digest, tamaño, TLS, cancelación y un plazo que incluye la obtención del agente; ignora agentes tardíos, copia los bytes y libera listeners. Tres pruebas de transporte pasan. Falta completar pruebas de handshake real, renovación de lease, journal/respuesta transaccional y los demás criterios de las fichas; la capacidad del proveedor de conexión sigue formando parte de la frontera de confianza.
- **REV-068/069/070 — Dependencias y SBOM:** el generador CycloneDX 1.7/SPDX 3.0.1 pasó tras reconstruir `node_modules` desde el lockfile. Las nuevas dependencias de desarrollo `ajv-formats@3.0.1` y `libxml2-wasm@0.7.2` se fijan y documentan en admisiones. libxml2 se usa como oráculo independiente de pruebas y no se añade a las dependencias de ejecución de los paquetes. El XMLDSig importado por AEAT se conserva en `regulatory/vendor/w3c` con procedencia, licencia, longitud y SHA-256/SHA-512. El oráculo resuelve únicamente buffers verificados y no registra acceso a red o archivos para imports XML. La declaración DTD del schema W3C original se conserva como fuente fijada; su carga externa sigue deshabilitada. SHA-256 del XSD original: `d102ad3df7664c307e0c2c776ba4a90513b1969974d8a940bae1a77f9f21e15d`. Referencias: [schema W3C](https://www.w3.org/TR/xmldsig-core/xmldsig-core-schema.xsd), [libxml2-wasm](https://github.com/jameslan/libxml2-wasm).
- **REV-071/072/084 — Toolchain y carga:** se ha restaurado Node 24.20.0 desde su distribución oficial, cotejando SHA-256, tras desaparecer la instalación temporal de la sesión anterior. El generador separa `edition-info.ts` del catálogo grande; la API principal y el worker importan solo los metadatos. Los subpaths de catálogos siguen exponiendo los datos completos. Quedan por medir carga/paquetes finales y actualizar los reports públicos junto con sus consumidores.
- **REV-075 — GitHub:** se activó `sha_pinning_required=true` mediante la API del repositorio y se confirmó mediante lectura posterior. El auditor comprueba ahora ese valor. La incorporación de revisores permanece pendiente conforme a REV-077.

La suite TypeScript completa pasó con **71 pruebas** después de estas correcciones. Las pruebas de scripts añadidas se incorporan al mismo proceso de cobertura para contabilizar también el ejercicio de XML mediante oráculos independientes. La cobertura ampliada continúa siendo un criterio pendiente de alcanzar, con los umbrales originales conservados. No se considera completada la remediación ni se han ejecutado las fases 10 y 11.


### 20.3 Persistencia, mensaje wire y medición integrada

- El lote expone `payload` para inspección XSD y `body` como SOAP 1.1 completo. `requestDigest` compromete `body`; no se debe volver a envolver `body`. Hay una regresión que exige exactamente un Envelope. El ensayo de 1.000 registros conserva orden y pasa el XSD completo. Se distinguen límites por registro y por mensaje SOAP, con máximos duros de 16 MiB, 64 niveles y 250.000 nodos; los valores no finitos siguen rechazados. La prueba de lote grande acredita estructura y límites, no la continuidad fiscal de las huellas de su fixture.
- `decideRetry` rechaza NaN, infinitos, contadores/fracciones inseguros, fechas inválidas y callbacks de jitter fallidos. El jitter queda incluido dentro del máximo, el caso de base cero evita `0 * Infinity` y el desbordamiento de fecha devuelve fallo. Dos pruebas focalizadas pasan.
- `MemoryOutboxStore.enqueue` recalcula SHA-256 de los bytes y exige su representación hexadecimal minúscula; el ID existente compromete destino, certificado, IDs de registros ordenados, creación y bytes. La repetición recupera el trabajo persistido con su estado/lease actual. Los miembros se validan y copian antes de insertar el conjunto. Dos pruebas cubren cambios de identidad y ausencia de escritura parcial. La unicidad de `workId` se aplica a toda la instancia del store; el aislamiento de autorización entre scopes sigue sujeto a REV-017/028.
- `MemoryRecordStore` comprueba hash de bytes, contadores, fechas y referencias/secuencia de transiciones antes del commit; prepara las copias antes de hacer visible el registro y head. Los bundles de diagnóstico ya no exponen el array interno. Las transiciones posteriores cotejan ID, arista, rol declarado, intento y tiempo, y se conservan en un journal interno consultable mediante copias inmutables. El rol es una regla de flujo, no un mecanismo de autenticación del host. Los pasos desde indeterminate corresponden al reconciliador; recovery solo puede declarar indeterminación desde submitting. Tres pruebas de estado pasan, incluyendo contaminación por claves de prototipo y getters sin ejecución. El journal durable y su puerto/atomicidad completa siguen formando parte de REV-028/035/036.
- Se han sustituido hashes ficticios de fixtures de stores/adapter-kit por hashes de sus bytes reales. La suite TypeScript vuelve a pasar con 71 pruebas tras endurecer los contratos.
- La medición integrada ejecutada antes de añadir las últimas pruebas del journal registra **77,79% líneas, 76,50% ramas y 83,59% funciones**. Los tests de aquella ejecución pasaron, pero el gate de cobertura falló frente a 98/95/98. El informe está en `artifacts/coverage/lcov.info`; debe regenerarse para el estado final. Esta evidencia identifica trabajo restante y no justifica reducir umbrales.
- La compilación de tests ya no toma todos los scripts operativos como entradas: incluye los tests TypeScript y sus imports necesarios. Evita que el ejecutor de pruebas vuelva a introducir `.build` como fuente. Los directorios `dist` y `temp` de cada paquete también se excluyen de la selección fuente.
