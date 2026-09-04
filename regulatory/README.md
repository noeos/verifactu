# Registro regulatorio machine-readable

Estado: **normativo para la edición regulatoria aeat-rrsif-1.0@2026-09-03**

Este directorio fija las dependencias regulatorias que la implementación deberá importar de forma reproducible. [`sources.json`](sources.json) identifica los contratos XML oficiales de la edición AEAT 1.0 observados el 3 de septiembre de 2026, con tamaño y digests de los bytes remotos.

## Reglas de importación

1. La red solo se usa en un trabajo explícito de actualización regulatoria, nunca durante build, test ordinario ni ejecución de la biblioteca.
2. El importador descarga en cuarentena, limita tamaño y redirecciones, verifica HTTPS, nombre permitido, media type y ambos digests antes de promover un artefacto.
3. Los imports relativos de WSDL/XSD se resuelven exclusivamente contra el conjunto aprobado; DTD, entidades externas y accesos de red quedan prohibidos.
4. El snapshot promovido vive bajo `regulatory/snapshots/<edition>/`; los tipos y catálogos generados son derivados revisables, no fuentes. `npm run regulatory:snapshots` verifica los bytes sin red.
5. Un byte distinto crea una edición candidata y un informe de impacto. Nunca reemplaza silenciosamente la edición activa.
6. La publicación npm incorpora los contratos necesarios y funciona sin red. El consumidor puede consultar la edición y los digests mediante API y CLI.

La generación local se ejecuta con `npm run contracts:generate` y se comprueba con `npm run contracts:check`. Una discrepancia en la fuente o en cualquier derivado bloquea CI.

Los PDF, normas y páginas explicativas se registran en [`../docs/anexos/01-fuentes.md`](../docs/anexos/01-fuentes.md). Sus versiones gobiernan la interpretación; los XSD/WSDL gobiernan estructura, orden, cardinalidad y tipos cuando no contradigan una fuente superior.
