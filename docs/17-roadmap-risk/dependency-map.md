---
id: ROADMAP-DOC-0002
title: Delivery dependency map
status: approved
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-10-05
decisions: [ADR-0026, ADR-0051, ADR-0055, ADR-0057, ADR-0058, ADR-0060]
---

# Delivery dependency map

The canonical acyclic graph links sources/legal decisions, requirements, ADRs,
components/contracts, toolchain/dependencies, implementations, tests/oracles,
packages/integrations, audits and release states. Nodes declare owner, readiness,
outputs, evidence and invalidation triggers.

External nodes include AEAT corpus/portal, legal review, Verification Engine/npm,
GitHub, provider/certificate and Facturacion host. Unknown owner/cycle/orphan or
missing required edge blocks the affected work unless an accepted ADR explicitly
authorizes a named, bounded activity. Such an authorization applies only to its
stated scope; it does not resolve failed evidence or downstream merge/closure
gates. Generated critical path and status are views of this graph, never
manually edited plans.

P4's subgraph is a strict chain after a zero-code readiness node:
`P3-B → P4-readiness (frozen population + provider/tool admissions + required
gate) → A → B → C → D → E → F → G`. `D` consumes the offline evidence contract
from ADR-0055 and the local provider decision ADR-0057; `E` consumes the official
edition-bound QR contract in ADR-0056; `F` consumes the separated claims rule in
ADR-0021. P4's implementation waves remain strictly ordered, and P4 phase exit
still requires every applicable closure row to pass with current exact-subject
evidence.

P5 implementation depends on the merged P4 package and its exact public
contracts. Under ADR-0060, unresolved P4 phase-closure rows do not block
implementation work on issue #113's `work/p5-implementation` branch. This is a
scoped exception to the ordinary predecessor-closure scheduling rule: it does
not close P4, turn a failed P4 check into a pass, authorize a P5 merge that lacks
the normal protected required checks, or permit P5 phase closure while
applicable P4 closure rows remain unresolved. If fresh evidence identifies a
direct P4 safety, regulatory or functional impact on P5, the affected P5 work
is blocked pending disposition under ADR-0060.
