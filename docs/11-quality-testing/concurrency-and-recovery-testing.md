---
id: QA-DOC-0012
title: Concurrency and recovery testing
status: approved
authority: normative
owner: reliability-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0023, ADR-0028]
historical-inputs: [REV-060, REV-061]
---

# Concurrency and recovery testing

The schedule matrix covers same/different taxpayer and series, duplicate command,
competing head update, lease expiry/steal, stale fencing token, outbox claim,
response/cancellation race, reconciliation and shutdown. Deterministic barriers
force every material interleaving; randomized schedules supplement them and
retain seed/trace.

For every atomic boundary, a supervisor crashes the process before write,
between writes, before/after commit acknowledgement and before/after external
observation. Restart uses only durable state. Oracles verify no split invoice/
record/head/evidence/outbox state, monotonic fencing, idempotent resumption,
bounded duplicates and explicit indeterminate outcomes.

Minimum repeated stress does not replace schedule coverage. Deadlock/livelock,
unbounded wait, orphan resource or nondeterministic final state fails. Evidence
includes operation history suitable for model/linearizability checking where
the contract requires it.
