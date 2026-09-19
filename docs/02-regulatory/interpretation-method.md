---
id: REG-DOC-0006
title: Regulatory interpretation method
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
decisions: [ADR-0006, ADR-0008, ADR-0009]
requirements: [REG-0017, REG-0018, REG-0019]
historical-inputs: [REV-001, REV-002, REV-004, REV-062, REV-063]
---

# Regulatory interpretation method

## Interpretation record

Every non-trivial interpretation states the exact question; actor, operation,
mode, territory and date; source passages and authority; established facts;
competing readings; technical consequences; chosen result; confidence;
falsifying evidence; external-review need; requirements/tests and review trigger.

## Method

1. Establish legal/technical applicability before meaning.
2. Read the provision in system context, including definitions, annexes,
   amendments, transitional provisions and enabled technical specifications.
3. Separate minimum legal obligation from optional product strengthening.
4. Compare official FAQ/examples and actual test-environment observations
   without allowing them to silently displace authority.
5. Test every reading against integrity, history preservation, taxpayer
   isolation, failure and inspection objectives.
6. Prefer the reading that satisfies all applicable higher authorities; do not
   use “fail closed” to invent extra fiscal facts.
7. Block and seek competent external advice when ambiguity can change emitted or
   signed bytes, applicability, mode, declaration or taxpayer outcome.

## Evidence classification

`fact` is directly supported; `inference` follows stated reasoning;
`observation` records environment behavior; `recommendation` chooses engineering
policy; `legal-review` records a named external professional opinion. None is
mislabelled as another.

## AEAT response observations

An accepted record demonstrates only the submitted bytes, environment, identity,
time and observable validation. It does not prove all rules or production
acceptance. Rejection can reveal a rule but requires reconciliation with the
official catalogue before becoming normative.

## Conservative behavior

Unresolved applicability produces `indeterminate`. Unresolved representation
blocks generation. A documented optional strengthening is permitted only when it
does not alter official semantics, interoperability, privacy or the declaration.

## Reconsideration

New legislation, source drift, contradictory AEAT result, court/administrative
criterion, security finding or consumer incompatibility invalidates affected
interpretations and triggers a new edition/ADR; old records remain preserved.
