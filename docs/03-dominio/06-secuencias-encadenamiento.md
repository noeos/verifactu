# Secuencias y encadenamiento

Estado: **normativo**

La secuencia oficial se determina con las reglas RRSIF de generación y registro anterior. Se documentará su relación con obligado, instalación, clase de registro y restauraciones.

## Invariantes

- Génesis se representa explícitamente; cadena vacía y digest vacío no son equivalentes.
- La posición interna es monotónica y no sustituye los campos oficiales.
- Cada nuevo registro referencia exactamente el anterior confirmado de su secuencia.
- Dos registros no pueden confirmar el mismo predecesor salvo que el sistema detecte y bloquee una bifurcación.
- Un fallo no consume posición ni modifica cabeza.
- Batch y streaming confirman transaccionalmente en orden.
- Una restauración antigua debe detectar rollback antes de aceptar nuevos registros.

Verification Engine podrá proteger evidencia interna adicional, pero la huella y enlace RRSIF se calculan exclusivamente con bytes oficiales.
