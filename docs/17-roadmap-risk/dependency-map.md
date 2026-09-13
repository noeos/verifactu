---
id: ROADMAP-DOC-0002
title: Delivery dependency map
status: draft
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0026, ADR-0051]
---

# Delivery dependency map

The canonical acyclic graph links sources/legal decisions, requirements, ADRs,
components/contracts, toolchain/dependencies, implementations, tests/oracles,
packages/integrations, audits and release states. Nodes declare owner, readiness,
outputs, evidence and invalidation triggers.

External nodes include AEAT corpus/portal, legal review, Verification Engine/npm,
GitHub, provider/certificate and Facturacion host. Unknown owner/cycle/orphan or
missing required edge blocks scheduling. Generated critical path and status are
views of this graph, never manually edited plans.
