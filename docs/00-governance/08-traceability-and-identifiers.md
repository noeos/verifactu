---
id: GOV-008
title: Traceability and identifiers
status: draft
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
historical-inputs: [REV-001, REV-084]
---

# Traceability and identifiers

## Principle

Every material claim must be traceable from authority to requirement, design,
implementation, verification and evidence without copying competing truths.
Links express relationships; they do not promote a lower-authority artifact.

## Identifier registry

Identifiers are uppercase, immutable, never recycled and unique repository-wide.
The initial families are:

| Pattern | Canonical object |
| --- | --- |
| `GOV-NNN` | Governance rule. |
| `SRC-NNNN` | Versioned external source. |
| `ADR-NNNN` | Architecture or policy decision. |
| `ACT-NNNN` / `CAP-NNNN` / `UC-NNNN` | Actor, product capability and use case. |
| `PROD-NNNN` | Product requirement. |
| `REG-NNNN` | Regulatory requirement. |
| `FUN-NNNN` | Functional requirement. |
| `NFR-NNNN` | Non-functional requirement. |
| `SEC/THR/CTL-NNNN` | Security requirement, threat or control. |
| `PRIV-NNNN` | Privacy requirement. |
| `PERF-NNNN` | Performance/resource budget. |
| `OPS-NNNN` / `ACC-NNNN` | Operational requirement and acceptance gate. |
| `TEST-NNNN` | Verification obligation. |
| `CI-NNNN` | Repository/CI control. |
| `RISK-NNNN` | Risk. |
| `FND-NNNN` | Current finding. |
| `EVD-NNNN` | Evidence definition or result. |
| `REV-NNN` | Immutable previous-codebase finding. |
| `EXC-NNNN` | Exception or waiver. |
| `DOM-NNNN` / `INV-NNNN` / `DIAG-NNNN` | Domain concept, invariant and diagnostic. |
| `SLI-NNNN` / `SLO-NNNN` | Reliability indicator and objective. |
| `ARCH-NNNN` / `FLOW-NNNN` | Architecture invariant or dynamic flow. |
| `API-NNNN` / `PORT-NNNN` | Public operation/contract or host/provider port. |
| `FMT-NNNN` / `ART-NNNN` | Format rule or byte-artifact definition. |
| `STORE-NNNN` / `STATE-NNNN` | Persistence invariant or durable state/transition. |
| `AEAT-NNNN` | Edition-bound AEAT protocol rule. |
| `PROFILE-NNNN` | Versioned external evidence or conformance profile. |
| `<AREA>-DOC-NNNN` / `<AREA>-INDEX` / `PLAN-LN` | Normative area document, area index or lot plan. |

Adding or changing a family requires governance impact analysis. Renaming a
file never changes its object identifier.

## Required trace path

A release-affecting requirement must link upstream authority and downstream
decision/specification, implementation owner, tests and evidence definition.
Regulatory and security requirements also link their edition or threat/control.
Tests link what they prove, their oracle, environment and failure semantics.
Evidence links exact commit, packaged bytes, toolchain and producing workflow.

Allowed dispositions are explicit: `satisfied`, `superseded`,
`not-applicable-demonstrated`, `accepted-risk` or `blocked`. Absence of a link is
not a disposition.

## Canonical data and generated views

Each fact has one canonical source. Matrices, indexes and dashboards are
generated deterministically from validated metadata and carry a generated-file
notice. CI rejects duplicate IDs, unknown links, forbidden cycles, orphaned
mandatory objects and hand-edited generated output.

## Evidence identity

Evidence is valid only for the exact subject it names: commit SHA, tree,
package digest, platform, dependency lock, tool versions, configuration and
regulatory edition. Evidence from a previous commit or deleted implementation
is context, not proof.
