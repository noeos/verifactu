# Trazabilidad de requisitos

Estado: **normativo**

## Familias

| Prefijo | Autoridad                                      |
| ------- | ---------------------------------------------- |
| `LEG`   | alcance, jerarquía y obligaciones legales      |
| `REG`   | comportamiento regulatorio RRSIF/AEAT          |
| `DOM`   | modelo e invariantes de dominio                |
| `CON`   | API, CLI, esquemas y compatibilidad            |
| `SEC`   | seguridad y privacidad                         |
| `PER`   | rendimiento y recursos                         |
| `QUA`   | pruebas, auditoría y calidad                   |
| `OPS`   | operación, publicación, soporte y recuperación |

## Cadena obligatoria

Cada requisito DEBE registrar: ID, texto verificable, estado, fuente y fragmento, interpretación, contratos afectados, riesgos, pruebas o vectores, evidencia de CI/release y versión de introducción. La matriz canónica se mantendrá en [`../anexos/02-matriz-requisitos.md`](../anexos/02-matriz-requisitos.md).

No se aceptan:

- fuentes sin evaluación de aplicabilidad;
- obligaciones en alcance sin requisito;
- requisitos sin criterio de aceptación;
- contratos o reglas sin requisito;
- pruebas que no indiquen qué requisito demuestran;
- afirmaciones de release sin evidencia reproducible.

Los requisitos retirados conservan su historia, sustituto y última edición aplicable.
