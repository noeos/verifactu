# Estructura del repositorio

Estado: **normativo**

```text
.github/                   comunidad, plantillas y workflows
benchmarks/                escenarios, baselines e informes ignorados
contracts/                 fuentes canónicas Noeos
docs/                      especificación maestra
packages/verifactu/        biblioteca pública
packages/cli/              CLI pública
reference/                 implementación independiente
regulatory/                manifiestos y snapshots oficiales
scripts/                   automatización gobernada
security/                  políticas e inventarios
tests/                     suites por nivel
vectors/                   vectores publicados
```

Dentro de la biblioteca: `domain`, `validation`, `editions`, `records`, `events`, `fingerprint`, `xml`, `signatures`, `qr`, `submissions`, `state`, `ports`, `evidence`, `diagnostics` y `api`.

No se permiten carpetas genéricas `utils`, `helpers`, `misc` o `common`. Cada archivo tiene una responsabilidad nombrable y tests en la suite correspondiente. Código generado se identifica y nunca se edita manualmente.

Build, coverage, artifacts, reports, caches y secretos están ignorados. No se admiten symlinks en paquetes, fuentes regulatorias ni vectores.
