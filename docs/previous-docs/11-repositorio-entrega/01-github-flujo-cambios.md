# GitHub y flujo de cambios

Estado: **normativo**

Todo cambio nace de una incidencia/propuesta, se desarrolla en rama y entra por PR. Commits deben estar firmados y contener `Signed-off-by` coincidente con autor. El PR declara requisitos, fuentes, impacto regulatorio, seguridad, compatibilidad, rendimiento y evidencia.

`main` exige PR, checks estrictos sobre último commit, conversaciones resueltas, historial lineal y squash. No admite merge commit, rebase merge, force-push, borrado o bypass.

El squash conserva título/mensaje auditables y DCO. Las ramas se eliminan tras merge. Cambios mecánicos generados incluyen fuente y comando reproducible.

No se aprueba un PR con checks omitidos, neutralizados o reemplazados por texto. Excepciones temporales requieren decisión, alcance, mitigación y expiración máxima de 30 días; no se permiten para una release 1.0 estable.
