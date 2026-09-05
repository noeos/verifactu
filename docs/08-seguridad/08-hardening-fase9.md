# Hardening de seguridad de la fase 9

Estado: **en ejecución — 2026-09-05**

El cierre exige resolver todas las alertas abiertas de CodeQL y Scorecard, además de ejecutar los
controles de límites, XML, red, rutas, symlinks, logs, secretos, dependencias, SBOM y acciones
fijadas a SHA. No se aceptan descartes de alertas sin análisis reproducible y revisión.

Los datos regulatorios solo se importan mediante el flujo explícito con host HTTPS allowlist,
redirecciones restringidas, límites, digest y escritura atómica. CI trabaja con snapshots y no
descarga fuentes mutables de forma implícita.
