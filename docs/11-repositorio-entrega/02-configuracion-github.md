# Configuración GitHub

Estado: **normativo**

Baseline equivalente a `verification-engine`, auditado por script y snapshot en `security/github-settings.json`.

## Repositorio

- público, rama por defecto `main`;
- issues y private vulnerability reporting activos;
- wiki, projects, pages, downloads y discussions desactivados;
- Dependabot alerts/fixes, secret scanning y push protection activos;
- squash único, auto-merge y actualización de rama desactivados;
- CODEOWNERS y labels `bug`, `dependencies`, `proposal`, `regulatory`, `security`, `supply-chain`;
- sin deploy keys, webhooks, secretos persistentes de Actions/Dependabot/environment ni invitaciones pendientes;
- organización con 2FA, sign-off web y permiso base `read`.

## Rulesets

`main`: commits firmados, PR, dos aprobaciones independientes, revisión CODEOWNERS, aprobación del último push, checks estrictos, historial lineal, resolución de conversaciones, stale reviews descartadas, cambios no atribuidos con aprobación adicional y sin borrado/force-push/bypass. El ruleset no contiene bypasses permanentes; cualquier excepción administrativa puntual queda registrada en el expediente de entrega.

Checks requeridos previstos:

- `Required · quality and policy`;
- `Required · regulatory sources and traceability`;
- `Required · RRSIF conformance`;
- Ubuntu 24.04 en Node 22 mínimo, último 22 revisado y Node 24 primario;
- Windows 2025 y macOS 15 en Node 24 primario;
- `Required · package reproducibility`;
- dependency review, CodeQL, secret scan, OSV y npm audit/license inventory.

El rendimiento smoke es informativo en PR; el gate oficial es obligatorio para RC/release y cambios etiquetados `performance-critical`. Fuzz continuo es informativo solo porque su presupuesto temporal excede PR, pero todo crash confirmado se convierte en test requerido.

`v*`: tag firmado e inmutable, sin actualización ni borrado. Por equivalencia operativa con `verification-engine`, el ruleset conserva el bypass de `OrganizationAdmin`; la excepción está registrada en D-013 y en el snapshot auditable.

Actions usa allowlist, SHA completo registrado en `security/workflow-actions.json`, permisos `contents: read` por defecto y no puede aprobar PR. Solo jobs concretos reciben `security-events: write`, `id-token: write`, `attestations: write` o `packages: write`.

## Environments

`npm-staging` acepta únicamente tags `v*.*.*-rc.*`; `npm-production`, únicamente `v*.*.*`. Ambos exigen revisión; producción impide autoaprobación y conserva el bypass administrativo heredado documentado en D-013. La publicación usa trusted publishing OIDC de npm, nunca un `NPM_TOKEN` persistente.

El script `scripts/audit-github.mjs` compara la API de GitHub con `security/github-settings.json`, incluyendo superficie privada y alertas abiertas. Cualquier diferencia falla el gate; el snapshot nunca contiene secretos.
