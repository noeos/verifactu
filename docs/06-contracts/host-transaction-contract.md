---
id: CONTRACT-DOC-0008
title: Host transaction contract
status: draft
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0022]
historical-inputs: [REV-028, REV-029, REV-035]
---

# Host transaction contract

`HostUnitOfWork` is created for one fiscal context and command identity. Within
it, a host stages invoice publication and VeriFactu stages record,
artifacts, evidence, event journal, head CAS and outbox. `commit(expectedHead)`
is the single visibility point; all writes become durable or none do.

The maintained synthetic host proves this contract now. The future Facturacion
application is expected to implement it later; its absence does not block the
VeriFactu release.

The coordinator owns begin/commit/rollback. Nested/implicit commits and network
or observer effects inside the transaction are forbidden. Scheduling a worker
occurs after commit and is optional because durable outbox discovery is the
source of truth.

Adapters must specify isolation, durability acknowledgment, transaction timeout,
maximum staged bytes, conflict diagnostics and behavior on unknown commit
outcome. An unknown local commit is reconciled by command identity and stored
digests; it is never blindly repeated. Rollback is idempotent and cannot delete
previous committed facts.

Contract evidence injects failures before/after every participant and commit
acknowledgment, restarts the adapter and proves all-or-none state plus exact CAS.
