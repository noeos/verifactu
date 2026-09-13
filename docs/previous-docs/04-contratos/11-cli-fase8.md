# Contrato de la CLI de fase 8

Estado: **cerrado — 2026-09-05**

El binario `verifactu` lee un documento UTF-8 o NDJSON limitado y escribe solo en stdout, stderr o
una ruta elegida por el usuario. El parser rechaza tipos incompatibles, documentos vacíos, entradas
por encima de los límites y comandos desconocidos. Las salidas soportan `human`, `json` y `ndjson`;
los errores son estructurados y el código de salida es no cero.

Los comandos de capacidades, versión, fuentes, vectores, aplicabilidad, huella, QR e inspección de
respuesta son puros y reproducibles. Operaciones que requieren persistencia, firma, certificados o
transporte deben recibir un adapter explícito; nunca se inventan credenciales ni endpoints. Las
salidas a fichero se escriben con temporal privado, permisos restrictivos y `rename` atómico.
