---
id: PERF-DOC-0013
title: Performance and reliability evidence
status: draft
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PERF-DOC-0003, PERF-DOC-0010, PERF-DOC-0012]
historical-inputs: [REV-041, REV-042, REV-060, REV-061, REV-062, REV-079]
---

# Performance and reliability evidence

## Evidence bundle

Each run produces a manifest with run ID, source/commit/tree and built-artifact
digests, toolchain/lockfile/harness, workload/data/seed, official environment,
configuration/adapters, start/end/time quality, warmup and measurement protocol,
raw artifact digests, summaries/histograms, correctness/resource/error results,
qualification decision and signatures/attestations where applicable.

Raw data includes per-interval histograms/counters and run metadata in a stable
machine format. Summary generation is deterministic and records generator digest.
Charts are derived convenience views, never the sole evidence. Missing,
truncated, incompatible or digest-mismatched input makes the conclusion invalid.

## Storage and publication

Small manifests and adopted summaries belong in version control. Large raw
artifacts use a controlled immutable store with integrity, access, retention and
locator; CI artifact expiry alone cannot underpin a lasting product claim.
Synthetic datasets and safe profiles are preferred. Any fiscal/personal data
invalidates ordinary publication and invokes privacy/incident handling.

## Claim rules

Every performance statement names operation, workload, build, environment,
statistic/sample and date. Comparative claims name both compatible baselines.
No claim extrapolates to another architecture, adapter, edition, payload or live
authority. Failed/inconclusive runs remain discoverable; only qualified evidence
can satisfy `BUD-*`/`SLO-*`.

## Retention and reproducibility

Evidence underlying a supported release or published claim is retained for the
claim/support lifetime plus the governed evidence period. A scheduled
reproduction detects runtime/hardware/harness drift. A current index maps each
budget, SLO and release to exact evidence and reports orphaned or expired proof.
