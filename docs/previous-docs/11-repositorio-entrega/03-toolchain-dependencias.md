# Toolchain y dependencias

Estado: **normativo**

Perfiles de arranque alineados con Verification Engine y sujetos a actualización controlada antes del primer commit de toolchain:

- Node 22.14.0 + npm 10.9.2: mínimo;
- Node 22.23.2: compatibilidad revisada;
- Node 24.20.0 + npm 11.19.0: primario;
- Node current estable revisado: informativo.

La actualización controlada solo puede avanzar versiones, nunca bajar mínimos de seguridad por conveniencia. `.node-version`, `packageManager`, engines, CI, lock y documentación deben coincidir; `npm` ejecuta con `engine-strict=true`, lockfile v3 y scripts deshabilitados por defecto.

Dependencias directas tienen expediente de admisión: necesidad, alternativas, mantenimiento, licencia, procedencia, permisos, transitive tree, advisories, tamaño y estrategia de salida. Dependabot semanal separa npm y Actions, agrupa solo familias homogéneas, limita cinco PR y no mezcla cambios regulatorios con toolchain. Instalación CI usa `npm ci --ignore-scripts --omit=optional` salvo excepción individual aprobada.

Herramientas externas de CI se descargan desde release oficial con versión y SHA-256 fijados. No se instala globalmente una versión distinta de npm sobre el runtime revisado.
