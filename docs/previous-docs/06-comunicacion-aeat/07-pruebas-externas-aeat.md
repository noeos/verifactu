# Pruebas externas AEAT

Estado: **normativo de diseño**

El portal oficial de pruebas se usa para validar interoperabilidad, nunca con datos personales reales. Certificados de pruebas permanecen fuera de Git, artifacts y logs.

La suite cubrirá altas, anulaciones, lotes, errores representativos, duplicados, orden, QR/cotejo cuando esté disponible, timeout controlado y respuesta parcial. Cada ejecución registra entorno, edición, endpoint, certificado por huella, commit, request/response redactados, resultado y fecha.

Las pruebas locales con fixtures siempre preceden a las externas. Una caída del portal no se transforma en éxito: la evidencia queda indeterminada y una release estable que exija esa validación permanece bloqueada.

Nunca se ejecutan pruebas destructivas o de carga contra servicios oficiales sin autorización expresa y límites publicados.
