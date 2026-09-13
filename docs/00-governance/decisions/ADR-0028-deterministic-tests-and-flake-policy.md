---
id: ADR-0028
title: Deterministic tests and no rerun-to-green
status: proposed
authority: decision
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0016, ADR-0026]
historical-inputs: [REV-059, REV-060, REV-079]
---

# ADR-0028: Deterministic tests and no rerun-to-green

## Decision

Tests own time, randomness, scheduling, locale, timezone, filesystem roots,
ports and external responses wherever the claim permits. Seeds and schedule
traces are retained and replayable. Tests that intentionally exercise real OS,
network, runtime or authority variability are isolated, labelled and interpreted
against a declared statistical or observational contract.

A failed required attempt remains the decision-bearing result. Automatic retry
may diagnose infrastructure only; it cannot replace failure with green. Flakes
are classified as product race, harness nondeterminism, external instability or
runner failure with first-attempt evidence. Quarantine needs an expiring
exception, does not satisfy the affected claim and blocks release if critical.

## Alternatives and consequences

Unlimited retry improves superficial pass rate but destroys evidence. Total
mocking is deterministic but misses integration behavior. Controlled inputs
plus separately governed variability provide reproducibility without hiding
reality, at the cost of clocks, schedulers, fault hooks and hermetic fixtures.

## Verification

The same seed/schedule must reproduce outcomes; injected ambient time/random/
network access fails policy; an intentionally flaky fixture proves first-failure
retention and that reruns cannot make closure succeed.
