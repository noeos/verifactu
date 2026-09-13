---
id: PERF-DOC-0010
title: Baselines and regression policy
status: approved
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PERF-DOC-0002, PERF-DOC-0003, PERF-DOC-0004]
historical-inputs: [REV-041, REV-042, REV-060, REV-061, REV-062]
---

# Baselines and regression policy

A baseline is an immutable evidence set for exact source/build, workload/data,
environment and harness digests. The protected baseline manifest references raw
runs, summary and correctness results; it does not copy a mutable “latest” file.
Only successful qualified runs can be proposed, and adoption is a reviewed ADR.

## Comparison decision

Candidate and baseline require compatible identities. The gate evaluates every
adopted absolute budget plus predeclared relative distribution/resource rules.
It reports effect size, uncertainty, run-level variability and co-metrics.
Regression in tail, memory, errors or queue growth cannot be hidden by a better
mean. Improvement cannot excuse failed correctness/security.

## Noise and reruns

An inconclusive noisy result is not a pass. Automated rerun count/order is fixed
before observing results and all runs are retained. Persistent noise invalidates
the environment and blocks numeric conclusions. Manual cherry-picking or baseline
replacement to turn red green is prohibited.

## Baseline changes

Update only for an intentional product requirement, accepted justified tradeoff,
official environment bridge or proven harness correction. The proposal compares
old and new, explains all regressions, cites profiling/evidence and retains the
old time series. Security/resource hard ceilings cannot be relaxed through a
baseline update.

PR CI may use stable smoke signals; authoritative regression runs execute in the
qualified environment and return an attributable required status for the exact
commit. Until calibration completes, CI checks harness determinism and safety,
not fictional numerical excellence.
