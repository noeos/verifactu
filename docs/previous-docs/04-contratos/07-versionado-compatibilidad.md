# Versionado y compatibilidad

Estado: **normativo**

## Ejes

- Paquetes npm: SemVer estable y sincronizado entre biblioteca y CLI.
- Protocolo Noeos: versión entera para formas de evidencia.
- Edición regulatoria: conjunto inmutable de fuentes y contratos.
- Perfil de Verification Engine: `es.noeos.verifactu.record@X.Y.Z`.
- API AEAT: versión oficial conservada.

Cambiar bytes, campos obligatorios, huella, firma, estado, código o interpretación es incompatible salvo que la fuente defina compatibilidad. Se publica nueva edición y se mantienen lectores/verificadores históricos durante el periodo de soporte.

La primera implementación fijará exactamente `@noeos/verification-engine@1.0.1` y declarará protocolo compatible. Actualizarlo exige ejecutar sus vectores, los de `verifactu`, consumidores empaquetados y pruebas de integración desde tarball; nunca se consume su código fuente interno.

Una release no puede retirar una edición aún necesaria para verificar evidencia conservada sin migración verificable y política pública.
