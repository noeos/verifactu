---
id: DOM-INDEX
title: Fiscal domain documentation
status: approved
authority: normative
owner: domain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PROD-INDEX, REG-INDEX, REQ-INDEX, PLAN-L1]
historical-inputs: [REV-001, REV-003, REV-007, REV-015, REV-016, REV-017, REV-018, REV-019, REV-020, REV-021, REV-022, REV-023, REV-024, REV-027, REV-028, REV-029, REV-030, REV-031, REV-032, REV-033, REV-034, REV-035, REV-036, REV-084]
---

# Fiscal domain

This area is the sole internal authority for RRSIF semantics. It models fiscal
facts independently from TypeScript types, XML layout, database tables and AEAT
transport, while preserving exact links to all four.

## Document set and order

1. `ubiquitous-language.md`
2. `domain-model.md`
3. `identities-and-context.md`
4. `invoice-record-boundary.md`
5. `alta-and-anulacion.md`
6. `events.md`
7. `compliance-mode-lifecycle.md`
8. `sequences-and-chaining.md`
9. `states-corrections-and-substitution.md`
10. `catalogs-and-rules.md`
11. `diagnostics.md`
12. `domain-invariants.md`

See [`PLAN-L1`](../lot-1-foundations-plan.md#area-04-fiscal-domain) for the
required aggregates, content and non-negotiable invariants.

## Modeling rules

- Domain identity is explicit and stronger than structural equality.
- Invoice, billing record, wire bytes, signature, submission, response and
  evidence are distinct objects.
- Edition and taxpayer/installation context participate in every dependent operation.
- Correction adds history rather than rewriting a prior fiscal fact.
- Event, generation, durable commit, submission, response and observation times
  are distinct.
- Impossible and indeterminate states are modeled rather than collapsed.

## Area exit gate

State machines are total for supported inputs, reject forbidden transitions and
define crash points. Every aggregate invariant maps to property and negative
tests. The model expresses every official field without normalizing invalid
combinations into valid domain states.
