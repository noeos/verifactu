---
id: PERF-DOC-0012
title: Reliability indicators and objectives
status: draft
authority: normative
owner: reliability-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [PERF-DOC-0002, DOM-DOC-0009, PROD-DOC-0008]
historical-inputs: [REV-031, REV-032, REV-033, REV-034, REV-035, REV-036]
---

# Reliability indicators and objectives

The repository supplies measurement semantics and deployment templates. It does
not claim hosted-service availability it does not operate. An integrator adopts
numeric SLOs after measuring its storage, keys, network, authority dependency and
capacity; product release objectives cover controllable library/adapters only.

## Indicator catalogue

| ID | Indicator | Good/total event boundary |
|---|---|---|
| SLI-0001 | valid command correctness | committed result satisfies all invariants / supported valid commands |
| SLI-0002 | safe rejection | pre-mutation deterministic rejection / supported invalid commands |
| SLI-0003 | durable append success | verified atomic append / eligible append attempts |
| SLI-0004 | chain integrity | verified records / records eligible for verification |
| SLI-0005 | submission processing | correctly classified/reconcilable attempts / eligible attempts |
| SLI-0006 | recovery correctness | recoveries with unique verified state / injected or actual recoveries |
| SLI-0007 | evidence completeness | complete attributable bundles / requested eligible bundles |
| SLI-0008 | latency | events within adopted `BUD-*` / qualifying events |
| SLI-0009 | capacity safety | overloads rejected before mutation / overload events |
| SLI-0010 | isolation/privacy | operations without prohibited crossing/disclosure / all operations |

Unknown/indeterminate outcomes remain in denominators and are reported separately;
dropping them is prohibited. Planned maintenance, caller-invalid input and
authority outage exclusions are explicit, narrow and observable.

## Objective record

An `SLO-*` names SLI/version, scope/mode/edition/environment, objective/window,
error-budget calculation, exclusions, minimum volume, data source, missing-data
rule, owner, alerts, response and review. Safety invariants target zero tolerated
violations and trigger quarantine; statistical availability targets cannot make
one integrity breach acceptable. No numeric SLO is active until calibrated and
adopted through the budget procedure.
