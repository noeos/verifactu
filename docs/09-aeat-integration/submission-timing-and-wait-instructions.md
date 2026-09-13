---
id: AEAT-DOC-0011
title: Submission timing and wait instructions
status: draft
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0014, SRC-0022]
historical-inputs: [REV-033, REV-041]
---

# Submission timing and wait instructions

The edition defines initial wait behavior, response field semantics, permitted
range and any batch-accumulation exception. A valid AEAT response produces a
durable wait instruction containing received value, response artifact, observed
wall instant, computed eligible instant and clock-policy identity. Invalid or
missing values follow the exact edition rule, never an arbitrary zero.

Scheduling uses an injected monotonic clock during a process and reconciles it
with persisted wall instants across restart. Backward/forward clock jumps,
suspend and skew cannot cause premature send; uncertainty delays and surfaces a
diagnostic. Wait applies at its official context/operation scope.

Batch fullness does not bypass wait unless the source explicitly permits it.
Retry backoff and AEAT wait combine using the later eligible instant. Tests cover
initial state, boundary values, persistence failure, restart, clock jumps,
multiple contexts, concurrent workers and a newer response superseding an older
instruction by journal order—not arrival race.
