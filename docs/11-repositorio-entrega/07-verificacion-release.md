# Verificación de release

Estado: **normativo**

Workflow separado, disparado por publicación y manualmente, verifica sin confiar en artifacts internos del job de release:

- firma del tag contra `security/allowed-signers`;
- ancestría y versión;
- checksums y contenido de assets;
- tarballs GitHub, npm y reconstruidos;
- npm signatures/provenance;
- attestations GitHub y workflow emisor;
- SBOM y licencias;
- manifiesto de fuentes/edición;
- instalación limpia, ESM/CJS/types/CLI;
- vectores y expediente.

El resultado se conserva como artifact firmado y enlazado en la release. Un fallo posterior abre incidente y bloquea nuevas publicaciones; no se corrige editando assets inmutables, sino mediante nueva versión.
