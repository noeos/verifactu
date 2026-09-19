# Cadena de suministro

Estado: **normativo**

## Controles

- dependencias directas justificadas y exactas;
- lockfile con integrity y registry permitido;
- instalación sin scripts por defecto;
- inventario de licencias y de herramientas CI;
- Actions fijadas a commit y allowlist del repositorio;
- toolchain Node/npm y referencia independiente fijados;
- CodeQL, OSV, npm audit, dependency review y Gitleaks;
- paquetes con allowlist de archivos;
- builds y tarballs reproducibles;
- SBOM CycloneDX y SPDX;
- OIDC, npm provenance y attestations GitHub;
- verificación desde consumidor limpio tras publicar.

No se aceptan secrets de larga duración para npm. Una release cuya procedencia, firma, checksum o contenido no coincidan se considera comprometida y se retira siguiendo el runbook.
