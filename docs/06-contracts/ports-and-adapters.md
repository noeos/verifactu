---
id: CONTRACT-DOC-0007
title: Ports and adapters
status: approved
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0015, ADR-0017]
historical-inputs: [REV-013, REV-043, REV-044, REV-061]
---

# Ports and adapters

Every port defines scope, contract version, capability level, trust assumptions,
immutable request/observation types, limits, cancellation, ownership, idempotency,
thread/concurrency safety, diagnostics and evidence. Adapters translate only;
they cannot invent domain defaults, retry policy or success.

Port families are time/identity, UoW and stores, XML/XSD, digest, XAdES/signing,
certificate validation/authorization, Verification Engine and AEAT transport.
Network transport performs one observation. Signing returns exact bytes and a
report but does not make them trusted. Store ports expose atomic/CAS/fencing
semantics, not generic CRUD.

Each adapter declares supported level and environmental assumptions. Capability
negotiation is fail-closed and immutable for an operation. Conformance tests run
against the real adapter with fault controls and inspect post-restart state;
mocks support unit tests but cannot qualify an adapter.
