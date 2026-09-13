---
id: REQ-DOC-0010
title: Requirements traceability model
status: approved
authority: normative
owner: requirements-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0003, ADR-0010]
historical-inputs: [REV-005, REV-063, REV-074, REV-079]
---

# Requirements traceability model

## Canonical record

Required fields are ID, title, statement, strength, status, owner, priority,
applicability, modes, editions, platforms, source clauses, rationale, decisions,
capabilities/use cases, invariants, threats/risks, contracts, implementation
owners, tests, evidence, acceptance and review triggers. Unknown properties fail.

## Atomicity

One record has one normative subject/action and independently reportable result.
Shared applicability/rationale is referenced, not copied. Compound legal clauses
split into atomic requirements while retaining a group link to the source.

## Graph constraints

- Regulatory requirements require `SRC-*` clause and edition paths.
- Security/privacy requirements require threat/control/test paths.
- Performance requirements require workload/metric/environment/evidence paths.
- Functional requirements require domain/contract and positive/negative tests.
- External-owner requirements require boundary/conformance evidence.
- Every implementation and test points to a requirement; tests do not create
  undocumented product behavior.

## Generated views

The toolchain emits source→requirement, capability→requirement, requirement→
invariant/contract/code/test/evidence, threat→control→test, historical finding→
prevention and release-coverage matrices. Each carries generator/input digests
and reproduces cleanly.

## Status and invalidation

Content follows documentation lifecycle. Satisfaction uses `not-implemented`,
`in-progress`, `implemented-unverified`, `verified`, `blocked`, `superseded`,
`not-applicable-demonstrated` or `accepted-risk`. Source/contract/toolchain
change invalidates current evidence without rewriting historical results.

## Negative tests

Fixtures cover duplicate/recycled/unknown IDs, orphan sources/tests, invalid
cycles, empty applicability, false verified state, missing mode, stale/manual
generated output and evidence for another SHA.
