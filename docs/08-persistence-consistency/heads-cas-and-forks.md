---
id: PERSIST-DOC-0007
title: Sequence heads CAS and forks
status: approved
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0023]
historical-inputs: [REV-007, REV-018, REV-029]
---

# Sequence heads CAS and forks

A head key is the complete edition-defined chain scope. Its value contains
generation, last record identity, official fingerprint, generation instant and
commit reference. Genesis is explicit generation zero with no fabricated
record/hash.

Preparation reads a consistent head snapshot and includes it in the command
binding. Commit uses `compareAndAppend(expectedHead, newRecord, newHead)` in the
same transaction as all artifacts. Only one writer can advance a generation;
losers receive conflict and must rebuild from new facts, never patch the old
fingerprint.

Verification detects multiple genesis, duplicate generation, wrong predecessor,
gap, fork, head pointing to absent record, record beyond head, cross-context
link and chronology violation. Repair cannot choose/delete a branch silently;
it produces an incident, preserves both observations and follows a legally
reviewed recovery action.
