---
id: QA-DOC-0014
title: Performance and resource testing
status: approved
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PERF-INDEX]
sources: [SRC-0038]
decisions: [ADR-0013, ADR-0028]
historical-inputs: [REV-058, REV-060]
---

# Performance and resource testing

Every `PERF-*`, `BUD-*` and `SLO-*` maps to the exact operation, workload,
dataset/edition, concurrency, adapter, environment, warmup, duration, statistic
and enforcing job. Correctness sentinels run before/during/after measurement;
fast incorrect or dropped work fails.

Latency uses coordinated-omission-aware histograms and reports distribution,
not only averages. Resource evidence includes heap/RSS, CPU, event-loop delay,
handles/descriptors, temp/disk, output/backpressure and network bytes. Stress,
soak and recovery locate saturation and verify bounded degradation/cleanup.

PR smoke detects gross regression but cannot satisfy calibrated budgets.
Qualified hardware runners and baseline confidence/noise policy govern release
comparisons. Missing samples, wrong workload, excessive error rate, OOM/timeout,
unowned regression or report mismatch fails rather than printing a warning.
