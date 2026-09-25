---
id: ROADMAP-DOC-0002
title: Delivery dependency map
status: approved
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-25
decisions: [ADR-0026, ADR-0051, ADR-0055, ADR-0056, ADR-0057, ADR-0058]
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

P4's subgraph is a strict chain after a zero-code readiness node:
`P3-B → P4-readiness (frozen population + provider/tool admissions + required
gate) → A → B → C → D → E → F → G`. `D` consumes the offline evidence contract
from ADR-0055 and the local provider decision ADR-0057; `E` consumes the official
edition-bound QR contract in ADR-0056; `F` consumes the separated claims rule in
ADR-0021. A missing/failed predecessor blocks all downstream work.
