---
id: QA-DOC-0007
title: Property-based testing
status: draft
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0027, ADR-0028]
historical-inputs: [REV-059, REV-062]
---

# Property-based testing

The property registry names invariant, domain/preconditions, generator and size
distribution, exclusions, shrinker, oracle, seed policy, minimum executions and
coverage labels. Priority properties cover canonical serialization, hash
sensitivity, parse/serialize limits, state-machine legality, idempotency,
ordering, pagination/correlation, exact decimal/date handling and resource caps.

Generators MUST produce valid and intentionally invalid cases across boundary
classes, not uniform noise rejected at syntax. Preconditions cannot discard more
than an approved ratio; label histograms prove meaningful coverage. Metamorphic
relations must identify transformations that preserve or intentionally change
semantics.

CI records framework/version, seed, path and smallest counterexample. A confirmed
counterexample becomes a named deterministic regression before closure. Zero
runs, excess discards, shrink timeout or serialization loss fail. Generator and
shrinker mutations prove the harness detects biased or empty domains.
