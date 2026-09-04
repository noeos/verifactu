# Arquitectura

Estado: **normativo**

## Capas internas

1. **Regulatory sources:** snapshots y metadatos oficiales.
2. **Contracts:** tipos, esquemas, catálogos y ediciones generados.
3. **Domain:** validación y reglas puras.
4. **Cryptographic formats:** huella, XML, firma y QR.
5. **Application:** transacciones, estados, outbox y reconciliación.
6. **Ports:** almacenamiento, firma, reloj, transporte y observación.
7. **Adapters:** implementaciones Node y del host.
8. **Public API/CLI:** fachadas estables.

Las dependencias apuntan hacia contratos y dominio. Dominio no importa aplicación, adapters, CLI, filesystem, red o variables de entorno. CLI consume la API pública, no módulos internos.

La edición regulatoria es una dependencia explícita de cada operación. No existe configuración global mutable ni detección automática basada en fecha actual.
