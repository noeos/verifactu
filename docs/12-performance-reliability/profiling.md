---
id: PERF-DOC-0011
title: Profiling and optimization protocol
status: draft
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PERF-DOC-0003, PERF-DOC-0010]
historical-inputs: [REV-051, REV-057, REV-058, REV-067, REV-071, REV-072]
---

# Profiling and optimization protocol

Optimization begins with a reproducible budget miss or capacity need. Preserve a
correctness oracle, capture baseline, form a falsifiable bottleneck hypothesis,
profile the representative workload, change one meaningful factor, rerun and
retain both performance and semantic/security evidence.

## Profiles

CPU sampling/flamegraphs, allocation/heap snapshots, GC/event-loop delay, native
memory, async I/O, descriptors, storage/key/network timings and queue contention
are selected by hypothesis. Profiles record tool/version/configuration, workload,
environment and sampling overhead. Instrumented and non-instrumented runs are not
compared as if identical.

## Review constraints

No optimization may weaken input validation, cryptographic profile, atomicity,
durability, redaction, isolation, exact decimal/time semantics or evidence.
Caching requires explicit scope/key/edition, bound, invalidation, concurrency and
privacy analysis. Pooling/reuse must clear context. Parallelism must retain
deterministic ordering and chain linearizability. Native/WASM changes add memory,
supply-chain, portability and failure-boundary review.

## Evidence and cleanup

Commit the small shareable summary and manifest; store potentially sensitive or
large raw profiles in the controlled evidence store by digest. Synthetic inputs
remain mandatory. Remove diagnostic probes that expose data or materially alter
behavior; production-safe metrics are separately designed. Document negative or
neutral investigations to avoid repeating them and update the model when the
actual bottleneck contradicts assumptions.
