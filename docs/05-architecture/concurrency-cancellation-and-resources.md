---
id: ARCH-DOC-0012
title: Concurrency cancellation and resources
status: draft
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PERF-DOC-0006, PERF-DOC-0007, SEC-DOC-0009]
---

# Concurrency cancellation and resources

Concurrency is scoped by taxpayer/installation/sequence and by bounded global
provider capacity. Serial ordering is mandatory for a sequence head; independent
contexts may run concurrently subject to admission control. Queues are bounded
and reject/slow producers explicitly—never unboundedly buffer.

Every asynchronous public operation accepts an `AbortSignal` or documented
deadline context. Cancellation propagates to child work, closes owned streams,
files, sockets, workers and leases, and waits for cleanup. It cannot roll back a
committed fact or erase an initiated network attempt; those return the truthful
durable/indeterminate state.

Contracts label resources as borrowed, transferred or created. Only the owner
closes; cleanup is idempotent and bounded. Tests cover abort-before-start,
during-read/parse/sign/commit/write/network, abort-versus-completion races,
double close, provider hang, memory pressure and file-descriptor exhaustion.
