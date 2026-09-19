---
id: SEC-DOC-0010
title: Tenant and fiscal-context isolation
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [DOM-DOC-0003, SEC-DOC-0005]
historical-inputs: [REV-015, REV-016, REV-019]
---

# Tenant and fiscal-context isolation

Authorization is evaluated against explicit principal, tenant, taxpayer,
installation, operation, resource and environment. Possession of an opaque ID
does not grant access. Missing or ambiguous context is denied. Authorization and
context are rechecked at commit and external side-effect boundaries.

Storage keys, uniqueness constraints, chain heads, idempotency records, queue
partitions, artifact locators, key handles and caches are context-scoped by
construction. Cache keys include edition and policy version. Process globals may
hold immutable public catalogue data only; no mutable fiscal/request state.

## Shared infrastructure

Adapters document their isolation strength and transactional guarantees. Batch
and bulk APIs prove homogeneity before work. Worker pools carry immutable context
with each task and clear references afterward. Metrics use bounded surrogate
dimensions, never taxpayer/record identifiers. Support/export operations require
separate scoped authorization and audit.

## Verification

A generated two-context matrix repeats create/read/update/append/submit/export/
recover operations with colliding local IDs and interleaved timing. Property and
fault tests cover cache poisoning, stale authorization, lock collision, batch
mixing, retry/recovery and key-handle substitution. Denials reveal no target
existence beyond documented safe semantics. Isolation failure is critical,
quarantines affected scopes and blocks release.
