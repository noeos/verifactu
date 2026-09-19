---
id: REQ-INDEX
title: Requirements documentation
status: approved
authority: normative
owner: requirements-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PROD-INDEX, REG-INDEX, GOV-008, PLAN-L1]
historical-inputs: [REV-001, REV-084]
---

# Requirements

This area is the canonical home of atomic, testable obligations. It converts
product outcomes, legal authority, domain invariants, threats and quality goals
into statements that can fail.

## Document set and order

1. `product-requirements.md`
2. `regulatory-requirements.md`
3. `functional-requirements.md`
4. `non-functional-requirements.md`
5. `security-requirements.md`
6. `performance-requirements.md`
7. `operational-requirements.md`
8. `negative-and-abuse-requirements.md`
9. `acceptance-criteria.md`
10. `traceability-model.md`

See [`PLAN-L1`](../lot-1-foundations-plan.md#area-03-requirements) for the
mandatory record fields and quality gate.

## Requirement quality contract

Each requirement has one subject, observable action, applicability predicate,
source or rationale, measurable success, forbidden outcomes, boundary/failure
behavior, oracle, downstream owner and evidence definition. Ambiguous adjectives
such as `fast`, `secure`, `appropriate`, `complete` and `reliable` require a
controlled definition and measure.

Priority expresses legal authority, safety and product criticality. It does not
authorize omission from the final product. `MUST`, `SHOULD` and `MAY` follow BCP
14 only when capitalized; an applicable legal MUST cannot be waived internally.

## Area exit gate

Bidirectional traceability shows no orphan, duplicate, circular, unverifiable or
unsupported requirement. Every normative branch has positive, negative,
boundary and failure acceptance. Quality-model coverage has no unjustified gap.
