---
id: QA-INDEX
title: Quality and testing documentation index
status: approved
authority: informative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [REQ-INDEX, DOM-INDEX, SEC-INDEX, PERF-INDEX]
historical-inputs: [REV-056, REV-057, REV-058, REV-059, REV-060, REV-062, REV-063, REV-064, REV-079]
---

# Quality and testing

Status: all 19 substantive specifications are approved as design authority.
Executable source, contract, oracle and runtime assurance evidence remains
pending until the corresponding implementation exists.

Authority for verification strategy and the evidence required to trust every
guarantee.

This area will define a claim-driven assurance system for the complete product,
not an MVP test subset. A green result must identify the exact claim, subject,
oracle, executed work, environment and evidence. Missing reports, empty test
discovery, unexpected skips and tool failures can never be interpreted as
success.

Substantive documents (19):

- `verification-strategy.md`
- `claim-evidence-and-oracle-model.md`
- `test-levels-and-ownership.md`
- `fixtures-and-synthetic-data.md`
- `official-vectors-and-independent-oracles.md`
- `unit-contract-integration-e2e.md`
- `property-testing.md`
- `fuzzing.md`
- `mutation-testing.md`
- `coverage-policy.md`
- `fault-injection.md`
- `concurrency-and-recovery-testing.md`
- `security-testing.md`
- `performance-and-resource-testing.md`
- `compatibility-testing.md`
- `test-selection-and-impact.md`
- `flakiness-and-infrastructure-failures.md`
- `test-evidence-and-traceability.md`
- `quality-exit-criteria.md`

Area completion requires positive and falsifying evidence for every material
claim, independent challenge at critical boundaries, honest coverage and real
code mutation, semantic property/fuzz campaigns, durable crash/recovery tests,
lawful fixtures and exact-commit requirement-to-report traceability. The
approved elaboration contract and thresholds are in [`PLAN-L3`](../lot-3-assurance-delivery-plan.md).
