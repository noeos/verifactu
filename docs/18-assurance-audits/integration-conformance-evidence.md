---
id: ASSURANCE-DOC-0015
title: Integration conformance evidence
status: approved
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0038, ADR-0052]
historical-inputs: [REV-017, REV-028, REV-061, REV-062, REV-083, REV-084]
---

# Integration conformance evidence

Retain exact installed VeriFactu/Engine/profile and adapter/provider versions/
digests plus the versioned future-Facturacion host contract and synthetic-fixture
digest. Record claimed level, selected/executed scenarios/faults, durable post-
state/cleanup and limitations. Workspace/mocks/empty capabilities cannot pass.

Evidence covers host atomicity, storage/restore, XML/XSD, signer/certificate,
transport and migration. Each matrix cell is passed, demonstrated N/A,
unsupported or blocked; aggregate success cannot hide one cell.

Synthetic host evidence proves the published boundary, not integration with the
unbuilt Facturacion product. Real Facturacion evidence will be produced by that
future repository and is not a VeriFactu `1.0.0` release gate.
