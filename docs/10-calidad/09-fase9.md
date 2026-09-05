# Estrategia de calidad de la fase 9

Estado: **en ejecución — 2026-09-05**

La fase combina pruebas unitarias, contractuales, integración, e2e de CLI, seguridad, propiedades,
fuzzing, mutación, stress, recuperación, compatibilidad ESM/CJS y consumers por tarball. Las
entradas inválidas se prueban junto con las válidas y los resultados indeterminados nunca se
convierten en éxito.

El gate exige cobertura mínima de 98 % en líneas y funciones y 95 % en ramas, cero skips, cero
flakes aceptados, 100 % de mutantes críticos eliminados y al menos 95 % global.
