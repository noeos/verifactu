---
id: ADR-0023
title: CAS heads fencing and reconciliation before resend
status: proposed
authority: decision
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0048, SRC-0049, SRC-0051]
historical-inputs: [REV-018, REV-029, REV-036, REV-041, REV-042]
---

# ADR-0023: CAS heads fencing and reconciliation before resend

## Decision

Sequence append uses a versioned compare-and-set head including scope,
predecessor identity/fingerprint and generation. Work leases use an
authoritative clock and monotonically increasing fencing tokens; an expired or
superseded worker cannot commit. Attempt identity and count advance durably
before network I/O.

Execution is at least once; networking is never called exactly once. A lost or
ambiguous response produces `reconciliation-required`. Resend is forbidden
until official consultation/evidence resolves the attempt or an edition rule
explicitly authorizes the next action.

## Consequences

CAS conflicts, pauses, clock changes, partitions, duplicate completions and
restart windows become mandatory deterministic tests. Queues that cannot expose
the required tokens and transitions fail adapter conformance.
