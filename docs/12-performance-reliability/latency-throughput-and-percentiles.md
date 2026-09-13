---
id: PERF-DOC-0005
title: Latency, throughput and percentile policy
status: draft
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PERF-DOC-0003, PERF-DOC-0004]
historical-inputs: [REV-041, REV-042, REV-051, REV-056]
---

# Latency, throughput and percentile policy

Latency is measured at named boundaries: core service time, queue wait, durable
commit, key operation, network exchange and caller end-to-end. The primary
distribution includes every scheduled request, timeout and failure with explicit
outcome; success-only latency is a secondary diagnostic. Cold start, warm steady
state and recovery are separate populations.

Percentiles use a mergeable high-dynamic-range histogram configured before the
run. Resolution/range, sample count, interval and aggregation method are stored.
Per-interval histograms are retained so averaging percentiles is unnecessary.
Tail claims are prohibited when sample count cannot support them.

Throughput means correctly committed/completed operations per second at a stated
offered load and concurrency, with error/timeout/queue/resource conditions. Batch
records and requests are both reported to prevent batch-size gaming. Maximum
throughput is the highest sustainable point satisfying all adopted budgets—not
the brief peak before queues or memory grow.

External-authority latency is separated from controllable library overhead.
Simulated profiles are labeled; live observations are compatibility evidence,
not deterministic regression data. Backlog-drain results include arrival stop,
initial queued bytes/items, drain time and correctness after drain.

All future numeric targets live in machine `BUD-*` records adopted through
`PERF-DOC-0002`; prose examples and historical numbers have no gating force.
