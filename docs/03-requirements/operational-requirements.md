---
id: REQ-DOC-0007
title: Operational requirements
status: draft
authority: normative
owner: requirements-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0007, ADR-0009, ADR-0014]
historical-inputs: [REV-024, REV-025, REV-031, REV-032, REV-033, REV-034, REV-035, REV-041, REV-042, REV-083]
---

# Operational requirements

| ID | Requirement |
| --- | --- |
| `OPS-0001` | Startup MUST validate product/edition/runtime/adapters/providers/storage/configuration compatibility before accepting fiscal work. |
| `OPS-0002` | Readiness MUST be false when a required invariant or dependency for the advertised operation is unavailable; health MUST distinguish process liveness. |
| `OPS-0003` | Configuration MUST be schema-validated, immutable per operation, redacted, attributable and change-audited. |
| `OPS-0004` | Secrets MUST be externally injected through approved providers and MUST NOT be readable through config dump, diagnostics or support bundle. |
| `OPS-0005` | Every durable queue/sequence/attempt MUST expose privacy-safe depth, age, state and stuck-work indicators. |
| `OPS-0006` | Alerts MUST correspond to actionable conditions, owner, severity, runbook and test; alert delivery itself MUST be exercised. |
| `OPS-0007` | Backup/restore MUST cover complete consistent fiscal state and required keys/config/editions/evidence, with scheduled isolated drills. |
| `OPS-0008` | Restore MUST verify schema, manifests, chains, signatures, heads, queues, leases and attempts before reopening generation/submission. |
| `OPS-0009` | AEAT/provider outage MUST preserve admitted work, enforce capacity and expose degraded state without mode downgrade. |
| `OPS-0010` | Indeterminate delivery MUST have an executable consultation/reconciliation runbook before retry. |
| `OPS-0011` | Clock, DNS, certificate, proxy, disk-full, permission, corruption and process-crash failures MUST have safe diagnostics and recovery. |
| `OPS-0012` | Inspection/export MUST be operable by an authorized role without developer access or unrelated confidential data. |
| `OPS-0013` | Deployment MUST preflight compatibility, preserve rollback material and execute post-change invariants. |
| `OPS-0014` | Incident response MUST preserve evidence, bound affected contexts/releases, prevent further harm and avoid public fiscal data. |
| `OPS-0015` | Regulatory/security critical updates MUST have severity-based triage and supported-version response windows. |
| `OPS-0016` | Support bundles MUST be opt-in, minimized, locally reviewable, recipient-encrypted and expiry-bound. |
| `OPS-0017` | End-of-support MUST leave verified export, declarations, editions and offline verification instructions. |
| `OPS-0018` | Manual repair MUST be authorized, append-only, pre/post-verified and auditable; direct history rewrite is forbidden. |

## Operational acceptance

Critical runbooks require drills with injected faults, expected observations,
stop/rollback conditions and evidence. Operator actions use public administrative
contracts; direct database editing is forbidden.
