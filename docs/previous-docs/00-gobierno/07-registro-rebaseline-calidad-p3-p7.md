# Registro histórico: rebaseline de calidad antes de P4

Estado: **histórico; lección obligatoria para el plan vigente**
Identificador: `HIST-QUALITY-REBASELINE-001`
Fecha: 2026-09-19
Referencia protegida: PR #33, commit `4eb2e5c042badbe8f4c4bfa2dfec885462e4ddae`
Primer commit posterior: PR #34, commit `0e3ffaf88cd60ad0d06658f7b387c287ab66fc27`

## Motivo

La auditoría integral de P7 demostró que los cierres de P4, P5 y P6 no
probaron los umbrales globales de calidad exigidos para el producto completo.
Las pruebas de contrato, seguridad, paquetes y consumidores pasaban dentro de
sus respectivos alcances, pero no existía una medición continua de toda la
población de código productivo ni una compuerta que impidiera cerrar la fase
sin ella.

La decisión de rebaseline conserva P1–P3 como base documental, regulatoria, de
fuentes, contratos y oráculos, y reabre la construcción de producto desde el
checkpoint protegido inmediatamente anterior a P4. No se considera que exista
una release válida ni se trasladan afirmaciones de preparación desde el árbol
histórico.

## Evidencia histórica

| Fase | Cierre protegido                                   | Observación relevante                                                        |
| ---- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| P3   | PR #33, `4eb2e5c042badbe8f4c4bfa2dfec885462e4ddae` | Último checkpoint elegido para reanudar.                                     |
| P4   | PR #38, `fd4b81640332a0d4f2169155d0f6f2d37ea0c1b6` | Cerró su alcance declarado, pero dejó la calidad integral para P7.           |
| P5   | PR #41, `5207cd4db6291f8b31b2f9a23354ee9755ba8cdc` | Añadió persistencia/AEAT sin una compuerta global nueva.                     |
| P6   | PR #44, `35cc132f20e9290b93dba4bee3d716c92745f57a` | Añadió productos públicos y consumidores; tampoco demostró el umbral global. |
| P7   | PR #46 y correcciones posteriores                  | Fue la primera campaña integral; reveló el déficit.                          |

La medición completa de P7 obtuvo:

- 22 módulos de producción medidos.
- 89.88% de líneas, 80.11% de funciones y 55.4% de ramas.
- 4.973 mutantes generados en 21 archivos mutables.
- 2.880 mutantes válidos; 971 eliminados: 33.72%.
- 1.257 supervivientes, 652 sin cobertura, 8 timeouts y 2.085 errores de
  compilación.
- 20 scripts instalados, 1.000 casos de fuzzing y 259 casos de propiedades
  completados, pero sin compensar los umbrales globales fallidos.

Estas cifras son evidencia de diagnóstico, no una autorización ni una
excepción. Los porcentajes anteriores que figuraban en fases previas no eran
comparables: procedían de poblaciones parciales, tests de alcance limitado o
controles sin denominador integral.

## Causa raíz de proceso

1. P4–P6 permitieron cerrar alcances locales sin exigir la instrumentación y
   los denominadores globales que ya figuraban como objetivo de release.
2. La cobertura de fachadas públicas y contratos se interpretó como señal de
   calidad interna del producto completo.
3. La mutación, el fuzzing y la calidad integral se aplazaron a P7, cuando el
   coste de corregir ramas y diseños no testeables ya era alto.
4. Los informes podían ser `passed` dentro del task graph aunque la fase
   siguiera sin satisfacer sus umbrales de salida.
5. No existía una compuerta P3-B que verificase, antes de escribir P4, que el
   toolchain, CI, evidencias, fuentes, oráculos, seguridad y reglas de cierre
   estaban listos para medir cada fase desde su primer commit.

## Controles preventivos obligatorios

Toda fase futura DEBE:

- definir antes de implementar su población de código, denominadores, métricas,
  umbrales, exclusiones justificadas y catálogo crítico;
- tener tareas ejecutables para cada criterio, incluyendo estados `blocked` y
  `failed`, sin convertir falta de evidencia en `passed`;
- ejecutar la matriz de toolchain, Node/Python/npm/TypeScript y sistemas
  operativos declarados antes del cierre;
- ejecutar CI completo sobre el head final, con firmas, DCO, required contexts,
  cierre de checks, seguridad, OSV, licencias, CodeQL, secreto, reproducibilidad
  y compatibilidad;
- medir cobertura, mutación, propiedades, fuzzing, fault injection,
  concurrencia, recuperación, rendimiento y consumidores en el alcance real;
- conservar el informe bruto, sujeto, árbol, digest, configuración y comando;
- rechazar porcentajes agregados que oculten módulos, ramas críticas,
  mutantes no válidos, tests omitidos, retries, skips o errores de infraestructura;
- demostrar regresiones sembradas y sus variantes antes de cerrar;
- actualizar handoff, roadmap, riesgos, hallazgos, changelog y trazabilidad en
  el mismo ciclo de evidencia;
- requerir revisión externa o autoridad autorizada cuando el criterio la exija,
  sin relabeling de autoevaluación como independencia.

## Regla de cierre aprendida

Una fase no puede cerrarse porque sus tests conocidos pasan, porque el PR está
fusionado, porque la cobertura “parece alta” o porque la siguiente fase puede
arreglarlo. Solo puede cerrarse cuando una matriz de salida firmada demuestra
que cada celda aplicable tiene evidencia exacta y que cada porcentaje o umbral
definido pasa. Si una celda no puede medirse, el estado es `blocked`, no
`evidence-complete`.

## Reanudación

El siguiente trabajo normativo es `P3-B — pre-P4 assurance gate`, descrito en
`docs/17-roadmap-risk/p3b-pre-p4-assurance.md`. P3-B debe verificar P1–P3
completos antes de permitir P4. P4 deberá incorporar sus campañas de calidad
desde el primer work package, no como reparación posterior.

Este registro se conserva como material histórico y no autoriza reutilizar
implementaciones, métricas o cierres del periodo P4–P7 sin repetir evidencia.
