# Índice completo de planificación

Estado: **registro navegable**

## Gobierno

- [`01-autoridad-documental.md`](01-autoridad-documental.md): precedencia, estados y gestión de contradicciones.
- [`02-decisiones.md`](02-decisiones.md): decisiones vinculantes y alternativas rechazadas.
- [`03-glosario.md`](03-glosario.md): vocabulario legal, funcional y técnico.
- [`04-trazabilidad-requisitos.md`](04-trazabilidad-requisitos.md): IDs y cadena de evidencia.
- [`05-mantenimiento-contribuciones.md`](05-mantenimiento-contribuciones.md): responsabilidades y flujo humano.
- [`06-aprobacion-plan.md`](06-aprobacion-plan.md): gate de cierre documental.

## Producto

- [`01-vision-alcance.md`](../01-producto/01-vision-alcance.md)
- [`02-mapa-facturacion-obligaciones.md`](../01-producto/02-mapa-facturacion-obligaciones.md)
- [`03-actores-casos-uso.md`](../01-producto/03-actores-casos-uso.md)
- [`04-modalidades-cumplimiento.md`](../01-producto/04-modalidades-cumplimiento.md)
- [`05-requisitos-no-funcionales.md`](../01-producto/05-requisitos-no-funcionales.md)
- [`06-limitaciones-garantias.md`](../01-producto/06-limitaciones-garantias.md)

## Legalidad

- [`01-jerarquia-fuentes.md`](../02-legalidad/01-jerarquia-fuentes.md)
- [`02-marco-legal-vigente.md`](../02-legalidad/02-marco-legal-vigente.md)
- [`03-ambito-aplicacion-exclusiones.md`](../02-legalidad/03-ambito-aplicacion-exclusiones.md)
- [`04-registro-fuentes-versiones.md`](../02-legalidad/04-registro-fuentes-versiones.md)
- [`05-matriz-norma-requisito.md`](../02-legalidad/05-matriz-norma-requisito.md)
- [`06-criterios-interpretacion.md`](../02-legalidad/06-criterios-interpretacion.md)
- [`07-vigilancia-regulatoria.md`](../02-legalidad/07-vigilancia-regulatoria.md)
- [`08-declaracion-responsable-expediente.md`](../02-legalidad/08-declaracion-responsable-expediente.md)
- [`09-conservacion-prescripcion-prueba.md`](../02-legalidad/09-conservacion-prescripcion-prueba.md)
- [`10-regimenes-relacionados-fronteras.md`](../02-legalidad/10-regimenes-relacionados-fronteras.md)
- [`11-licencias-reutilizacion-pi.md`](../02-legalidad/11-licencias-reutilizacion-pi.md)
- [`12-importacion-fuentes.md`](../02-legalidad/12-importacion-fuentes.md)

## Dominio y contratos

- Dominio: [`modelo`](../03-dominio/01-modelo-dominio.md), [`identidades`](../03-dominio/02-identidades-sistema-instalaciones.md), [`frontera factura/registro`](../03-dominio/03-frontera-factura-registro.md), [`alta/anulación`](../03-dominio/04-registros-alta-anulacion.md), [`eventos`](../03-dominio/05-registros-eventos.md), [`secuencias`](../03-dominio/06-secuencias-encadenamiento.md), [`estados/correcciones`](../03-dominio/07-estados-rechazos-correcciones.md), [`catálogos/diagnósticos`](../03-dominio/08-catalogos-reglas-diagnosticos.md).
- Contratos: [`API`](../04-contratos/01-api-publica.md), [`esquemas`](../04-contratos/02-esquemas-formatos.md), [`CLI`](../04-contratos/03-cli.md), [`puertos`](../04-contratos/04-puertos-adaptadores.md), [`errores`](../04-contratos/05-errores-resultados.md), [`observabilidad`](../04-contratos/06-eventos-observabilidad.md), [`compatibilidad`](../04-contratos/07-versionado-compatibilidad.md), [`integraciones`](../04-contratos/08-integraciones-engine-facturacion.md), [`generación`](../04-contratos/09-generacion-contratos.md).

## Formatos y AEAT

