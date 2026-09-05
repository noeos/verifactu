# Contrato de la API pública de fase 8

Estado: **cerrado — 2026-09-05**

`createVerifactu(config)` devuelve `Result<Verifactu>`. El resultado nunca lanza por entrada de
usuario: un error se expresa con código y diagnósticos ordenados. La edición se valida contra la
edición normativa generada y una configuración mutable se copia y congela.

La fachada ofrece preparación de altas, anulaciones y eventos; commit CAS atómico con evidencia;
verificación de artefactos y de integridad de cadena; QR; construcción e inspección de remisiones;
procesamiento de outbox; reconciliación explícita e indeterminada cuando no existe observación; y
exportación NDJSON con bytes Base64. En modalidad `no-verifactu` exige un `SignerPort` antes de
persistir bytes.

Los adapters de persistencia, transporte, reloj, observación, firma y certificados son puertos.
No se crean conexiones, relojes globales, claves privadas ni ficheros desde la biblioteca.
`AbortSignal` tiene prioridad y produce `ABORTED`/`aborted` antes de inspeccionar datos no confiables.
