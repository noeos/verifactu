---
id: PERF-DOC-0008
title: Concurrency and capacity planning
status: draft
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [DOM-DOC-0008, PERF-DOC-0001, PERF-DOC-0007]
historical-inputs: [REV-019, REV-024, REV-031, REV-032]
---

# Concurrency and capacity planning

Concurrency is partitioned by resource: CPU validation/serialization, chain
critical section, storage I/O, key service, network attempts and export work.
Each pool has bounded permits/queue bytes, fairness, timeout, cancellation and
instrumentation. A single global concurrency number cannot safely govern all.

Operations for different chain scopes may progress concurrently. Operations for
one chain use storage-level linearizable compare-and-append; process locks are an
optimization only. Long network calls never hold a chain lock. Key/storage/
network dependencies have bulkheads so one degraded adapter cannot exhaust all
work. Per-context admission plus global ceilings controls noisy neighbors.

## Capacity model

For each workload, capacity planning records arrival rate/burst, service-demand
distribution per resource, concurrency, utilization knee, queue and dependency
limits, target headroom, recovery/backlog requirement and host profile. Queueing
calculations are validated by open-loop load rather than treated as proof.
Scaling remains bounded by serialized chain work and durable adapter guarantees.

## Saturation behavior

Saturation is detected through utilization, event-loop delay, permits, queue
count/bytes/age, latency and errors. Admission closes before memory exhaustion.
Retry-after guidance reflects actual capacity only for safe operations and is
jittered by callers. Brownout may defer optional telemetry or nonessential
presentation, never validation, integrity, durability, authorization or evidence.

Race tests cover same/different chain, idempotency, mode transition, adapter
timeout, cancellation, worker death and split-process coordination. Capacity
claims require correctness and linearizability checks under full offered load.
