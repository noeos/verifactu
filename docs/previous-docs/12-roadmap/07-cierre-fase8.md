# Cierre de fase 8: API, CLI y kit de adapters

Estado: **completada técnicamente — 2026-09-05**

La frontera pública está implementada, documentada y exportada con subpaths estables. La API no
realiza I/O implícito, exige firma en NO VERI*FACTU, conserva bytes exactos y devuelve estados
indeterminados cuando la evidencia no permite afirmar éxito. La CLI aplica límites, parseo estricto
y escritura atómica. El kit verifica atomicidad y fencing de adapters.

El cierre requiere todos los gates de `npm run ci` verdes en la PR firmada. No implica todavía
publicación 1.0.0 ni validación en portal AEAT: ambos pertenecen a fases posteriores.
