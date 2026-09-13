---
id: INTEGRATION-DOC-0011
title: XML and XSD provider conformance
status: draft
authority: normative
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0020, SRC-0035]
decisions: [ADR-0019, ADR-0038]
historical-inputs: [REV-007, REV-008, REV-009, REV-042, REV-062]
---

# XML and XSD provider conformance

The provider accepts bounded bytes plus exact edition/schema entrypoint and
returns structured diagnostics and verified normalized facts without silently
repairing input. All imports/includes resolve offline only from the digest-pinned
edition graph; network, DTD/external entities and arbitrary filesystem resolution
are disabled.

Conformance compares official positive/negative vectors and an independent
standards implementation across namespaces, occurrence/order, encoding, Unicode,
facets and imported schemas. Hostile XXE/entity expansion, schema recursion,
oversize/depth/count, path escape, timeout/cancel and provider crash must remain
bounded and isolated.

Provider version/config/binary digest and exact input/output are evidence. Parser
success is not business-validation success. Unsupported feature/backend or
oracle disagreement blocks the claimed edition rather than falling back.
