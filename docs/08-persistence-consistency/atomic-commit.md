---
id: PERSIST-DOC-0006
title: Atomic commit protocol
status: draft
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0022]
historical-inputs: [REV-028, REV-029, REV-035]
---

# Atomic commit protocol

Preconditions are validated command binding, verified exact artifacts/claims,
current context/edition/mode, and expected head. Inside one UoW the coordinator:
reserves idempotency identity; checks absence/conflict; appends artifacts,
record/event and claims; appends journal facts; CAS-updates head; creates outbox;
and lets the host stage invoice publication before the single commit.

Ordering is logical; the physical adapter may optimize while proving the same
all-or-none constraints. No irreversible external effect occurs inside.
Commit/rollback are mutually exclusive, idempotent terminal operations. Failure
before acknowledged commit yields no visibility; an unknown acknowledgment
yields `local-commit-indeterminate` and must be resolved by identity/digest.

The crash matrix cuts power/process/backend connection at each boundary,
including commit sent/ack lost and after-commit wakeup. Restart verification
proves no orphan artifact, record without invoice, head without record, missing
outbox or double append.
