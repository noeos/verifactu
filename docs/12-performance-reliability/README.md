---
id: PERF-INDEX
title: Performance and reliability documentation
status: draft
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PROD-INDEX, REQ-INDEX, DOM-INDEX, SEC-INDEX, PLAN-L1]
historical-inputs: [REV-009, REV-024, REV-026, REV-027, REV-031, REV-032, REV-033, REV-034, REV-035, REV-036, REV-041, REV-042, REV-043, REV-051, REV-056, REV-057, REV-058, REV-059, REV-060, REV-061, REV-062, REV-067, REV-071, REV-072, REV-079]
---

# Performance and reliability

This area defines workloads, bounded resources, measurement, regression and
reliability guarantees. It never trades away fiscal correctness, security,
durability or evidence to improve a benchmark.

## Document set and order

1. `workload-model.md`
2. `performance-budgets.md`
3. `benchmark-methodology.md`
4. `official-benchmark-environment.md`
5. `latency-throughput-and-percentiles.md`
6. `memory-and-resource-limits.md`
7. `streaming-and-backpressure.md`
8. `concurrency-and-capacity.md`
9. `stress-soak-and-recovery.md`
10. `baselines-and-regression-policy.md`
11. `profiling.md`
12. `reliability-indicators-and-objectives.md`
13. `performance-evidence.md`

See
[`PLAN-L1`](../lot-1-foundations-plan.md#area-12-performance-and-reliability).

## Measurement rules

Every number is qualified by workload, payload distribution, concurrency,
environment, build, toolchain and inclusion boundaries. Latency distributions,
errors, throughput, CPU, saturation, RSS, heap, external memory, GC, descriptors
and durable queue growth are assessed together.

Benchmarks validate outputs before and after measurement, include failure paths,
avoid coordinated omission and retain raw observations. A relative improvement
cannot override an absolute safety or resource limit.

## Area exit gate

Every operation has typical, maximum, hostile and recovery workloads; every
buffer and queue has an enforced bound and overload behavior; every adopted
budget has a reproducible baseline and negative test; stress includes restart
and durability; and SLO templates do not invent infrastructure guarantees.
