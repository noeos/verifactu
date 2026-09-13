---
id: PERF-DOC-0006
title: Memory and resource limits
status: draft
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [SEC-DOC-0009, PERF-DOC-0001]
historical-inputs: [REV-027, REV-057, REV-058, REV-059, REV-067]
---

# Memory and resource limits

## Accounting

Measure RSS, heap used/committed, external/array-buffer memory, allocation rate,
GC pause/time, native crypto/parser allocations, stack risk, open files/sockets,
temporary disk, worker count, queue items/bytes and durable backlog. Heap alone
is not a memory budget. Baseline idle/runtime overhead is reported separately.

## Scaling invariants

- Streaming operations use memory bounded by configured high-water marks and the
  largest necessary semantic unit, not total chain/export/response size.
- Batch/concurrency memory is bounded by admission tokens based on bytes and work,
  not request count alone.
- Diagnostics are capped while preserving a truncation marker and total count.
- Caches declare key scope, byte/count maximum, eviction, TTL and invalidation;
  fiscal correctness never depends on cache survival.
- Temporary artifacts have quota, restrictive permissions, lifecycle and crash
  cleanup without deleting committed evidence.

## Leak and growth criteria

Soak evaluation observes post-warmup retained heap/RSS, descriptors, listeners,
cache and queue/backlog. A fitted trend, confidence and post-GC plateaus are
reported; one final snapshot is insufficient. Intentional caches must reach a
documented bound. Abort, timeout, parser error, retry and recovery paths receive
the same leak analysis as success.

Hard limits come from `SEC-DOC-0009` and are enforced now. Product/host memory
budgets await the official environment and workloads. Exceeding a bound causes
pre-commit rejection or controlled worker termination/recovery, never swapping
into unbounded latency or emitting a partial accepted record.
