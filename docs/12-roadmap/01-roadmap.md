# Roadmap completo

Estado: **normativo**

1. **Completada — 2026-09-03:** aprobar corpus documental y fuentes.
2. **Completada — 2026-09-04:** gobierno del repositorio, toolchain y CI; configuración pública y protegida de GitHub auditada, workflows verdes y commits firmados.
3. **Completada — 2026-09-04:** importar y versionar las ocho fuentes oficiales WSDL/XSD de la edición AEAT fijada, con hashes, procedencia, validación offline, trazabilidad y contratos generados deterministas.
4. **Completada técnicamente — 2026-09-04:** implementar dominio, validación, huella y evidencia interna; XML, firma, QR, persistencia y transporte siguen fuera del alcance de esta fase.
5. **Completada técnicamente — 2026-09-05:** implementar XML seguro y determinista, QR AEAT con corrección M, contratos de certificados opacos y puerto XAdES-EPES interoperable; persistencia, transporte y validación final con portal AEAT siguen fuera del alcance.
6. Implementar persistencia contractual, estados y outbox.
7. Implementar transporte y respuestas AEAT.
8. Implementar API, CLI y kit de adapters.
9. Completar seguridad, fuzz, mutación, rendimiento y recuperación.
10. Validar portal AEAT, consumers y compatibilidad histórica.
11. Auditar expediente y publicar 1.0.0.

Cada etapa entrega evidencia completa de sus contratos, pero ninguna se distribuye como producto estable incompleto. Trabajo paralelo solo ocurre entre módulos con contratos ya cerrados.
