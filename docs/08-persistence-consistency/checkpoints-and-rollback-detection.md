---
id: PERSIST-DOC-0011
title: Checkpoints and rollback detection
status: approved
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
historical-inputs: [REV-030]
---

# Checkpoints and rollback detection

A checkpoint identifies store/installation/context, schema and edition set,
covered sequence heads/journal positions, snapshot/export manifest digest,
creation instant source, predecessor checkpoint and signer/anchor evidence. A
timestamp or caller assertion without identity/digest/external trust is not
freshness evidence.

At startup and before sensitive export/recovery, compare current monotonic
positions and head digests to the latest independently retained checkpoint.
Regression, missing checkpoint chain, store replacement, truncated journal,
fork or future/invalid time blocks mutation and raises an incident.

The persistence contract exposes `RecoveryCheckpointStore` through
`PersistencePorts`. `readLatest` is deadline-bound and accepts an abort signal;
an unavailable, timed-out or canceled read blocks worker discovery and network
activity. A successful read includes verification of the complete checkpoint
chain and configured anchor. `compareAndAppend` stages an immutable checkpoint
in the host UoW and atomically compares its predecessor digest, so checkpoint
advancement cannot split from the record, journal, head and outbox commit.
Replays are accepted only when all checkpoint fields match.

Anchoring options are signed checkpoints held outside the primary mutable store
or a host-controlled independent durable service. Exact trust and availability
trade-offs are deployment configuration. Tests restore old snapshots, clone a
store under another identity, delete/reorder tails, swap contexts and lose the
anchor; none may be reported fresh.
