---
id: PERF-DOC-0002
title: Performance and resource budgets
status: draft
authority: normative
owner: performance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0013, PERF-DOC-0001, REQ-DOC-0006]
historical-inputs: [REV-041, REV-042, REV-056, REV-057]
---

# Performance and resource budgets

## Budget classes

- **Correctness/security ceilings** are effective immediately: schema/legal
  maxima, bounded inputs/queues, no partial commits, no uncontrolled allocation
  and timeout/cancellation semantics.
- **Product service objectives** require measured customer/deployment needs and
  a reproducible official environment.
- **Regression budgets** are adopted only after a statistically stable baseline.
- **External dependency budgets** describe integration assumptions; the library
  cannot guarantee them and reports them separately.

The historical `P-01`–`P-12` figures are hypotheses, not inherited gates. No
latency, throughput or memory number becomes normative by repetition in prose.

## Budget record

Every `BUD-*` record contains operation/workload, metric and unit, population and
percentile/window, threshold and direction, warmup/measurement samples, official
environment, adapter/build/toolchain, correctness/error/resource co-conditions,
rationale/source, confidence method, owner, effective date, review trigger and
enforcement stage. Values without all fields are non-binding observations.

## Adoption procedure

1. Establish product capacity need and worst legally supported input.
2. Stabilize implementation, benchmark harness and official environment.
3. Run repeated clean baselines and quantify variability/noise.
4. Propose absolute and regression thresholds with headroom justified by data.
5. Validate they do not reward dropping work or weakening guarantees.
6. Record an ADR and machine budget; then enable its required gate.

## Conflict policy

Correctness, security, legal behavior, durability and evidence override speed.
If a target conflicts, optimize implementation or revise the product/deployment
contract explicitly; never remove verification silently. A missed budget fails
with evidence. Temporary exception follows risk governance, expires and cannot
raise a hard security/legal limit.
