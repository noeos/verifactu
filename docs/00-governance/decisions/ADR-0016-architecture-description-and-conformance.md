---
id: ADR-0016
title: Architecture description and executable conformance
status: proposed
authority: decision
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0039, SRC-0040]
historical-inputs: [REV-017, REV-072]
---

# ADR-0016: Architecture description and executable conformance

## Decision

The architecture description identifies stakeholders, concerns, viewpoints,
model kinds and correspondence rules following ISO/IEC/IEEE 42010 concepts.
C4 context, container, component, dynamic and deployment views communicate the
design, but canonical machine-readable ownership and dependency records govern
when a diagram and code disagree.

Every material rule must have an automated positive and negative conformance
case: imports, cycles, public exports, forbidden ambient APIs, package budgets,
effect boundaries and cross-repository access. Generated diagrams and indexes
carry provenance and freshness checks.

## Consequences

Architecture is reviewable from stakeholder concerns and enforceable in code.
The project accepts the maintenance cost of canonical model data and rejects
diagram-only architecture because it cannot detect drift.
