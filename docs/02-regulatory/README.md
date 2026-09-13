---
id: REG-INDEX
title: Regulatory foundations documentation
status: draft
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [GOV-002, GOV-005, GOV-006, PLAN-L1]
historical-inputs: [REV-001, REV-002, REV-003, REV-004, REV-005, REV-006, REV-007, REV-008, REV-012, REV-013, REV-014, REV-022, REV-023, REV-037, REV-038, REV-039, REV-040, REV-041, REV-045, REV-046, REV-062, REV-063]
---

# Regulatory foundations

This area is the authority for legal applicability, official sources,
regulatory editions and monitored change. It records engineering requirements
derived from law; it does not represent software authorship as legal advice or
external certification.

## Document set and order

1. `source-hierarchy.md`
2. `legal-framework.md`
3. `applicability-and-exclusions.md`
4. `official-source-register.md`
5. `regulatory-editions.md`
6. `interpretation-method.md`
7. `ambiguities-and-open-questions.md`
8. `regulatory-monitoring.md`
9. `retention-and-evidence.md`
10. `responsible-declaration.md`
11. `related-regimes.md`
12. `source-import-and-snapshots.md`

See the binding elaboration contract in
[`PLAN-L1`](../lot-1-foundations-plan.md#area-02-regulatory-foundations).

## Baseline rules

- Original BOE publication plus amendments outrank consolidated convenience text.
- Applicability is a multidimensional decision, never a single mode boolean.
- RRSIF is not TicketBAI, Batuz, SII or future B2B e-invoicing.
- A FAQ may clarify but cannot silently override a regulation or order.
- Source drift blocks affected claims until impact is classified.
- Responsible declarations are tied to exact product versions and evidence;
  there is no invented government certification process.

## Area exit gate

Every sourced clause has applicability, interpretation, requirement links and
edition membership. Every source affecting bytes or acceptance has provenance
and digest. All ambiguity has an owner and blocking effect; `unknown` is never
resolved by permissive behavior.
