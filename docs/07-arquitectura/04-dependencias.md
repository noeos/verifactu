# Dependencias

Estado: **normativo**

Dependencia runtime inicial obligatoria: `@noeos/verification-engine@1.0.1`. XML, XSD, firma u otras capacidades podrán usar bibliotecas maduras después de admisión documentada; no se reimplementarán estándares de seguridad para reducir artificialmente el contador.

## Admisión

Toda dependencia registra necesidad, alternativas, versión exacta, licencia, mantenedor, procedencia, scripts de instalación, superficie transitiva, advisories, política de actualización y sustitución.

Se prohíben rangos flotantes en desarrollo, fuentes no registradas, lifecycle scripts no aprobados y paquetes de runtime usados solo por CLI/build. El lockfile es v3 y toda ocurrencia de registry conserva integrity.

La biblioteca y CLI no importan dependencias dev en runtime. La CLI depende de la versión exacta de la biblioteca del mismo release.

Una actualización ejecuta inventario, licencias, audit, OSV, consumidores, contratos, reproducibilidad, SBOM y performance.
