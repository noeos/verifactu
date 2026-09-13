---
id: PERF-DOC-0003
title: Benchmark methodology
status: draft
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PERF-DOC-0001, PERF-DOC-0002]
historical-inputs: [REV-041, REV-042, REV-051, REV-056, REV-060]
---

# Benchmark methodology

## Experimental protocol

Pin source SHA, clean-tree state, lockfile/toolchain, build flags, workload/data
digest, environment image/configuration, CPU allocation/governor, memory, OS,
runtime, adapters and harness. Run correctness/conformance first. Warm up until a
declared condition, measure multiple independent processes/runs, randomize A/B
order, isolate unrelated load and retain unsuccessful runs with cause.

Measure wall and monotonic time correctly. Report sample count, median, p90,
p95, p99 and maximum where sample volume supports them; throughput, errors,
timeouts, CPU, event-loop delay, RSS, heap/external memory, GC, descriptors,
queue depth/bytes and dependency timings accompany latency. Histograms preserve
precision across the declared range.

## Coordinated omission and load

Latency under load uses scheduled/open-loop arrivals and records missed starts so
saturation is not hidden by a client that waits for each response. Service time,
queue time and end-to-end response time are separate. Throughput is reported only
with offered load, achieved completions and failure rate.

## Comparisons

Candidate and baseline run on the same environment/session when possible.
Compare distributions across repeated runs using confidence intervals or a
predeclared robust method, plus absolute budgets. Microbenchmark changes require
effect size beyond measured noise and confirmation in a representative workflow.
Outliers are removed only by a predeclared mechanical rule and remain in raw data.

## Anti-gaming controls

Inputs and outputs are digested; dead-code elimination/no-op adapters are detected;
setup/teardown and persistence boundaries are stated; errors count as failures,
not fast successes; concurrency reaches actual committed outcomes. Benchmark code
is reviewed/tested like production verification code.
