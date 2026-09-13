---
id: INTEGRATION-DOC-0008
title: Host atomicity contract
status: draft
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0022, ADR-0023, ADR-0038]
historical-inputs: [REV-028, REV-029, REV-030, REV-031, REV-060]
---

# Host atomicity contract

The host adapter exposes one transaction/UoW containing commercial invoice state,
immutable VeriFactu record, exact artifacts/evidence, chain head/CAS fencing and
outbox. `prepare` has no durable/public effect; commit is the sole publication
point and rollback leaves none. Adapter-owned hidden nested commits are forbidden.

The conformance matrix crashes before/after each write and commit acknowledgement,
including connection loss after possible commit. Restart with an independent
reader proves all-or-nothing, one head advance, idempotent command, no premature
event and recoverable indeterminate result.

Isolation/locking constraints are capability-declared and tested with competing
transactions. An adapter unable to join the host UoW cannot claim atomic-host
level; an outbox-only topology must be separately supported and must not advertise
the stronger guarantee.
