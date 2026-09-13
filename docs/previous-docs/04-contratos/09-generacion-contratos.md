# Generación de contratos regulatorios

Estado: **normativo**

`scripts/generate-contracts.mjs` procesa exclusivamente snapshots locales verificados. El parser XML se ejecuta en modo estricto, sin DTD ni red, y el resultado se normaliza de forma determinista.

Por cada WSDL/XSD se genera inventario de namespaces, elementos, atributos, tipos, enums, restricciones, cardinalidades, imports, servicios, operaciones, mensajes, bindings y SOAP actions. Cada entrada conserva un ID estable, localizador, artefacto y digest.

Los derivados son:

- `manifest.json` y `checksums.json` de la edición;
- catálogos de tipos y operaciones;
- mapa fuente–contrato–requisito;
- módulos TypeScript readonly bajo `packages/verifactu/src/generated/`;
- metadatos consultables mediante los subpaths `editions`, `schemas` y `catalogs`.

La generación no implementa reglas de negocio, serialización XML, firma, QR ni transporte. Esos comportamientos deberán consumir estos contratos en fases posteriores y conservar la edición como dependencia explícita.
