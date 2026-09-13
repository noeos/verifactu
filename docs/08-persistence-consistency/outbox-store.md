---
id: PERSIST-DOC-0005
title: Outbox store
status: draft
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0022, ADR-0023]
sources: [SRC-0049]
historical-inputs: [REV-028, REV-031, REV-032, REV-034]
---

# Outbox store

An outbox item references committed record/artifact IDs, operation/environment,
ordering scope, eligibility time, state/version, monotonic attempt count,
lease/fencing data, last observation and reconciliation requirement. It never
contains regenerated fiscal payload or an arbitrary endpoint.

Discovery returns bounded eligible work in deterministic priority/order and
may use adapter-specific locking only if starvation/fairness semantics are
proved. Claim atomically moves state and increments fencing generation. Beginning
an attempt durably records ID, request digest, endpoint identity and start time
before I/O.

Completion requires current fencing token and expected state. Duplicate same
observation is idempotent; conflicting observation is corruption. There is no
silent dead-letter deletion: permanent failure remains inspectable with operator
action. Tests cover concurrent claim, expired worker, starvation, restart,
attempt exhaustion, wait eligibility and reconciliation exclusion.
