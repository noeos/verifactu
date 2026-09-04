# Noeos VERI*FACTU

Noeos VERI*FACTU será el componente público de cumplimiento técnico del Reglamento de requisitos de los sistemas informáticos de facturación (RRSIF). Cubrirá las modalidades VERI*FACTU y NO VERI*FACTU mediante una biblioteca TypeScript y una CLI reutilizables, sin asumir las funciones comerciales de una aplicación de facturación.

El proyecto se encuentra en fase de especificación. La fuente de verdad es [`docs/README.md`](docs/README.md). No se implementará una capacidad hasta que su comportamiento, fundamento normativo, contrato, riesgos y pruebas estén cerrados allí.

## Fronteras

- `verification-engine` aporta integridad y evidencia genéricas; no conoce facturas ni regulación.
- `verifactu` concentra modelos, reglas, formatos, huellas, firmas, QR, comunicaciones y estados RRSIF.
- `facturacion` será la aplicación comercial y consumirá únicamente contratos públicos de este componente.
- La factura electrónica B2B es un régimen relacionado, pero no forma parte de la implementación de este repositorio.

## Estado

No existe todavía una release del producto. La aprobación de la planificación completa precede a cualquier código de producción.

## Licencia

El trabajo original de Noeos se distribuirá bajo Apache License 2.0. Las fuentes oficiales reutilizadas conservan su atribución y condiciones propias; véase [`docs/02-legalidad/11-licencias-reutilizacion-pi.md`](docs/02-legalidad/11-licencias-reutilizacion-pi.md).
