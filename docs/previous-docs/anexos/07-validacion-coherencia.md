# Validación de coherencia

Estado: **gate normativo**

La auditoría documental comprobará automáticamente:

- todos los Markdown no vacíos, con título y estado;
- enlaces y anchors locales válidos;
- IDs únicos y definiciones existentes;
- índice igual al inventario real;
- fuentes con autoridad, fecha, URI y digest cuando haya snapshot;
- requisitos enlazados a fuente y evidencia prevista;
- decisiones referenciadas y no contradictorias;
- nombres de paquetes, versiones, modalidades y términos consistentes;
- ausencia de marcadores provisionales y posibles secretos;
- árbol y documentos públicos requeridos;
- ortografía técnica controlada y UTF-8.

Además habrá revisión semántica cruzada de legalidad, dominio, contratos, seguridad, rendimiento, calidad y release. El informe registra commit, toolchain, número de documentos/IDs/fuentes, fallos y resultado.

El gate solo pasa con cero errores. Warnings requieren disposición explícita y no pueden ocultar una contradicción normativa.
