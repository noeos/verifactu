# Claves, certificados y almacenamiento

Estado: **normativo**

Las claves privadas no se exportan, serializan, registran ni copian a fixtures. El proceso recibe permisos mínimos para invocar firma y autenticación. Producción debe poder usar HSM o almacén del sistema mediante el mismo puerto.

La rotación conserva qué certificado firmó cada registro y evita mezclar una firma nueva con bytes históricos. Caducidad y revocación generan alerta y bloqueo según política oficial.

Almacenamiento cifra en reposo cuando el entorno lo requiere, aplica control de acceso, integridad de metadata, backups separados e inventario. El hash no sustituye confidencialidad.

Restaurar incluye verificar cadena, cabeza, outbox, firmas y freshness antes de reabrir escrituras. Una copia antigua nunca avanza silenciosamente sobre una secuencia más reciente.
