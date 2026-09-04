# Soporte y recuperación

Estado: **normativo**

Cada major estable tendrá fecha pública de soporte, runtimes, ediciones regulatorias y política de seguridad. Una edición necesaria para evidencia legal se mantiene verificable aunque deje de admitir creación nueva.

Runbooks: AEAT caída, certificado caducado/revocado, backlog, disco lleno, corrupción, rollback, respuesta desconocida, fuente oficial cambiada, paquete comprometido y pérdida de mantenedor.

RPO para registros confirmados: 0 dentro de la transacción declarada. RTO objetivo del componente y adapters de referencia se fija tras drills; no se promete recuperación del servicio AEAT.

Drill por release reconstruye desde commit, empaqueta, instala consumidor, detecta manipulación, restaura estado, verifica cadenas y reanuda outbox sin duplicar. Evidencia y desviaciones se conservan.
