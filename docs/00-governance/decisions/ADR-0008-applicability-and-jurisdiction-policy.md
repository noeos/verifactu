---
id: ADR-0008
title: Applicability and jurisdiction policy
status: proposed
authority: decision
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
supersedes: []
requirements: [REG-0001, REG-0002, REG-0003]
risks: [RISK-0002]
---

# ADR-0008: Applicability and jurisdiction policy

## Context

RRSIF applicability depends on person, tax regime, territory, SII status,
activity, operation, role and date. A Spanish address or mode flag is not enough.

## Decision

The supported legal target is common-territory RRSIF, including applicable
specialties for Canarias, Ceuta and Melilla. The component evaluates a complete
applicability input and returns `applicable`, `not-applicable-demonstrated` or
`indeterminate`; only the first may enter RRSIF generation. SII exclusions,
foral regimes and exceptional authorizations are explicit inputs/evidence.

TicketBAI, Batuz, foral SII and future B2B electronic-invoice compliance are not
implemented by pretending they are RRSIF variants. Their boundaries and host
coordination are documented.

## Consequences and verification

The host must collect legally meaningful facts and retain the applicability
decision basis. Missing or contradictory facts fail closed. Decision tables test
every branch, boundary date and mixed-activity case against cited authority;
external legal review is required for unresolved material interpretations.
