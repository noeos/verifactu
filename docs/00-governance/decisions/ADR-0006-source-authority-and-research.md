---
id: ADR-0006
title: Source authority and reproducible research
status: proposed
authority: decision
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
supersedes: []
---

# ADR-0006: Source authority and reproducible research

## Context

Fiscal rules, protocols and platforms evolve. Search results, memory or an
unversioned live page cannot reliably authorize long-lived behavior.

## Options considered

1. Use convenient current web guidance: fast, but volatile and weak authority.
2. Store every external page: reproducible, but may violate licenses and still
   obscure precedence.
3. Maintain an authority hierarchy, source registry and controlled snapshots
   only where bytes affect behavior.

## Decision

Adopt option 3. Prefer primary governing sources, record version/applicability
and consultation date, separate fact from inference, and digest material inputs.
Professional secondary sources inform comparisons but cannot override authority.

## Consequences

Research is slower and source drift triggers impact review. Licensing and
retention must be evaluated. The result is reproducible regulatory editions and
auditable decisions.

## Verification and reversal

Source schemas, review deadlines and drift jobs enforce the registry. Changing
precedence requires a successor ADR and reassessment of dependent requirements.
