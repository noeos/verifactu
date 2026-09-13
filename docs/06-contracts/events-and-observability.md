---
id: CONTRACT-DOC-0010
title: Events and observability contracts
status: draft
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ARCH-DOC-0014, DOM-DOC-0008]
historical-inputs: [REV-022, REV-026]
---

# Events and observability contracts

Regulated/domain events are immutable durable records created atomically with
their state transition. Operational notifications are best-effort projections
published after the durable fact. The two use different schemas and delivery
claims.

Every event defines version, event ID, aggregate/context IDs, causation,
correlation, sequence, explicit instant source, edition, safe payload and
classification. Creation, cancellation, invalid input, commit, CAS conflict,
sign/verify, outbox claim, attempt, wait, remote result, reconciliation,
checkpoint, export and restore have complete coverage where observable.

Observers are bounded, non-reentrant by contract and cannot mutate the client.
Synchronous observer latency is budgeted or delivery is queued by an explicit
host adapter. Throw/hang/backpressure/drop behavior produces operational
diagnostics without changing domain truth. Metrics use bounded-cardinality
dimensions; telemetry remains opt-in.
