---
id: AEAT-DOC-0012
title: AEAT retry policy
status: approved
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0023, ADR-0024]
sources: [SRC-0021, SRC-0022, SRC-0048]
historical-inputs: [REV-031, REV-032, REV-034, REV-042]
---

# AEAT retry policy

The policy table keys operation, edition, durable state, fault/official code,
request-delivery knowledge, attempt count, AEAT wait and deadline. It returns
retry-at, reconcile-first, terminal, operator-required or blocked; the transport
cannot act on it internally.

Retries are allowed only when official semantics permit and the prior request is
proved not applied or reconciliation authorizes replay. Indeterminate delivery
always routes to reconciliation. Each new attempt is durably incremented,
reuses the committed request artifact only when valid, and records separately.

Backoff base/cap/max attempts come from edition/operational policy; jitter uses
injected recorded randomness so tests replay. AEAT wait and backoff use the later
instant. Exhaustion is inspectable permanent/operator state, not deletion.
Property tests cover every fault/state pair, off-by-one attempts, restart,
concurrent schedulers and prohibition of retry after acceptance/rejection.
