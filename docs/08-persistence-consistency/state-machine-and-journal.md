---
id: PERSIST-DOC-0010
title: Durable state machine and journal
status: draft
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0023]
historical-inputs: [REV-024, REV-031, REV-034, REV-035, REV-041]
---

# Durable state machine and journal

Submission states are `pending`, `leased`, `attempt-started`, `indeterminate`,
`retry-wait`, `reconciliation-required`, `accepted`,
`accepted-with-errors`, `rejected` and `permanently-failed`. Terminal remote
classification is immutable; correction creates new domain/submission facts.

Transitions specify current state/version, command, preconditions, new state,
journal event, attempt/wait data and fencing token. Attempt count increases
atomically at `attempt-started`. AEAT wait-until is persisted from the response
using the declared clock policy. Result persistence failure leaves the attempt
indeterminate; a function cannot report durable completion before reread proof.

The machine rejects incompatible shortcuts: expired `attempt-started` cannot
become pending; accepted cannot retry; missing response line cannot accept;
observer/wakeup failure cannot change durable state. Generated tables/diagrams
come from the transition registry and property tests explore all invalid edges.
