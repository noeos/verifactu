---
id: SEC-INDEX
title: Security and privacy documentation
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [PROD-INDEX, REG-INDEX, REQ-INDEX, DOM-INDEX, PLAN-L1]
historical-inputs: [REV-009, REV-010, REV-011, REV-012, REV-013, REV-014, REV-015, REV-016, REV-017, REV-019, REV-020, REV-021, REV-027, REV-028, REV-029, REV-030, REV-038, REV-043, REV-044, REV-052, REV-053, REV-059, REV-064, REV-068, REV-069, REV-070, REV-073, REV-075, REV-076, REV-078, REV-079, REV-080, REV-081]
---

# Security and privacy

This area defines threats, privacy harms, controls and proof across product,
repository, build, release and operation. Security is a property of actual
boundaries and behavior, not the presence of security words or green scanners.

## Document set and order

1. `security-objectives.md`
2. `assets-actors-and-trust-boundaries.md`
3. `threat-model.md`
4. `abuse-cases.md`
5. `control-catalog.md`
6. `xml-signature-and-parser-security.md`
7. `network-and-endpoint-security.md`
8. `keys-certificates-and-secrets.md`
9. `resource-exhaustion-and-limits.md`
10. `tenant-and-context-isolation.md`
11. `data-classification-and-privacy.md`
12. `logging-redaction-and-telemetry.md`
13. `vulnerability-management.md`
14. `security-verification-plan.md`
15. `residual-risk.md`

See [`PLAN-L1`](../lot-1-foundations-plan.md#area-10-security-and-privacy).

## Threat and control rules

Threat modeling covers data and control flow, malicious actors and accidental
partial failure. Every `THR-*` maps to assets, preconditions, impact, controls,
verification and residual risk. Every critical control has a negative fixture
that demonstrates failure when it is removed or bypassed.

Privacy records data category, purpose, controller/processor split,
minimization, recipient, locality, retention, rights interaction and logging
rule. Fiscal retention never permits unrelated telemetry or indefinite copies.

## Area exit gate

There are no unowned trust crossings, unrestricted inputs, mutable endpoint
allowlists, hidden network access, raw secrets/fiscal data in diagnostics or
critical threats accepted without explicit authority. Framework mappings state
applicability and gaps rather than claiming blanket compliance.
