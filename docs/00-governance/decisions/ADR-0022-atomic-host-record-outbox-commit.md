---
id: ADR-0022
title: Atomic host record and outbox commit
status: accepted
authority: decision
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-13
sources: [SRC-0049]
historical-inputs: [REV-028, REV-029, REV-035]
---

# ADR-0022: Atomic host record and outbox commit

## Decision

Invoice publication state, immutable fiscal record, exact official artifacts,
verification/signature evidence, confirmed sequence head and outbox intent form
one atomic outcome owned by an explicit host unit of work. The preferred
adapter level uses one co-located durable transaction.

An alternative journal/coordination protocol is admissible only through a
successor decision proving equivalent crash, isolation, ordering and recovery
invariants. Best-effort after-save callbacks and hidden nested transactions are
not conforming.

## Consequences

The future Facturacion product will retain commercial invoice ownership while
participating in the public transaction contract. Until it exists, the maintained
synthetic host proves all-or-none visibility and safe restart through fault
injection at every write/commit boundary.
