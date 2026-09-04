# Configuración y aislamiento

Estado: **normativo**

Configuración se construye y valida una vez: edición, modalidad, obligado, instalación, sistema/productor, límites, puertos, políticas de retry y capacidades. Se congela antes de operar.

Secretos no forman parte de configuración serializable. Variables de entorno solo se leen en un adapter/CLI documentado y se convierten a tipos antes de crear la API.

## Aislamiento

- claves, almacenamiento, secuencias, colas y métricas separados por obligado;
- IDs internos opacos y no reutilizados entre instalaciones;
- caches únicamente de datos públicos inmutables por edición;
- ningún estado mutable a nivel de módulo;
- límites y permisos por capacidad, no flags dispersos;
- test obligatorio de contaminación cruzada.

Una configuración incompleta falla al inicio. No se descubren capacidades opcionales durante una expedición.
