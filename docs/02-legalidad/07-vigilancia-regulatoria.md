# Vigilancia regulatoria

Estado: **normativo**

## Frecuencia

- Comprobación diaria de BOE, ELI, sede AEAT y portal técnico.
- Revisión humana de alertas antes de merge o release afectada.
- Snapshot completo y firmado en cada release candidate y estable.
- Revisión trimestral de estándares y normativa relacionada.

## Tratamiento

Un cambio crea un informe con bytes anterior/nuevo, metadatos HTTP, diferencias semánticas, requisitos potencialmente afectados, severidad y fecha límite. La automatización no interpreta ni incorpora el cambio por sí sola.

Severidad:

- **crítica:** modifica obligación, bytes, firma, endpoint o validez; bloquea inmediatamente.
- **alta:** cambia esquema, catálogo, error o flujo; bloquea la release afectada.
- **media:** aclara un caso; requiere trazabilidad y pruebas.
- **informativa:** presentación sin efecto demostrado.

Fallo de red, HTML inesperado o ausencia de hash se registran como comprobación indeterminada. Nunca se publicará “sin cambios” sin evidencia.
