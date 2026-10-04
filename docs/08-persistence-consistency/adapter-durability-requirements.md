---
id: PERSIST-DOC-0016
title: Adapter durability requirements
status: approved
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0022, ADR-0023]
historical-inputs: [REV-028, REV-029, REV-053, REV-061]
---

# Adapter durability requirements

Level `atomic-host` is required for complete host integration: one durable UoW
spans host publication, VeriFactu immutable objects, head CAS and outbox. Level
`standalone-test` may support isolated tooling but cannot authorize host invoice
publication. Any alternative coordination level requires its own accepted ADR
and proof equivalent to `atomic-host`.

Qualification proves transaction isolation/durability, unique and referential
constraints, compare-and-set, monotonic fencing, consistent bounded enumeration,
exact byte streaming, idempotency conflicts, checkpoint-chain append/readback,
crash restart, backup/restore, migration and resource/cancellation semantics.
Checkpoint append must share the host UoW commit and compare the prior digest
atomically; readback must verify the full chain and configured anchor.
Filesystem adapters additionally prove atomic create/no-overwrite without
check-then-write races and directory/data durability on supported platforms.

The report declares backend/version/configuration, replication acknowledgment,
known anomalies and unsupported topologies. In-memory adapters are never
durable. Skipped fault cases, reliance on one process lock, ambiguous commit or
missing restore proof prevents production qualification.
