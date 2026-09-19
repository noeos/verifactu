---
id: CONTRACT-DOC-0002
title: Operation lifecycle and command model
status: approved
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0017, ADR-0022, ADR-0023]
historical-inputs: [REV-018, REV-032, REV-042]
---

# Operation lifecycle and command model

`prepare` is pure over validated facts, captured edition/configuration, explicit
time/IDs and an observed head. It returns an immutable plan plus a binding token
covering all input digests, context, edition, head version and expiry policy.
It grants no right to commit.

`confirm` runs inside the host UoW, rereads the authoritative head and rejects
stale/different context or configuration. Artifact/signature production may be
prepared outside a transaction, but exact returned bytes are revalidated and
bound before `commit`. Commit atomically appends record/artifacts/evidence,
CAS-updates the head and creates outbox work.

Submission uses separate `claim`, `beginAttempt`, `observe` and `classify`
commands. `beginAttempt` durably advances the counter before I/O. Cancellation
after that point produces an observation or indeterminate state. `reconcile`
consumes official evidence and never edits the original attempt.

Tokens are opaque, single-scope and replay-detecting. Same command ID plus same
digest returns the prior result; the same ID with different content is a
conflict. Expired/stale tokens cannot be refreshed implicitly.