- Formatos/criptografía: [`serialización`](../05-formatos-criptografia/01-serializacion-oficial.md), [`huella`](../05-formatos-criptografia/02-huella-rrsif.md), [`evidencia Noeos`](../05-formatos-criptografia/03-evidencia-interna-noeos.md), [`XML/XSD`](../05-formatos-criptografia/04-xml-xsd.md), [`firma`](../05-formatos-criptografia/05-firma-electronica.md), [`certificados`](../05-formatos-criptografia/06-certificados-claves.md), [`QR`](../05-formatos-criptografia/07-qr.md), [`vectores`](../05-formatos-criptografia/08-vectores-conformidad.md).
- Comunicación AEAT: [`servicios`](../06-comunicacion-aeat/01-servicios-entornos.md), [`SOAP/HTTPS`](../06-comunicacion-aeat/02-soap-https-autenticacion.md), [`lotes`](../06-comunicacion-aeat/03-lotes-orden-remision.md), [`respuestas`](../06-comunicacion-aeat/04-respuestas-errores.md), [`idempotencia`](../06-comunicacion-aeat/05-idempotencia-reintentos.md), [`colas/recuperación`](../06-comunicacion-aeat/06-colas-indisponibilidad-recuperacion.md), [`pruebas AEAT`](../06-comunicacion-aeat/07-pruebas-externas-aeat.md).

## Arquitectura, seguridad y rendimiento

- Arquitectura: [`visión`](../07-arquitectura/01-arquitectura.md), [`árbol`](../07-arquitectura/02-estructura-repositorio.md), [`confianza`](../07-arquitectura/03-flujos-fronteras-confianza.md), [`dependencias`](../07-arquitectura/04-dependencias.md), [`persistencia/outbox`](../07-arquitectura/05-persistencia-atomicidad-outbox.md), [`concurrencia`](../07-arquitectura/06-concurrencia-streaming.md), [`configuración/aislamiento`](../07-arquitectura/07-configuracion-aislamiento.md).
- Seguridad: [`amenazas`](../08-seguridad/01-modelo-amenazas.md), [`controles`](../08-seguridad/02-controles.md), [`XML/red`](../08-seguridad/03-seguridad-xml-red.md), [`claves/storage`](../08-seguridad/04-claves-certificados-almacenamiento.md), [`supply chain`](../08-seguridad/05-cadena-suministro.md), [`incidentes`](../08-seguridad/06-vulnerabilidades-incidentes.md), [`privacidad`](../08-seguridad/07-privacidad-datos.md).
- Rendimiento: [`presupuestos`](../09-rendimiento/01-presupuestos.md), [`benchmarks`](../09-rendimiento/02-benchmarks-regresiones.md), [`capacidad/backpressure`](../09-rendimiento/03-capacidad-backpressure.md).

## Calidad, entrega y roadmap

- Calidad: [`estrategia`](../10-calidad/01-estrategia-pruebas.md), [`ejemplos oficiales`](../10-calidad/02-ejemplos-vectores-oficiales.md), [`límites/negativos`](../10-calidad/03-limites-alteraciones-negativos.md), [`property/fuzz/mutación`](../10-calidad/04-property-fuzz-mutation.md), [`CI`](../10-calidad/05-ci-calidad.md), [`auditoría`](../10-calidad/06-auditoria-lanzamiento.md), [`contratos generados`](../10-calidad/07-contratos-generados.md).
- Repositorio/entrega: [`flujo`](../11-repositorio-entrega/01-github-flujo-cambios.md), [`GitHub`](../11-repositorio-entrega/02-configuracion-github.md), [`toolchain`](../11-repositorio-entrega/03-toolchain-dependencias.md), [`build/SBOM`](../11-repositorio-entrega/04-build-reproducibilidad-sbom.md), [`versionado`](../11-repositorio-entrega/05-versionado-publicacion.md), [`RC/release`](../11-repositorio-entrega/06-release-candidate-estable.md), [`verificación`](../11-repositorio-entrega/07-verificacion-release.md), [`soporte`](../11-repositorio-entrega/08-soporte-recuperacion.md).
- Roadmap: [`orden`](../12-roadmap/01-roadmap.md), [`cierres`](../12-roadmap/02-criterios-cierre.md), [`riesgos`](../12-roadmap/03-riesgos.md), [`release 1`](../12-roadmap/04-preparacion-release-1.md).

## Anexos

- [`fuentes`](../anexos/01-fuentes.md), [`requisitos`](../anexos/02-matriz-requisitos.md), [`controles`](../anexos/03-matriz-controles.md), [`diagramas`](../anexos/04-diagramas-estados-datos.md), [`plantilla de decisión`](../anexos/05-plantilla-decision.md), [`plantilla de expediente`](../anexos/06-plantilla-expediente-release.md), [`validación`](../anexos/07-validacion-coherencia.md).

Cada directorio contiene documentos de una sola autoridad temática; los anexos agregan información, pero no alteran decisiones.

## Regla de navegación

Toda referencia relativa DEBE resolver dentro del repositorio. Un documento renombrado conserva redirección o actualiza atómicamente todos sus enlaces e IDs. No se permiten documentos huérfanos.
