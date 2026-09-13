---
id: PERF-DOC-0009
title: Stress, soak and recovery testing
status: approved
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PERF-DOC-0006, PERF-DOC-0008, DOM-DOC-0012]
historical-inputs: [REV-031, REV-032, REV-033, REV-034, REV-035, REV-036]
---

# Stress, soak and recovery testing

## Test families

- **Step/ramp:** locate saturation and validate admission without overshoot.
- **Spike/burst:** test bounded queues, fairness and post-burst drain.
- **Soak:** expose retained memory, descriptors, drift and slow backlog growth.
- **Dependency degradation:** latency, errors, throttling, unavailable key/store/
  endpoint, malformed/uncertain response and clock fault.
- **Resource pressure:** CPU, memory, disk quota/full, descriptors and cancellation.
- **Crash matrix:** terminate at each journal/record/artifact/head/event/attempt
  boundary, restart and verify the unique durable state.
- **Corruption:** modified/missing/truncated/reordered state must quarantine rather
  than self-heal by guessing.

## Oracle

Before and after every run, verify record counts/identities, complete chain,
artifact digests, state transition legality, idempotency, event obligations,
attempt/response linkage and absence of cross-context effects. During long runs,
sample online invariants. A test with impressive throughput but an invalid oracle
is failed evidence.

## Recovery evidence

Record detection time, unavailable interval, data/state loss (must respect the
adopted objective), backlog peak, time to safe service, time to full drain and
manual actions. Recovery starts from trusted persisted state and repeats enough
times to establish variability. Failover/restart scripts are versioned and
noninteractive.

All failure injection is bounded to disposable controlled environments with
synthetic data. Duration and numeric acceptance await calibrated objectives, but
the exhaustive fault catalogue and correctness oracle are required from the
first implementation.
