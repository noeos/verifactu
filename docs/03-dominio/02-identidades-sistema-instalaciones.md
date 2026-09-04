# Identidades, sistema e instalaciones

Estado: **normativo**

Se modelarán por separado productor, producto, versión, obligado tributario, representante, instalación y sistema informático. Un mismo despliegue multiobligado conserva aislamiento lógico, secuencias, claves y evidencia por obligado.

## Reglas

- Identificadores no se infieren de nombres de archivo, hostname o certificado.
- NIF y demás identificadores siguen tipo, país, normalización y validación de la edición oficial.
- La identidad de productor incluida en la declaración coincide con el artefacto y versión publicados.
- Una actualización conserva la identidad de instalación y registra el cambio de versión.
- Clonado, restauración o cambio de instalación sigue un flujo explícito para impedir bifurcaciones silenciosas.
- El uso por tercero o representante conserva al obligado como propietario de los registros y documenta la autorización.

Datos personales no necesarios no se incorporan a identificadores internos, rutas, métricas ni logs.
