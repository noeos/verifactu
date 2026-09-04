# Build, reproducibilidad y SBOM

Estado: **normativo**

Build comienza validando raíz, lock y toolchain; genera contratos desde fuentes canónicas y compila ESM, CommonJS, tipos y CLI. Limpia únicamente allowlists internas y usa lock para evitar builds concurrentes.

Dos builds limpios consecutivos deben producir el mismo árbol y hashes. Dos `npm pack` deben producir tarballs idénticos. Timestamps y orden usan `SOURCE_DATE_EPOCH` o datos derivados del commit.

Cada paquete tiene allowlist cerrada: dist, tipos, README, changelog, licencia, notice y assets públicos necesarios. Se excluyen fuentes regulatorias no destinadas a distribución, tests, configs, secretos y artifacts.

Se generan CycloneDX y SPDX validados, reporte de licencias, SHA-256/SHA-512 y attestations. Todo componente de registry conserva purl, licencia, integrity y relación.
