---
id: ADR-0013
title: Evidence-calibrated performance budgets
status: proposed
authority: decision
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
supersedes: []
requirements: [PERF-0001, PERF-0002, NFR-0003]
risks: [RISK-0007]
---

# ADR-0013: Evidence-calibrated performance budgets

## Context

The previous CI claimed budgets it did not measure. Reusing unproved thresholds
would reward incomplete validation and misrepresent provider/network costs.

## Decision

Define hard safety/resource ceilings immediately. Adopt throughput/latency
release thresholds only from a complete deterministic workload on a calibrated
reference environment. Record distributions, errors, memory and saturation;
prevent coordinated omission; verify correctness before and after measurement.

Old `P-01`–`P-12` are hypotheses to reproduce, adopt or supersede individually.
An optimization may not remove validation, durability, cancellation or evidence.

## Consequences and verification

Early releases cannot advertise arbitrary speed. Benchmark fixtures, raw data,
statistics and environment identities are retained. CI proves each named budget
actually executes, including a deliberately failing fixture.
