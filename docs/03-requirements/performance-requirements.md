---
id: REQ-DOC-0006
title: Performance requirements
status: approved
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0036, SRC-0037, SRC-0038]
decisions: [ADR-0013]
historical-inputs: [REV-009, REV-051, REV-058, REV-060, REV-072]
---

# Performance requirements

## Measurement and correctness

| ID | Requirement |
| --- | --- |
| `PERF-0001` | Every benchmark MUST identify exact subject, workload, successful/error inclusion, environment, toolchain, configuration, samples and uncertainty. |
| `PERF-0002` | Benchmark outputs and invariants MUST be verified before and after timing; disabling required work invalidates the result. |
| `PERF-0003` | Latency MUST be reported as distribution with p50/p95/p99 and maximum; p99.9 is required when sample size supports it. |
| `PERF-0004` | Scheduled-load benchmarks MUST prevent or correct coordinated omission and report offered versus achieved load. |
| `PERF-0005` | Success and failure latency MUST be reported separately with error counts/types. |

## Resource safety

| ID | Requirement |
| --- | --- |
| `PERF-0010` | Processing complexity MUST be linear in accepted input bytes/items unless an approved bounded algorithm states otherwise. |
| `PERF-0011` | Every parser, serializer, batch, queue, stream, cache and diagnostic collector MUST have an enforced byte/item bound before unbounded allocation. |
| `PERF-0012` | Streaming backlog MUST remain bounded by configured high-water marks and MUST propagate backpressure to the producer. |
| `PERF-0013` | A slow/failed consumer MUST NOT cause memory growth proportional to total stream length. |
| `PERF-0014` | Cancellation MUST stop admission promptly, propagate to providers and release owned resources without reporting false completion. |
| `PERF-0015` | File descriptors, sockets, timers, temporary files, workers and leases MUST return to baseline after success, error and cancellation. |
| `PERF-0016` | Taxpayer/workload quotas MUST prevent one context from exhausting global capacity or starving other ready work. |

## Capacity and regression

| ID | Requirement |
| --- | --- |
| `PERF-0020` | Concurrency MUST be bounded per sequence/provider/store/endpoint and preserve ordering/atomicity under contention. |
| `PERF-0021` | Overload MUST reject/pause before unsafe mutation, provide retry/backpressure diagnostics and preserve admitted work. |
| `PERF-0022` | Maximum official batch construction/parsing MUST fit the adopted time/memory budget with complete validation enabled. |
| `PERF-0023` | A release MUST meet every calibrated absolute budget and MUST block on statistically/materially significant regression. |
| `PERF-0024` | Performance baselines MUST be content-addressed, reviewable and changed only with explicit evidence/impact. |
| `PERF-0025` | Every named budget MUST have a negative fixture that proves its CI gate fails when exceeded. |

## Reliability performance

| ID | Requirement |
| --- | --- |
| `PERF-0030` | Stress MUST exercise complete streaming, durable restart, network/provider failure and recovery—not synthetic CPU loops alone. |
| `PERF-0031` | Soak tests MUST detect positive memory/resource/backlog slope and state divergence over an evidence-defined duration. |
| `PERF-0032` | Recovery time and backlog drain MUST be measured under named failure/load without reordering or blind duplicate sends. |

## Threshold adoption rule

Security limits and official maxima are immediate hard ceilings. Latency and
throughput thresholds become normative only after the full fixtures and official
runner are implemented and measured. Until then no release may advertise a
number; old `P-01`–`P-12` remain explicitly unverified hypotheses.
