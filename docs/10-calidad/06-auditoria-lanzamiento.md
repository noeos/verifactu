# Auditoría de lanzamiento

Estado: **normativo**

Una release candidate reúne commit/tag firmados, árbol limpio, fuentes regulatorias frescas, matriz completa, todos los checks, suite de mutación/fuzz, benchmark oficial, portal AEAT, consumers desde tarball, SBOM, checksums y expediente.

Se verificará independientemente:

- tag pertenece a `main` y versión coincide en todos los artefactos;
- tarballs contienen solo allowlist y se reproducen;
- paquetes npm coinciden con assets y checksums;
- provenance/attestations pertenecen al workflow y commit esperados;
- vectores publicados funcionan desde instalación limpia;
- no hay alertas de CodeQL, secretos, dependencias o fuentes sin revisar; los indicadores de
  madurez de Scorecard se revisan y documentan, sin ocultarlos mediante dismissals;
- afirmaciones públicas coinciden con limitaciones.

Ausencia de autoridad independiente se declara. La auditoría interna no se denomina certificación legal.
