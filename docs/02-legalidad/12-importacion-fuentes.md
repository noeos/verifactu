# Importación y versionado de fuentes

Estado: **normativo**

La edición ejecutable inicial es `aeat-rrsif-1.0@2026-09-03`. Las 22 fuentes registradas en el corpus se identifican por autoridad, publicación, URL oficial, fecha, atribución y digest. Los ocho WSDL/XSD de AEAT se conservan byte a byte bajo `regulatory/snapshots/<edición>/raw/`.

La red solo se usa mediante `npm run regulatory:import -- --fetch`. El comando descarga en cuarentena, limita tamaño y redirecciones, exige HTTPS, valida tipo MIME, calcula SHA-256/SHA-512 y promueve solo bytes que coincidan con el manifiesto. `--offline` verifica el snapshot sin red.

DTD, entidades externas, XInclude, imports remotos, symlinks, path traversal, archivos no declarados, truncación y descompresión no acotada son errores bloqueantes. Un cambio remoto no actualiza nunca la edición activa: genera drift indeterminado y requiere revisión, decisión, nuevo snapshot y commit firmado.

Los snapshots son fuentes; `contracts/editions/<edición>/` contiene derivados generados. El generador no incorpora timestamps ni rutas locales y debe producir los mismos bytes desde el mismo commit. La fuente original conserva sus condiciones de reutilización y nunca se relicencia como Apache-2.0.

La vigilancia programada solo informa de cambios. No hace merge automático ni declara “sin cambios” ante errores de red, HTML inesperado o digest ausente.
