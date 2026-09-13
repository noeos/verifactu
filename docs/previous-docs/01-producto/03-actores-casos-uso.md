# Actores y casos de uso

Estado: **normativo**

## Actores

- Productor o desarrollador del SIF.
- Obligado tributario que factura.
- Representante o colaborador autorizado.
- Aplicación de facturación consumidora.
- Operador técnico responsable de certificados y continuidad.
- AEAT como receptora y autoridad de contraste.
- Auditor o inspector que verifica y exporta evidencia.

## Casos de uso completos

- Configurar una instalación y edición regulatoria sin mezclar obligados.
- Expedir una factura y asegurar su alta simultánea.
- Anular mediante un nuevo registro sin eliminar historia.
- Registrar los eventos exigidos en NO VERI*FACTU.
- Generar QR y leyenda coherentes con modalidad y registro.
- Firmar, conservar, exportar y verificar registros locales.
- Remitir registros, interpretar respuestas y conservar exactamente lo enviado y recibido.
- Recuperarse de timeout, caída, duplicado, rechazo y reinicio.
- Subsanar un error siguiendo el flujo oficial, sin reescribir el pasado.
- Migrar de edición normativa conservando verificabilidad histórica.
- Producir un expediente por versión e integración.

Cada caso tendrá caminos válido, inválido, indeterminado, abortado y fallo externo cuando sean aplicables.
