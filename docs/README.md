# Noeos VERI*FACTU · especificación maestra

Estado: **normativo y aprobado**

Edición documental: **1.0.0-plan**
Fecha de referencia: **2026-09-03**

Este directorio es la fuente de verdad para diseñar, implementar, verificar, publicar y mantener Noeos VERI*FACTU. No se autoriza cambiar una capacidad cuyo fundamento, comportamiento, riesgo, contrato y criterio de prueba no estén definidos aquí. Las fases ordenan el trabajo y nunca reducen el alcance a un MVP.

## Resultado exigido

El resultado será una biblioteca pública TypeScript para Node.js y una CLI independiente, publicadas en npm, capaces de aplicar de manera reproducible el RRSIF completo: registros de alta, anulación y evento; huella y encadenamiento oficiales; firma en modalidad NO VERI*FACTU; QR; XML y catálogos; exportación y verificación; remisión VERI*FACTU; interpretación de respuestas; idempotencia, reintentos, recuperación y evidencia auditable.

El componente no gestionará clientes, catálogo, precios, cobros, PDF, interfaz de usuario ni entrega B2B de la factura electrónica.

## Mapa documental

| Área | Contenido |
|---|---|
| [`00-gobierno/`](00-gobierno/00-indice.md) | autoridad, decisiones, glosario, trazabilidad y aprobación |
| [`01-producto/`](01-producto/01-vision-alcance.md) | resultado, actores, modalidades, usos y garantías |
| [`02-legalidad/`](02-legalidad/01-jerarquia-fuentes.md) | fuentes oficiales, alcance, interpretación y vigilancia |
| [`03-dominio/`](03-dominio/01-modelo-dominio.md) | registros, identidades, cadenas, estados y reglas |
| [`04-contratos/`](04-contratos/01-api-publica.md) | API, CLI, formatos, puertos, errores y compatibilidad |
| [`05-formatos-criptografia/`](05-formatos-criptografia/01-serializacion-oficial.md) | bytes oficiales, huella, firma, certificados, QR y vectores |
| [`06-comunicacion-aeat/`](06-comunicacion-aeat/01-servicios-entornos.md) | transporte, lotes, respuestas, colas y pruebas externas |
| [`07-arquitectura/`](07-arquitectura/01-arquitectura.md) | capas, árbol, dependencias, persistencia y concurrencia |
| [`08-seguridad/`](08-seguridad/01-modelo-amenazas.md) | amenazas, controles, privacidad, incidentes y supply chain |
| [`09-rendimiento/`](09-rendimiento/01-presupuestos.md) | objetivos, benchmarks, capacidad y regresiones |
| [`10-calidad/`](10-calidad/01-estrategia-pruebas.md) | estrategia, vectores, negativos, fuzzing, CI y auditoría |
| [`11-repositorio-entrega/`](11-repositorio-entrega/01-github-flujo-cambios.md) | GitHub, toolchain, publicación, procedencia y soporte |
| [`12-roadmap/`](12-roadmap/01-roadmap.md) | orden de construcción, cierres y riesgos |
| [`anexos/`](anexos/01-fuentes.md) | fuentes, matrices, diagramas y plantillas |

## Convenciones normativas

- **DEBE**, **NO DEBE**, **DEBERÍA**, **NO DEBERÍA** y **PUEDE** se interpretan conforme a RFC 2119 y RFC 8174.
- Cada requisito usa un identificador estable: `LEG`, `REG`, `DOM`, `CON`, `SEC`, `PER`, `QUA` u `OPS`.
- Una ausencia de evidencia nunca equivale a éxito. Se representa como resultado indeterminado y bloquea la afirmación afectada.
- Una contradicción documental bloquea implementación y release hasta resolverse mediante una decisión registrada.
- Leyes y artefactos oficiales se identifican por versión, fecha, URI y digest; no se confía en una URL mutable sin snapshot.
- Los ejemplos normativos se convertirán en pruebas o vectores antes de declarar implementada la conducta.

## Aprobación

La auditoría documental y la aprobación del propietario están registradas en [`00-gobierno/06-aprobacion-plan.md`](00-gobierno/06-aprobacion-plan.md). El punto 2 del roadmap implementa la fundación de repositorio, toolchain y CI; no implica conformidad legal de un SIF integrado. La revisión jurídica externa se realizará en una etapa futura y no constituye un gate actual; el expediente queda preparado para ella.
