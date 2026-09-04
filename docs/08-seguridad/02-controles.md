# Controles de seguridad

Estado: **normativo**

- Validación estricta, allowlists y límites antes de efectos.
- Inmutabilidad, append-only, hashes, firmas y compare-and-set.
- Mínimo privilegio y separación entre dominio, almacenamiento, clave y red.
- Identidades y entornos explícitos; no fallback.
- Idempotencia y replay protection.
- Redacción de datos y telemetría desactivada.
- Dependencias exactas, Actions por SHA, SBOM y provenance.
- Builds reproducibles, commits/tags firmados y release verificada.
- Backups cifrados, restauraciones ensayadas y rollback detection.
- Alertas accionables y respuesta a incidentes.

Cada control tendrá ID, amenaza, responsable, implementación, prueba, evidencia, frecuencia y fallo esperado en [`../anexos/03-matriz-controles.md`](../anexos/03-matriz-controles.md).

Un control declarado pero no verificable no cuenta como mitigación.
