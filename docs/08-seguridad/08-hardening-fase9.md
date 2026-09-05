# Hardening de seguridad de la fase 9

Estado: **completada — 2026-09-05**

El cierre exige que CodeQL no tenga alertas abiertas y que cada hallazgo de Scorecard tenga una
remediación o una justificación factual reproducible. Las señales temporales de madurez del
proyecto (`Maintained`, ausencia de cambios aprobados históricos o badge externo) no se descartan:
se mantienen visibles hasta que la evidencia cambie. También se ejecutan los controles de límites,
XML, red, rutas, symlinks, logs, secretos, dependencias, SBOM y acciones fijadas a SHA. No se
aceptan descartes de alertas sin análisis reproducible y revisión.

Los datos regulatorios solo se importan mediante el flujo explícito con host HTTPS allowlist,
redirecciones restringidas, límites, digest y escritura atómica. CI trabaja con snapshots y no
descarga fuentes mutables de forma implícita.
